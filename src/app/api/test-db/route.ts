import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function GET() {
  try {
    // ลองดึง connection จาก pool
    const connection = await db.getConnection();
    
    // ถ้าดึงได้สำเร็จ แสดงว่าเชื่อมต่อได้
    console.log('✅ การเชื่อมต่อฐานข้อมูลสำเร็จ!');
    
    // คืน connection กลับสู่ pool ทันที
    connection.release();

    // ส่งคำตอบกลับไปให้ client
    return NextResponse.json(
      { message: 'เชื่อมต่อฐานข้อมูลสำเร็จ!' },
      { status: 200 }
    );
  } catch (error: any) {
    // ถ้าเกิดข้อผิดพลาด ให้แสดง error ใน console ของ server
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', error.message);

    // ส่งคำตอบพร้อม error กลับไปให้ client
    return NextResponse.json(
      { 
        message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้',
        error: error.message 
      },
      { status: 500 }
    );
  }
}