import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { PoolConnection } from 'mysql2/promise';

/**
 * GET: ดึงข้อมูลหลักสูตรทั้งหมดที่ is_visible = 1
 *  cp.general_subject_credit,
        cp.specific_subject_credit,
        cp.free_subject_credit,
        cp.core_subject_credit,
        cp.special_subject_credit,
        cp.select_subject_credit,
        cp.happy_subject_credit,
        cp.entrepreneurship_subject_credit,
        cp.language_subject_credit,
        cp.people_subject_credit,
        cp.aesthetics_subject_credit,
 */
export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT 
        cp.course_plan_id,
        c.name_course_use,
        cp.plan_course,
        cp.total_credit,
        cp.internship_hours,
        cp.credit_intern 
      FROM course_plan cp
      INNER JOIN course c ON c.course_id = cp.course_id 
      WHERE cp.is_visible = 1`
    );
    connection.release();
    
    const dataWithKeys = (rows as any[]).map(row => ({
      ...row,
      key: row.course_plan_id
    }));

    return NextResponse.json(dataWithKeys);

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST: สร้างหลักสูตร, แผนการเรียน, และหน่วยกิตขั้นต่ำ
 */
export async function POST(request: NextRequest) {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const body = await request.json();
    
    // 1. เพิ่มข้อมูลลงตาราง course
    // แก้ไข: เปลี่ยนตัวแปรเป็น snake_case ทั้งหมด
    const {
      name_course_th, name_course_use, name_course_eng, name_full_degree_th, name_full_degree_eng,
      name_initials_degree_th, name_initials_degree_eng, plan_course, total_credit,
      general_subject_credit, specific_subject_credit, free_subject_credit, core_subject_credit,
      special_subject_credit,
      select_subject_credit, happy_subject_credit, entrepreneurship_subject_credit,
      language_subject_credit, people_subject_credit, aesthetics_subject_credit, internship_hours,
      credit_intern,department_id
    } = body;

    const [courseResult]: any = await connection.execute(
        `INSERT INTO course (name_course_th, name_course_use, name_course_eng, name_full_degree_th, name_full_degree_eng, name_initials_degree_th, name_initials_degree_eng, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name_course_th, name_course_use, name_course_eng, name_full_degree_th, name_full_degree_eng, name_initials_degree_th, name_initials_degree_eng,department_id]
    );
    const course_id = courseResult.insertId;

    // 2. เพิ่มข้อมูลลงตาราง course_plan
    const [planResult]: any = await connection.execute(
        `INSERT INTO course_plan (course_id, plan_course, total_credit, general_subject_credit, specific_subject_credit, free_subject_credit, core_subject_credit, special_subject_credit, select_subject_credit, happy_subject_credit, entrepreneurship_subject_credit, language_subject_credit, people_subject_credit, aesthetics_subject_credit, internship_hours, credit_intern, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [course_id, plan_course, total_credit, general_subject_credit, specific_subject_credit, free_subject_credit, core_subject_credit, special_subject_credit, select_subject_credit, happy_subject_credit, entrepreneurship_subject_credit, language_subject_credit, people_subject_credit, aesthetics_subject_credit, internship_hours, credit_intern]
    );
    const course_plan_id = planResult.insertId;

    // 3. เพิ่มข้อมูลลงตาราง credit_require
    const [categoryRows]: any = await connection.execute('SELECT subject_category_id, subject_group_name FROM subjectCategory');
    const categoryMap = new Map(categoryRows.map((row: any) => [row.subject_group_name, row.subject_category_id]));

    // แก้ไข: เปลี่ยน key เป็น snake_case
    const creditMapping = {
        core_subject_credit: 'วิชาแกน',
        special_subject_credit: 'วิชาเฉพาะด้าน',
        select_subject_credit: 'วิชาเลือก',
        happy_subject_credit: 'กลุ่มสาระอยู่ดีมีสุข',
        entrepreneurship_subject_credit: 'กลุ่มสาระศาสตร์แห่งผู้ประกอบการ',
        language_subject_credit: 'กลุ่มสาระภาษากับการสื่อสาร',
        people_subject_credit: 'กลุ่มสาระพลเมืองไทยและพลเมืองโลก',
        aesthetics_subject_credit: 'กลุ่มสาระสุนทรียศาสตร์'
    };

    for (const [bodyKey, groupName] of Object.entries(creditMapping)) {
        const creditSubject = body[bodyKey];
        const subjectCategoryId = categoryMap.get(groupName);

        if (subjectCategoryId) {
            await connection.execute(
                'INSERT INTO credit_require (course_plan_id, subject_category_id, credit_subject) VALUES (?, ?, ?)',
                [course_plan_id, subjectCategoryId, creditSubject]
            );
        }
    }

    await connection.commit();
    
    // แก้ไข: ส่ง course_id กลับไป
    return NextResponse.json({ message: 'สร้างหลักสูตรสำเร็จ', course_id: course_id }, { status: 201 });

  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error('POST /api/course error', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    if (connection) {
        connection.release();
    }
  }
}

/**
 * PATCH: ซ่อนหลักสูตร (set is_visible = 0)
 */
export async function PATCH(request: NextRequest) {
  let connection: PoolConnection | null = null;
  try {
    // แก้ไข: รับ course_plan_id
    const { course_plan_id } = await request.json();

    if (!course_plan_id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      "UPDATE `course_plan` SET is_visible = 0 WHERE course_plan_id = ?", 
      [course_plan_id]
    );
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: "Course Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course hidden successfully" });

  } catch (error: any) {
    console.error('PATCH /api/course error', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}