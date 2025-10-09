import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { PoolConnection } from 'mysql2/promise';

/**
 * GET: ดึงข้อมูลหลักสูตรทั้งหมดที่ isVisible = 1
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
    
    // Ant Design Table ต้องการ key ที่ไม่ซ้ำกันในแต่ละแถว
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
    const {
      nameCourseTh, nameCourseUse, nameCourseEng, nameFullDegreeTh, nameFullDegreeEng,
      nameInitialsDegreeTh, nameInitialsDegreeEng, planCourse, totalCredit,
      generalSubjectCredit, specificSubjectCredit, freeSubjectCredit, coreSubjectCredit,
      spacailSubjectCredit, selectSubjectCredit, happySubjectCredit, entrepreneurshipSubjectCredit,
      languageSubjectCredit, peopleSubjectCredit, aestheticsSubjectCredit, internshipHours,
      creditIntern
    } = body;

    const [courseResult]: any = await connection.execute(
        `INSERT INTO course (nameCourseTh, nameCourseUse, nameCourseEng, nameFullDegreeTh, nameFullDegreeEng, nameInitialsDegreeTh, nameInitialsDegreeEng) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nameCourseTh, nameCourseUse, nameCourseEng, nameFullDegreeTh, nameFullDegreeEng, nameInitialsDegreeTh, nameInitialsDegreeEng]
    );
    const courseId = courseResult.insertId;

    // 2. เพิ่มข้อมูลลงตาราง coursePlan
    const [planResult]: any = await connection.execute(
        `INSERT INTO coursePlan (courseId, planCourse, totalCredit, generalSubjectCredit, specificSubjectCredit, freeSubjectCredit, coreSubjectCredit, spacailSubjectCredit, selectSubjectCredit, happySubjectCredit, entrepreneurshipSubjectCredit, languageSubjectCredit, peopleSubjectCredit, aestheticsSubjectCredit, internshipHours, creditIntern, isVisible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [courseId, planCourse, totalCredit, generalSubjectCredit, specificSubjectCredit, freeSubjectCredit, coreSubjectCredit, spacailSubjectCredit, selectSubjectCredit, happySubjectCredit, entrepreneurshipSubjectCredit, languageSubjectCredit, peopleSubjectCredit, aestheticsSubjectCredit, internshipHours, creditIntern]
    );
    const coursePlanId = planResult.insertId;

    // 3. เพิ่มข้อมูลลงตาราง creditRequire
    const [categoryRows]: any = await connection.execute('SELECT subjectCategoryId, subjectGroupName FROM subjectCategory');
    const categoryMap = new Map(categoryRows.map((row: any) => [row.subjectGroupName, row.subjectCategoryId]));

    const creditMapping = {
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
        const creditSubject = body[bodyKey];
        const subjectCategoryId = categoryMap.get(groupName);

        if (subjectCategoryId) {
            await connection.execute(
                'INSERT INTO creditRequire (coursePlanId, subjectCategoryId, creditSubject) VALUES (?, ?, ?)',
                [coursePlanId, subjectCategoryId, creditSubject]
            );
        }
    }

    await connection.commit();
    
    return NextResponse.json({ message: 'สร้างหลักสูตรสำเร็จ', courseId }, { status: 201 });

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
 * PATCH: ซ่อนหลักสูตร (set isVisible = 0)
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
      "UPDATE `course_plan` SET is_visible = 0 WHERE course_plan_id = ?", 
      [id]
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