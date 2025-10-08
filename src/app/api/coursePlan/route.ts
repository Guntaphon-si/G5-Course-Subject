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
        cp.coursePlanId,
        cp.courseId,
        c.nameCourseTh,
        cp.planCourse,
        cp.totalCredit,
        cp.generalSubjectCredit,
        cp.specificSubjectCredit,
        cp.freeSubjectCredit,
        cp.coreSubjectCredit,
        cp.spacailSubjectCredit,
        cp.selectSubjectCredit,
        cp.happySubjectCredit,
        cp.entrepreneurshipSubjectCredit,
        cp.languageSubjectCredit,
        cp.peopleSubjectCredit,
        cp.aestheticsSubjectCredit,
        cp.internshipHours,
        cp.creditIntern 
      FROM coursePlan cp
      INNER JOIN course c ON c.courseId = cp.courseId 
      WHERE cp.isVisible = 1`
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
      `INSERT INTO coursePlan (
        courseId, planCourse, totalCredit, generalSubjectCredit, 
        specificSubjectCredit, freeSubjectCredit, coreSubjectCredit, 
        spacailSubjectCredit, selectSubjectCredit, happySubjectCredit, 
        entrepreneurshipSubjectCredit, languageSubjectCredit, 
        peopleSubjectCredit, aestheticsSubjectCredit, internshipHours, 
        creditIntern, isVisible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
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
      'SELECT subjectCategoryId, subjectGroupName FROM subjectCategory'
    );
    const categoryMap = new Map(
      categoryRows.map((row: any) => [row.subjectGroupName, row.subjectCategoryId])
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
          'INSERT INTO creditRequire (coursePlanId, subjectCategoryId, creditSubject) VALUES (?, ?, ?)',
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
      "UPDATE coursePlan SET isVisible = 0 WHERE coursePlanId = ?",
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