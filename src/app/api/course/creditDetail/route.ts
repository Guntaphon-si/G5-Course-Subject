// app/api/course/details/route.ts

import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

/**
 * GET: ดึงรายละเอียดหน่วยกิตย่อยทั้งหมดสำหรับ course_plan_id ที่กำหนด
 * Endpoint: /api/course/details?id={course_plan_id}
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const course_plan_id = searchParams.get('id');

  if (!course_plan_id) {
    return NextResponse.json(
      { message: "Missing course_plan_id parameter" },
      { status: 400 }
    );
  }

  try {
    const connection = await pool.getConnection();
    
    // ดึงข้อมูลหน่วยกิตย่อยจากตาราง credit_require
    const [rows]: any = await connection.query(
      `SELECT subject_category.category_name, credit_require.credit_require FROM credit_require 
      INNER JOIN subject_category ON subject_category.subject_category_id = credit_require.subject_category_id 
      WHERE credit_require.course_plan_id = ?;`,
      [course_plan_id]
    );
    
    connection.release();

    if (rows.length === 0) {
        // อาจจะไม่มีข้อมูล Category ย่อยสำหรับแผนการเรียนนี้
        return NextResponse.json([]); 
    }
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ Frontend (ExpandedContent Component) คาดหวัง
    // เช่น { title: 'วิชาแกน', credit: 12 }
    const details = rows.map((row: any) => ({
      title: row.category_name,
      credit: row.credit_require,
    }));

    return NextResponse.json(details);

  } catch (error) {
    console.error("Database Error (Details):", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
// ไม่จำเป็นต้องมี POST, PATCH, หรือ DELETE สำหรับ Endpoint นี้