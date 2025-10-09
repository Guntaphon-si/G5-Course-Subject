import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { PoolConnection } from 'mysql2/promise';

/**
 * GET: ดึงข้อมูล coursePlan ทั้งหมดที่ isVisible = 1
 */
export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT 
          cp.course_plan_id,
          cp.course_id,
          c.name_course_th,
          cp.plan_course,
          cp.total_credit,
          cp.general_subject_credit,
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
          cp.internship_hours,
          cp.credit_intern
      FROM course_plan cp
      INNER JOIN course c ON c.course_id = cp.course_id
      WHERE cp.is_visible = 1;`
    );
    connection.release();
    
    const dataWithKeys = (rows as any[]).map(row => ({
      ...row,
      key: row.coursePlanId
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
 * POST: สร้าง coursePlan ใหม่ (ไม่สร้าง course ใหม่)
 */
export async function POST(request: NextRequest) {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const body = await request.json();
    
    const {
      courseId,
      planCourse,
      totalCredit,
      generalSubjectCredit,
      specificSubjectCredit,
      freeSubjectCredit,
      coreSubjectCredit,
      spacailSubjectCredit,
      selectSubjectCredit,
      happySubjectCredit,
      entrepreneurshipSubjectCredit,
      languageSubjectCredit,
      peopleSubjectCredit,
      aestheticsSubjectCredit,
      internshipHours,
      creditIntern
    } = body;

    // ตรวจสอบว่ามี courseId
    if (!courseId) {
      await connection.rollback();
      return NextResponse.json({ message: "courseId is required" }, { status: 400 });
    }

    // เพิ่มข้อมูลลงตาราง coursePlan
    const [planResult]: any = await connection.execute(
      `INSERT INTO course_plan (
        course_id,
        plan_course,
        total_credit,
        general_subject_credit,
        specific_subject_credit,
        free_subject_credit,
        core_subject_credit,
        special_subject_credit,
        select_subject_credit,
        happy_subject_credit,
        entrepreneurship_subject_credit,
        language_subject_credit,
        people_subject_credit,
        aesthetics_subject_credit,
        internship_hours,
        credit_intern,
        is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        courseId, planCourse, totalCredit, generalSubjectCredit,
        specificSubjectCredit, freeSubjectCredit, coreSubjectCredit,
        spacailSubjectCredit, selectSubjectCredit, happySubjectCredit,
        entrepreneurshipSubjectCredit, languageSubjectCredit,
        peopleSubjectCredit, aestheticsSubjectCredit, internshipHours,
        creditIntern
      ]
    );
    const coursePlanId = planResult.insertId;

    // เพิ่มข้อมูลลงตาราง creditRequire
    const [categoryRows]: any = await connection.execute(
      'SELECT subject_category_id, subject_group_name FROM subject_category'
    );
    const categoryMap = new Map(
      categoryRows.map((row: any) => [row.subject_group_name, row.subject_category_id])
    );

    const creditMapping: Record<string, string> = {
      coreSubjectCredit: 'วิชาแกน',
      spacailSubjectCredit: 'วิชาเฉพาะด้าน',
      selectSubjectCredit: 'วิชาเลือก',
      happySubjectCredit: 'กลุ่มสาระอยู่ดีมีสุข',
      entrepreneurshipSubjectCredit: 'กลุ่มสาระศาสตร์แห่งผู้ประกอบการ',
      languageSubjectCredit: 'กลุ่มสาระภาษากับการสื่อสาร',
      peopleSubjectCredit: 'กลุ่มสาระพลเมืองไทยและพลเมืองโลก',
      aestheticsSubjectCredit: 'กลุ่มสาระสุนทรียศาสตร์'
    };

    for (const [bodyKey, groupName] of Object.entries(creditMapping)) {
      const creditSubject = body[bodyKey] || 0;
      const subjectCategoryId = categoryMap.get(groupName);

      if (subjectCategoryId) {
        await connection.execute(
          'INSERT INTO credit_require (course_plan_id, subject_category_id, credit_subject) VALUES (?, ?, ?)',
          [coursePlanId, subjectCategoryId, creditSubject]
        );
      }
    }

    await connection.commit();
    
    return NextResponse.json(
      { message: 'สร้างแผนการเรียนสำเร็จ', coursePlanId },
      { status: 201 }
    );

  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error('POST /api/coursePlan error', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * PATCH: ซ่อน coursePlan (set isVisible = 0)
 */
export async function PATCH(request: NextRequest) {
  let connection: PoolConnection | null = null;
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      "UPDATE course_plan SET is_visible = 0 WHERE course_plan_id = ?",
      [id]
    );
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Course Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Course Plan hidden successfully" });

  } catch (error: any) {
    console.error('PATCH /api/coursePlan error', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}