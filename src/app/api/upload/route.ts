import { NextRequest, NextResponse } from 'next/server';
import csv from 'csv-parser';
import { Readable } from 'stream';
import db from '../../../../lib/db';
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

    const tryParse = (delim: string): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        let data: any[] = [];
        Readable.from(buffer)
          .pipe(csv({ separator: delim, mapHeaders: ({ header }) => header?.replace(/^\uFEFF/, '').trim(), mapValues: ({ value }) => (typeof value === 'string' ? value.trim() : value) }))
          .on('data', (row) => data.push(row))
          .on('end', () => {
            // --- จุดที่แก้ไข ---
            // กรองแถวที่ทุกคอลัมน์เป็นค่าว่างออกไปก่อนส่งผลลัพธ์
            const filteredData = data.filter(row => 
                !Object.values(row).every(val => val === null || val === '')
            );
            resolve(filteredData);
          })
          .on('error', (error) => reject(error));
      });
    };

    let results: any[] = await tryParse(',');
    if (results.length > 0 && Object.keys(results[0] || {}).length <= 1) {
      results = await tryParse('\t');
    }

    if (results.length === 0) {
        return NextResponse.json({ message: 'ไฟล์ CSV ว่างเปล่า' }, { status: 400 });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `INSERT IGNORE INTO subjectType (subjectTypeId, nameSubjectType) VALUES (1, 'บรรยาย'), (2, 'ปฎิบัติ'), (3, 'บรรยาย + ปฎิบัติ')`
    );

    const [existingSubjects]: any = await connection.execute('SELECT subjectId, subjectCode FROM subject');
    const subjectMap: Map<string, number> = new Map(
      (existingSubjects as any[]).map((s: any) => [String(s.subjectCode).trim(), Number(s.subjectId)])
    );

    const [courseRows]: any = await connection.execute('SELECT courseId, nameCourseTh FROM course');
    const courseMap: Map<string, number> = new Map(
      (courseRows as any[]).map((r: any) => [String(r.nameCourseTh).trim(), Number(r.courseId)])
    );

    const [planRows]: any = await connection.execute('SELECT coursePlanId, planCourse FROM coursePlan');
    const coursePlanMap: Map<string, number> = new Map(
      (planRows as any[]).map((r: any) => [String(r.planCourse).trim(), Number(r.coursePlanId)])
    );

    const [categoryRows]: any = await connection.execute('SELECT subjectCategoryId, subjectGroupName FROM subjectCategory');
    const categoryByGroupName: Map<string, number> = new Map(
      (categoryRows as any[]).map((r: any) => [String(r.subjectGroupName).trim(), Number(r.subjectCategoryId)])
    );

    for (let i = 0; i < results.length; i++) {
        const row = results[i];
        const rowNumber = i + 2;

        // กลับมาใช้ requiredFields แบบเดิมที่เข้มงวด
        const requiredFields = ['ชื่อหลักสูตร', 'แผนการเรียน', 'รหัสวิชา', 'ชื่อวิชา(ภาษาไทย)', 'จำนวนหน่วยกิต', 'ปีที่เรียน', 'เทอมที่เรียน'];
        for (const field of requiredFields) {
            if (!row[field]) throw new Error(`แถวที่ ${rowNumber}: ข้อมูลในคอลัมน์ '${field}' ว่างเปล่า`);
        }
        
        const courseName = String(row['ชื่อหลักสูตร']).trim();
        const courseId = courseMap.get(courseName);
        if (!courseId) throw new Error(`แถวที่ ${rowNumber}: ไม่พบหลักสูตรชื่อ '${courseName}' ในฐานข้อมูล`);
        
        const planName = String(row['แผนการเรียน']).trim();
        const normalizedPlan = (() => {
            if (planName.includes('ไม่สหกิจ')) return 'แผนไม่สหกิจศึกษา';
            if (planName.includes('สหกิจ')) return 'แผนสหกิจศึกษา';
            return planName;
        })();
        const coursePlanId = coursePlanMap.get(normalizedPlan);
        if (!coursePlanId) throw new Error(`แถวที่ ${rowNumber}: ไม่พบแผนการเรียนชื่อ '${normalizedPlan}' ในฐานข้อมูล`);

        const categoryGroup = String(row['กลุ่มของวิชาตามหลักสูตร'] || '').trim();
        const subjectCategoryId = categoryByGroupName.get(categoryGroup);
        if (!subjectCategoryId) throw new Error(`แถวที่ ${rowNumber}: ไม่พบกลุ่มวิชาชื่อ '${categoryGroup}' ในฐานข้อมูล`);

        const subjectCode = String(row['รหัสวิชา'] || '').replace(/^'/, '');
        if (!subjectCode) throw new Error(`แถวที่ ${rowNumber}: ข้อมูลในคอลัมน์ 'รหัสวิชา' ว่างเปล่า`);

        const credit = parseInt(row['จำนวนหน่วยกิต'], 10);
        const studyYear = parseInt(row['ปีที่เรียน'], 10);
        const term = parseInt(row['เทอมที่เรียน'], 10);
        
        if (isNaN(credit) || isNaN(studyYear) || isNaN(term)) throw new Error(`แถวที่ ${rowNumber}: 'จำนวนหน่วยกิต', 'ปีที่เรียน', หรือ 'เทอมที่เรียน' ไม่ใช่ตัวเลขที่ถูกต้อง`);

        const lectureHours = parseInt(row['ชั่วโมงบรรยาย'], 10);
        const labHours = parseInt(row['ชั่วโมงปฎิบัติ'], 10);
        const selfHours = parseInt(row['ชั่วโมงเรียนรู้ด้วยตนเอง'], 10);

        if (isNaN(lectureHours) || isNaN(labHours) || isNaN(selfHours)) throw new Error(`แถวที่ ${rowNumber}: ข้อมูลชั่วโมงเรียนไม่ใช่ตัวเลขที่ถูกต้อง`);
        
        const subjectTypeId: number = lectureHours > 0 && labHours > 0 ? 3 : (labHours > 0 ? 2 : 1);
        
        let subjectId: number;

        if (subjectMap.has(subjectCode)) {
            subjectId = subjectMap.get(subjectCode)!;
        } else {
            const [subjectResult]: any = await connection.execute(
                `INSERT INTO subject (courseId, subjectTypeId, subjectCategoryId, subjectCode, nameSubjectThai, nameSubjectEng, credit) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [courseId, subjectTypeId, subjectCategoryId, subjectCode, row['ชื่อวิชา(ภาษาไทย)'], row['ชื่อวิชา(ภาษาอังกฤษ)'], credit]
            );
            subjectId = subjectResult.insertId;

            await connection.execute(
                `INSERT INTO subCredit (subjectId, credit, lectureHours, labHours, bySelfHours) VALUES (?, ?, ?, ?, ?)`,
                [subjectId, credit, lectureHours, labHours, selfHours]
            );
            
            subjectMap.set(subjectCode, subjectId);
        }

        const [existingLink]: any = await connection.execute(
            'SELECT subjectCourseId FROM subjectCourse WHERE subjectId = ? AND coursePlanId = ?',
            [subjectId, coursePlanId]
        );

        if (existingLink.length === 0) {
            await connection.execute(
                `INSERT INTO subjectCourse (subjectId, coursePlanId, studyYear, term) VALUES (?, ?, ?, ?)`,
                [subjectId, coursePlanId, studyYear, term]
            );
        }
    }

    await connection.commit();

    return NextResponse.json({ message: `อัปโหลดสำเร็จ! เพิ่มข้อมูลทั้งหมด ${results.length} แถว`, insertedRows: results.length }, { status: 200 });

  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Upload Error:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}