import { NextRequest, NextResponse } from 'next/server';
import csv from 'csv-parser';
import { Readable } from 'stream';
import db from '../../../../lib/db';
import { PoolConnection } from 'mysql2/promise';

export const runtime = 'nodejs';

export const config = { api: { bodyParser: false } };

const subCreditMap = new Map<string, number>([
    ['3-3-0-6', 1],
    ['1-0-3-2', 2],
    ['2-2-0-4', 3],
    ['3-2-3-6', 4],
    ['1-1-0-2', 5],
    ['1-0-2-3', 6],
    ['1-2-0-4', 7],
    ['2-0-6-3', 8],
    ['6-0-0-0', 9],
    ['3-3-0-3', 10],
    ['3-2-2-5', 11],
    ['1-0-3-2', 12],
]);

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
      `INSERT IGNORE INTO subject_type (subject_type_id, name_subject_type) VALUES (1, 'บรรยาย'), (2, 'ปฎิบัติ'), (3, 'บรรยาย + ปฎิบัติ')`
    );
    
    // =================== จุดที่แก้ไข ===================
    // 1. ดึง subject_code และ course_id มาสร้าง key แบบผสมสำหรับเช็คข้อมูลซ้ำ
    const [existingSubjects]: any = await connection.execute('SELECT subject_id, subject_code, course_id FROM subject');
    const subjectMap: Map<string, number> = new Map(
      (existingSubjects as any[]).map((s: any) => [`${String(s.subject_code).trim()}-${s.course_id}`, Number(s.subject_id)])
    );
    // =================================================

    const [courseRows]: any = await connection.execute('SELECT course_id, name_course_use FROM course');
    const courseMap: Map<string, number> = new Map(
      (courseRows as any[]).map((r: any) => [String(r.name_course_use).trim(), Number(r.course_id)])
    );

    const [planRows]: any = await connection.execute('SELECT course_plan_id, plan_course, course_id FROM course_plan');
    const coursePlanMap: Map<string, number> = new Map(
      (planRows as any[]).map((r: any) => [`${r.course_id}-${String(r.plan_course).trim()}`, Number(r.course_plan_id)])
    );

    const [categoryRows]: any = await connection.execute('SELECT subject_category_id, subject_group_name FROM subject_category');
    const categoryByGroupName: Map<string, number> = new Map(
      (categoryRows as any[]).map((r: any) => [String(r.subject_group_name).trim(), Number(r.subject_category_id)])
    );

    for (let i = 0; i < results.length; i++) {
        const row = results[i];
        const rowNumber = i + 2;

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
        const coursePlanCompositeKey = `${courseId}-${normalizedPlan}`;
        const coursePlanId = coursePlanMap.get(coursePlanCompositeKey);
        if (!coursePlanId) throw new Error(`แถวที่ ${rowNumber}: ไม่พบแผนการเรียนชื่อ '${normalizedPlan}' สำหรับหลักสูตร '${courseName}' ในฐานข้อมูล`);

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

        // =================== จุดที่แก้ไข ===================
        // 2. สร้าง key จาก subjectCode และ courseId เพื่อเช็คข้อมูลซ้ำ
        const compositeKey = `${subjectCode}-${courseId}`;
        if (subjectMap.has(compositeKey)) {
            // ถ้ามีอยู่แล้ว (วิชารหัสนี้ในหลักสูตรนี้) ให้ใช้ subject_id เดิม
            subjectId = subjectMap.get(compositeKey)!;
        } else {
            // ถ้ายังไม่มี ให้เพิ่มข้อมูลวิชาใหม่
            const subCreditKey = `${credit}-${lectureHours}-${labHours}-${selfHours}`;
            const subCreditId = subCreditMap.get(subCreditKey);

            if (!subCreditId) {
                throw new Error(`แถวที่ ${rowNumber}: ไม่พบ sub_credit_id สำหรับการกำหนดค่า หน่วยกิต(${credit}), บรรยาย(${lectureHours}), ปฏิบัติ(${labHours}), เรียนรู้เอง(${selfHours})`);
            }

            const [subjectResult]: any = await connection.execute(
                `INSERT INTO subject (course_id, subject_type_id, subject_category_id, sub_credit_id, subject_code, name_subject_thai, name_subject_eng, credit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [courseId, subjectTypeId, subjectCategoryId, subCreditId, subjectCode, row['ชื่อวิชา(ภาษาไทย)'], row['ชื่อวิชา(ภาษาอังกฤษ)'], credit]
            );
            
            subjectId = subjectResult.insertId;
            // 3. เพิ่มข้อมูลใหม่ลงใน map ด้วย key แบบผสม เพื่อป้องกันการเพิ่มซ้ำจากในไฟล์เดียวกัน
            subjectMap.set(compositeKey, subjectId);
        }
        // =================================================

        const [existingLink]: any = await connection.execute(
            'SELECT subject_course_id FROM subject_course WHERE subject_id = ? AND course_plan_id = ?',
            [subjectId, coursePlanId]
        );

        if (existingLink.length === 0) {
            await connection.execute(
                `INSERT INTO subject_course (subject_id, course_plan_id, study_year, study_term) VALUES (?, ?, ?, ?)`,
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