import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

/**
 * GET: ดึงข้อมูลหมวดวิชาทั้งหมด
 * ใช้สำหรับแสดงในฟอร์ม checkbox
 */
export async function GET() {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      `SELECT 
        subject_category_id,
        category_name,
        category_level,
        master_category,
        course_id
      FROM subject_category 
      WHERE course_id = 2
      ORDER BY category_level ASC, category_name ASC`

    );
    
    connection.release();
    
    return NextResponse.json({ items: rows });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดวิชา' }, 
      { status: 500 }
    );
  }
}