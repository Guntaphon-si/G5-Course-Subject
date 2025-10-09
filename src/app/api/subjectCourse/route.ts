import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';// ใช้ connection pool เดิมจาก src/lib/db.js

interface Context {
    params: {
        id: string; // ชื่อต้องตรงกับ [id] ในชื่อไฟล์/โฟลเดอร์
    };
}

export async function GET(request: NextRequest) {
  try {
    const connection = await pool.getConnection();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const sqlQuery = `
    SELECT 
        subjectCourseId, 
        nameFullDegreeTh, 
        planCourse, 
        nameSubjectThai, 
        nameSubjectEng, 
        subjectCategoryName, 
        subjectGroupName, 
        studyYear, 
        term 
    FROM \`subjectCourse\` 
    INNER JOIN coursePlan ON subjectCourse.coursePlanId = coursePlan.coursePlanId 
    INNER JOIN course ON coursePlan.courseId = course.courseId 
    INNER JOIN subject ON subjectCourse.subjectId = subject.subjectId 
    INNER JOIN subjectCategory ON subject.subjectCategoryId = subjectCategory.subjectCategoryId 
    WHERE 
        coursePlan.isVisible = 1 AND 
        subject.isVisible = 1 AND 
        subjectCourse.coursePlanId = ? `;
    const [rows] = await connection.query(sqlQuery, [id]);
    connection.release();
    
    // Ant Design Table ต้องการ key ที่ไม่ซ้ำกันในแต่ละแถว
    // เราจะใช้ id จากฐานข้อมูลมาเป็น key
    const dataWithKeys = rows.map(row => ({
      ...row,
      key: row.subjectCourseId
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

export async function DELETE(request: NextRequest, context: Context) {
  try {
    // 1. อ่านข้อมูล id จาก request body
    const { id } = await request.json();
    console.log(` id: ${id}`);
    
    if (!id) {
      return NextResponse.json({ message: "Missing subjectCourse ID in path" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    const sqlQuery = `DELETE FROM subjectCourse WHERE subjectCourseId = ?`;
    const [result] = await connection.query(sqlQuery, [id]);
    connection.release();

    if ('affectedRows' in result && result.affectedRows === 0) {
            return NextResponse.json(
            { message: 'Course not found or already deleted.' },
            { status: 404 } // Not Found
        );
    }

    // 5. ส่งสถานะความสำเร็จกลับไป
    return NextResponse.json(
        { message: `Subject course with ID ${id} successfully deleted (or hidden).` }, 
        { status: 200 } // OK
    );

  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}