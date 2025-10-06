import { NextRequest, NextResponse } from 'next/server';
import csv from 'csv-parser';
import { Readable } from 'stream';
import db from '@/lib/db';
import { PoolConnection } from 'mysql2/promise';

export const runtime = 'nodejs';

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  let connection: PoolConnection | null = null;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ message: 'ไม่พบไฟล์' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Helper: try parse with delimiter, trim keys/values
    const tryParse = (delim: string): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        const data: any[] = [];
        Readable.from(buffer)
          .pipe(csv({ separator: delim, mapHeaders: ({ header }) => header?.replace(/^\uFEFF/, '').trim(), mapValues: ({ value }) => (typeof value === 'string' ? value.trim() : value) }))
          .on('data', (row) => data.push(row))
          .on('end', () => resolve(data))
          .on('error', (error) => reject(error));
      });
    };

    // Auto-detect delimiter: prefer comma then fallback to tab
    let results: any[] = await tryParse(',');
    if (results.length > 0 && Object.keys(results[0] || {}).length <= 1) {
      results = await tryParse('\t');
    }

    if (results.length === 0) {
        return NextResponse.json({ message: 'ไฟล์ CSV ว่างเปล่า' }, { status: 400 });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // --- เตรียมข้อมูลอ้างอิงจากฐานข้อมูลตามสคีมาใน DW-student-g5 (1).sql ---
    // subjectType: 1 บรรยาย, 2 ปฎิบัติ, 3 บรรยาย + ปฎิบัติ (ตามไฟล์ SQL)
    await connection.execute(
      `INSERT IGNORE INTO subjectType (subjectTypeId, nameSubjectType) VALUES (1, 'บรรยาย'), (2, 'ปฎิบัติ'), (3, 'บรรยาย + ปฎิบัติ')`
    );

    const courseName = results[0]['ชื่อหลักสูตร'];
    let planName = results[0]['แผนการเรียน'];
    if (!courseName) {
      throw new Error("ไม่พบคอลัมน์ 'ชื่อหลักสูตร' หรือค่าเป็นค่าว่างในแถวแรกของไฟล์ CSV");
    }
    if (!planName) {
      throw new Error("ไม่พบคอลัมน์ 'แผนการเรียน' หรือค่าเป็นค่าว่างในแถวแรกของไฟล์ CSV");
    }
    // Normalize plan keywords to match DB values
    const normalizedPlan = (() => {
      const p = String(planName);
      if (p.includes('ไม่สหกิจ')) return 'แผนไม่สหกิจศึกษา';
      if (p.includes('สหกิจ')) return 'แผนสหกิจศึกษา';
      return p;
    })();

    // หา course จาก nameCourseTh
    const [courseRows]: any = await connection.execute(
      'SELECT courseId FROM course WHERE nameCourseTh = ? LIMIT 1',
      [courseName]
    );
    if (!courseRows || courseRows.length === 0) {
      throw new Error(`ไม่พบหลักสูตร (course.nameCourseTh) = '${courseName}' ในตาราง course`);
    }
    const courseId: number = courseRows[0].courseId;

    // หา coursePlan จาก planCourse ของหลักสูตรนั้น
    const [planRows]: any = await connection.execute(
      'SELECT coursePlanId FROM coursePlan WHERE courseId = ? AND (planCourse = ? OR planCourse LIKE ?) LIMIT 1',
      [courseId, normalizedPlan, `%${planName}%`]
    );
    if (!planRows || planRows.length === 0) {
      throw new Error(`ไม่พบแผนการเรียนในฐานข้อมูล: '${planName}' (ลองใช้ '${normalizedPlan}')`);
    }
    const coursePlanId: number = planRows[0].coursePlanId;

    // เตรียม Map ของ subjectCategory โดย match จาก subjectGroupName ตามที่ผู้ใช้ระบุ
    const [categoryRows]: any = await connection.execute(
      'SELECT subjectCategoryId, subjectCategoryName, subjectGroupName FROM subjectCategory'
    );
    const categoryByGroupName: Map<string, { id: number; name: string }> = new Map(
      (categoryRows as any[]).map((r: any) => [String(r.subjectGroupName).trim(), { id: Number(r.subjectCategoryId), name: String(r.subjectCategoryName) }])
    );

    // ตรวจสอบคอลัมน์ใน subCredit เพื่อรองรับการเอา lectureCredit/labCredit ออก
    const [subCreditCols]: any = await connection.query('SHOW COLUMNS FROM subCredit');
    const subCreditFields = new Set((subCreditCols as any[]).map((c: any) => String(c.Field)));
    const hasLectureCreditCol = subCreditFields.has('lectureCredit');
    const hasLabCreditCol = subCreditFields.has('labCredit');
    const hasCreditCol = subCreditFields.has('credit');

    // --- วนลูปเพื่อตรวจสอบและเพิ่มข้อมูล ---
    for (let i = 0; i < results.length; i++) {
        const row = results[i];
        const rowNumber = i + 2; // +2 เพราะ index เริ่มที่ 0 และมี header 1 แถว

        // **ส่วนของการตรวจสอบข้อมูล (Data Validation)**
        const requiredFields = ['รหัสวิชา', 'ชื่อวิชา(ภาษาไทย)', 'ชื่อวิชา(ภาษาอังกฤษ)', 'จำนวนหน่วยกิต'];
        for (const field of requiredFields) {
            if (!row[field]) {
                throw new Error(`แถวที่ ${rowNumber}: ข้อมูลในคอลัมน์ '${field}' ว่างเปล่า`);
            }
        }
        
        const credit = parseInt(row['จำนวนหน่วยกิต'], 10);
        if (isNaN(credit)) {
            throw new Error(`แถวที่ ${rowNumber}: 'จำนวนหน่วยกิต' (${row['จำนวนหน่วยกิต']}) ไม่ใช่ตัวเลขที่ถูกต้อง`);
        }

        const lectureHours = parseInt(row['ชั่วโมงบรรยาย'], 10);
        if (isNaN(lectureHours)) {
            throw new Error(`แถวที่ ${rowNumber}: 'ชั่วโมงบรรยาย' (${row['ชั่วโมงบรรยาย']}) ไม่ใช่ตัวเลขที่ถูกต้อง`);
        }

        const labHours = parseInt(row['ชั่วโมงปฎิบัติ'], 10);
        if (isNaN(labHours)) {
            throw new Error(`แถวที่ ${rowNumber}: 'ชั่วโมงปฎิบัติ' (${row['ชั่วโมงปฎิบัติ']}) ไม่ใช่ตัวเลขที่ถูกต้อง`);
        }

        const selfHours = parseInt(row['ชั่วโมงเรียนรู้ด้วยต้นเอง'], 10);
        if (isNaN(selfHours)) {
            throw new Error(`แถวที่ ${rowNumber}: 'ชั่วโมงเรียนรู้ด้วยต้นเอง' (${row['ชั่วโมงเรียนรู้ด้วยต้นเอง']}) ไม่ใช่ตัวเลขที่ถูกต้อง`);
        }

        const factValue = row['fact (ต้องเรียน :  0 , เลือกเรียนตัวไหนก็ได้ในหมวดเดียวกัน : 1)'];
        if (factValue !== '0' && factValue !== '1') {
            throw new Error(`แถวที่ ${rowNumber}: ค่าในคอลัมน์ 'fact' (${factValue}) ต้องเป็น 0 หรือ 1 เท่านั้น`);
        }

        const categoryGroup = String(row['กลุ่มของวิชาตามหลักสูตร'] || '').trim();
        const cat = categoryByGroupName.get(categoryGroup);
        if (!cat) {
            throw new Error(`แถวที่ ${rowNumber}: ไม่พบ subjectCategory.subjectGroupName = '${categoryGroup}'`);
        }
        const subjectCategoryId: number = cat.id;

        // กำหนด subjectTypeId จากชั่วโมงบรรยาย/ปฎิบัติ (ตามสคีมา)
        const subjectTypeId: number = lectureHours > 0 && labHours > 0 ? 3 : (labHours > 0 ? 2 : 1);

        // --- ตรวจสอบซ้ำ: ถ้ามี subject ซ้ำ (ตาม subjectCode + courseId) ให้ข้าม ---
        const [dupRows]: any = await connection.execute(
          'SELECT subjectId FROM subject WHERE courseId = ? AND subjectCode = ? LIMIT 1',
          [courseId, row['รหัสวิชา']]
        );
        if (dupRows && dupRows.length > 0) {
          continue; // ข้ามรายการที่ซ้ำ
        }

        // ไม่ต้องบันทึก lectureCredit/labCredit ตามคำขอ → ตั้งค่าเป็น 0
        const lectureCredit = 0;
        const labCredit = 0;

        // --- เพิ่มข้อมูลลงฐานข้อมูล ---
        const [subjectResult]: any = await connection.execute(
            `INSERT INTO subject (courseId, subjectTypeId, subjectCategoryId, subjectCode, nameSubjectThai, nameSubjectEng, credit) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [courseId, subjectTypeId, subjectCategoryId, row['รหัสวิชา'], row['ชื่อวิชา(ภาษาไทย)'], row['ชื่อวิชา(ภาษาอังกฤษ)'], credit]
        );
        const newSubjectId = subjectResult.insertId;

        await connection.execute(
            `INSERT INTO subCredit (subjectId, credit, lectureHours, labHours, bySelfHours) VALUES (?, ?, ?, ?, ?)`,
            [newSubjectId, credit, lectureHours, labHours, selfHours]
        );
        
        await connection.execute(
            `INSERT INTO subjectCourse (subjectId, coursePlanId) VALUES (?, ?)`,
            [newSubjectId, coursePlanId]
        );
    }

    await connection.commit();

    return NextResponse.json({ message: `อัปโหลดสำเร็จ! เพิ่มข้อมูลทั้งหมด ${results.length} แถว`, insertedRows: results.length }, { status: 200 });

  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Upload Error:", error);
    // ตอบกลับด้วย status 400 (Bad Request) ซึ่งเหมาะสมสำหรับข้อผิดพลาดที่มาจากข้อมูลที่ผู้ใช้ส่งมา
    return NextResponse.json({ message: error.message }, { status: 400 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}