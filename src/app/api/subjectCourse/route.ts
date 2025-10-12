import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import pool from '../../../../lib/db'; // ใช้ connection pool เดิมจาก src/lib/db.js

interface Context {
  params: {
    id: string; // ต้องตรงกับ [id] ในชื่อไฟล์/โฟลเดอร์
  };
}

export async function GET(request: NextRequest) {
  try {
    const connection = await pool.getConnection();
    const search_params = request.nextUrl.searchParams;
    const course_plan_id = search_params.get('id');

    const sql_query = `
      SELECT 
          subject_course.subject_course_id AS subject_course_id,
          course.name_course_use AS name_course_use,
          course_plan.plan_course AS plan_course,
          subject.subject_code AS subject_code,
          subject.name_subject_thai AS name_subject_thai,
          subject.name_subject_eng AS name_subject_eng,
          subject_category.category_name AS subject_category_name,
          subject_category.master_category AS subject_group_name,
          subject_course.part_year AS study_year,
          subject_course.std_term AS term
      FROM subject_course
      INNER JOIN course_plan ON subject_course.course_plan_id = course_plan.course_plan_id
      INNER JOIN course ON course_plan.course_id = course.course_id
      INNER JOIN subject ON subject_course.subject_id = subject.subject_id
      INNER JOIN subject_category ON subject.subject_category_id = subject_category.subject_category_id
      WHERE 
          course_plan.is_visible = 1
          AND subject.is_visible = 1
          AND subject_course.course_plan_id = ?;
    `;

    const [rows] = await connection.query(sql_query, [course_plan_id]);
    connection.release();

    const data_with_keys = (rows as RowDataPacket[]).map((row: any) => ({
      ...row,
      key: row.subject_course_id
    }));

    return NextResponse.json(data_with_keys);

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id: subject_course_id } = await request.json();
    console.log(`subject_course_id: ${subject_course_id}`);

    if (!subject_course_id) {
      return NextResponse.json(
        { message: 'Missing subject_course_id in request body' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    const sql_query = `DELETE FROM subject_course WHERE subject_course_id = ?`;
    const [result] = await connection.query(sql_query, [subject_course_id]);
    connection.release();

    if ('affectedRows' in result && result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Subject course not found or already deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `Subject course with ID ${subject_course_id} successfully deleted.` },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
