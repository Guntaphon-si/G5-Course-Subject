import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';// ใช้ connection pool เดิมจาก src/lib/db.js

export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT coursePlanId,nameCourseTh,planCourse,totalCredit,generalSubjectCredit,specificSubjectCredit,freeSubjectCredit,coreSubjectCredit,spacailSubjectCredit,selectSubjectCredit,happySubjectCredit,entrepreneurshipSubjectCredit,languageSubjectCredit,peopleSubjectCredit,aestheticsSubjectCredit,internshipHours,creditIntern FROM `coursePlan` INNER JOIN course ON course.courseId = coursePlan.courseId WHERE isVisible = 1");
    connection.release();
    
    // Ant Design Table ต้องการ key ที่ไม่ซ้ำกันในแต่ละแถว
    // เราจะใช้ id จากฐานข้อมูลมาเป็น key
    const dataWithKeys = rows.map(row => ({
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
export async function POST(request: NextRequest) {
  let connection: any;
  try {
    const body = await request.json();
    // ค่าที่ต้องการสำหรับตาราง course
    const nameCourseTh: string = body.nameCourseTh;
    const nameCourseUse: string = body.nameCourseUse || body.nameCourseTh;
    const nameCourseEng: string = body.nameCourseEng || '';
    const nameFullDegreeTh: string = body.nameFullDegreeTh || '';
    const nameFullDegreeEng: string = body.nameFullDegreeEng || '';
    const nameInitialsDegreeTh: string = body.nameInitialsDegreeTh || '';
    const nameInitialsDegreeEng: string = body.nameInitialsDegreeEng || '';

    // ค่าที่ต้องการสำหรับตาราง coursePlan
    const planCourse: string = body.planCourse; // เช่น แผนสหกิจศึกษา/แผนไม่สหกิจศึกษา
    const totalCredit: number = Number(body.totalCredit ?? 0);
    const generalSubjectCredit: number = Number(body.generalSubjectCredit ?? 0);
    const specificSubjectCredit: number = Number(body.specificSubjectCredit ?? 0);
    const freeSubjectCredit: number = Number(body.freeSubjectCredit ?? 0);
    const coreSubjectCredit: number = Number(body.coreSubjectCredit ?? 0);
    const spacailSubjectCredit: number = Number(body.spacailSubjectCredit ?? 0);
    const selectSubjectCredit: number = Number(body.selectSubjectCredit ?? 0);
    const happySubjectCredit: number = Number(body.happySubjectCredit ?? 0);
    const entrepreneurshipSubjectCredit: number = Number(body.entrepreneurshipSubjectCredit ?? 0);
    const languageSubjectCredit: number = Number(body.languageSubjectCredit ?? 0);
    const peopleSubjectCredit: number = Number(body.peopleSubjectCredit ?? 0);
    const aestheticsSubjectCredit: number = Number(body.aestheticsSubjectCredit ?? 0);
    const internshipHours: number = Number(body.internshipHours ?? 0);
    const creditIntern: number = Number(body.creditIntern ?? 0);
    const isVisible: number = Number(body.isVisible ?? 1);

    if (!nameCourseTh || !planCourse) {
      return NextResponse.json({ message: 'จำเป็นต้องระบุ nameCourseTh และ planCourse' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // แทรก course
    const [courseResult] = await connection.query(
      'INSERT INTO course (nameCourseTh, nameCourseUse, nameCourseEng, nameFullDegreeTh, nameFullDegreeEng, nameInitialsDegreeTh, nameInitialsDegreeEng) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nameCourseTh, nameCourseUse, nameCourseEng, nameFullDegreeTh, nameFullDegreeEng, nameInitialsDegreeTh, nameInitialsDegreeEng]
    );
    const courseId = courseResult.insertId;

    // แทรก coursePlan
    await connection.query(
      'INSERT INTO coursePlan (courseId, planCourse, totalCredit, generalSubjectCredit, specificSubjectCredit, freeSubjectCredit, coreSubjectCredit, spacailSubjectCredit, selectSubjectCredit, happySubjectCredit, entrepreneurshipSubjectCredit, languageSubjectCredit, peopleSubjectCredit, aestheticsSubjectCredit, internshipHours, creditIntern, isVisible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [courseId, planCourse, totalCredit, generalSubjectCredit, specificSubjectCredit, freeSubjectCredit, coreSubjectCredit, spacailSubjectCredit, selectSubjectCredit, happySubjectCredit, entrepreneurshipSubjectCredit, languageSubjectCredit, peopleSubjectCredit, aestheticsSubjectCredit, internshipHours, creditIntern, isVisible]
    );

    await connection.commit();
    connection.release();
    return NextResponse.json({ message: 'สร้างหลักสูตรสำเร็จ', courseId }, { status: 201 });
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('POST /api/course error', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
export async function PATCH(request) {
  try {
    // 1. อ่านข้อมูล id จาก request body
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required in the body" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    const sql = "UPDATE `coursePlan` SET isVisible = 0 WHERE coursePlanId = ?";
    const [result] = await connection.query(sql, [id]);
    connection.release();

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course hidden successfully" }, { status: 200 });

  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}