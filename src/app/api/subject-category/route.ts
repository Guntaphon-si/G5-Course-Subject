import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db'; // ตรวจสอบให้แน่ใจว่า Path ไปยังไฟล์ db connection ของคุณถูกต้อง

/**
 * GET: ดึงข้อมูลกลุ่มวิชา (Subject Category) ตาม course_id
 * ใช้สำหรับแสดงฟอร์มกำหนดหน่วยกิตหลังจากที่ผู้ใช้เลือกหลักสูตร
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const course_id = searchParams.get('course_id');

    if (!course_id) {
      return NextResponse.json({ message: 'กรุณาระบุ course_id' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    
    // =================== จุดที่แก้ไข ===================
    // ดึง category_level และ master_category เพิ่มเข้ามาใน query
    const [rows] = await connection.query(
      "SELECT subject_category_id, category_name, category_level, master_category FROM subject_category WHERE course_id = ? ORDER BY subject_category_id ASC",
      [course_id]
    );
    // ================================================
    
    connection.release();
    
    return NextResponse.json({ items: rows });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกลุ่มวิชา' }, { status: 500 });
  }
}