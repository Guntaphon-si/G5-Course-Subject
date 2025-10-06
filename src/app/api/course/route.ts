import { NextResponse } from 'next/server';
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