import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { PoolConnection } from 'mysql2/promise';

export async function POST(req: NextRequest) {
  let connection: PoolConnection | null = null;
  try {
    const body = await req.json();
    const {
      course_id,
      plan_course,
      credit_intern,
      total_credit,
      internship_hours,
      credits, // ข้อมูลหน่วยกิตทั้งหมดจะอยู่ในนี้ { subject_category_id: credit_value }
    } = body;

    if (!course_id || !plan_course || !total_credit || !credits) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. เพิ่มข้อมูลลงในตาราง course_plan (เวอร์ชันที่ไม่ต้องมีคอลัมน์หน่วยกิตย่อย)
    const [planResult]: any = await connection.execute(
      `INSERT INTO course_plan (
         course_id, plan_course, total_credit, credit_intern, internship_hours, 
         is_visible
       ) VALUES (?, ?, ?, ?, ?, 1)`,
      [
        course_id, 
        plan_course, 
        total_credit, 
        credit_intern || 0, 
        internship_hours || 0,
      ]
    );

    const newCoursePlanId = planResult.insertId;

    // 2. วนลูปเพื่อเพิ่มข้อมูลหน่วยกิตทั้งหมด (ทั้งหลักและย่อย) ลงในตาราง credit_require
    const creditEntries = Object.entries(credits);
    for (const [subject_category_id, credit] of creditEntries) {
      // เพิ่มทุกรายการที่มีการกรอกหน่วยกิต (ค่ามากกว่า 0)
      if (credit && Number(credit) > 0) {
        await connection.execute(
          `INSERT INTO credit_require (course_plan_id, subject_category_id, credit_require) VALUES (?, ?, ?)`,
          [newCoursePlanId, subject_category_id, credit]
        );
      }
    }

    await connection.commit();

    return NextResponse.json({ message: 'สร้างแผนการเรียนสำเร็จ', course_plan_id: newCoursePlanId }, { status: 201 });

  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error('API Error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}