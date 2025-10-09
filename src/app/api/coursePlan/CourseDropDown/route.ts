import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

/**
 * GET: ดึงข้อมูลหลักสูตรทั้งหมดสำหรับใช้ใน Dropdown โดยเฉพาะ
 * Endpoint นี้จะคืนค่าเฉพาะ courseId และ nameCourseTh
 */
export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT courseId, nameCourseTh ,nameCourseUse FROM course`
    );
    connection.release();
    
    return NextResponse.json(rows);

  } catch (error) {
    console.error("Database Error (courses-for-dropdown):", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
