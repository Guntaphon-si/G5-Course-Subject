import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db'; // ตรวจสอบให้แน่ใจว่า Path ไปยังไฟล์ db connection ของคุณถูกต้อง

/**
 * GET: ดึงข้อมูลหลักสูตรทั้งหมด
 * ใช้สำหรับแสดงผลใน Dropdown
 */
export async function GET() {
  try {
    const connection = await pool.getConnection();
    
    // ดึงเฉพาะ course_id และ name_course_use สำหรับ Dropdown และเรียงตามชื่อ
    const [rows] = await connection.query(
      "SELECT course_id, name_course_use FROM course ORDER BY name_course_use ASC"
    );
    
    connection.release();
    
    // ส่งข้อมูลกลับในรูปแบบ { items: [...] } เพื่อให้ Frontend ใช้งานได้ทันที
    return NextResponse.json({ items: rows });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหลักสูตร' }, { status: 500 });
  }
}