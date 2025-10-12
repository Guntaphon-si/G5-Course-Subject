import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db'; // ใช้ connection pool เดิมจาก src/lib/db.js

interface Context {
  params: {
    id: string; // ชื่อต้องตรงกับ [id] ในชื่อไฟล์/โฟลเดอร์
  };
}

export interface CoursePlan {
  course_plan_id: number;
  plan_course: string;
}

export interface Subject {
  subject_id: number;
  subject_code: string;
  name_subject_thai: string;
}

export interface DropdownDataResponse {
  course_plans: CoursePlan[];
  subjects: Subject[];
}

export async function GET(request: NextRequest) {
  try {
    const connection = await pool.getConnection();

    // ดึงข้อมูลจากตารางที่ใช้ชื่อ snake_case
    const query_subject = `SELECT * FROM subject`;
    const query_course_plan = `SELECT * FROM course_plan`;

    const [subject_rows]: [any[], any] = await connection.query(query_subject) as [any[], any];
    const [course_plan_rows]: [any[], any] = await connection.query(query_course_plan) as [any[], any];

    connection.release();

    const static_study_years: number[] = [1, 2, 3, 4];
    const static_terms: number[] = [1, 2];

    const response_data = {
      subjects: subject_rows,
      course_plans: course_plan_rows,
      study_years: static_study_years,
      terms: static_terms,
    };

    return NextResponse.json(response_data);

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error during data fetch.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const connection = await pool.getConnection();

    const { course_plan_id, subject_id, study_year, term } = await request.json();

    const sql = `
      INSERT INTO subject_course (course_plan_id, subject_id, part_year, std_term)
      VALUES (?, ?, ?, ?)
    `;

    await connection.query(sql, [course_plan_id, subject_id, study_year, term]);
    connection.release();

    return NextResponse.json(
      { message: 'Subject added successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
