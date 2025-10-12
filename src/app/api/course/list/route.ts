import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Read all courses for dropdown
export async function GET(req: NextRequest) {
  try {
    const query = `
      SELECT 
        course_id AS courseId,
        name_course_use AS nameCourseUse
      FROM course
      WHERE name_course_use IS NOT NULL
      ORDER BY name_course_use ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query);

    return NextResponse.json({ 
      success: true, 
      items: rows 
    });
  } catch (error: any) {
    console.error('GET /api/courses/list error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหลักสูตร' },
      { status: 500 }
    );
  }
}