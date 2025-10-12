import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db'; // สมมติว่า path ไปยัง db connection ถูกต้อง
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Read subjects
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get('q') || '';

    // ---- START: โค้ดที่แก้ไข ----
    // แก้ไข: ใช้ชื่อคอลัมน์แบบ snake_case ให้ตรงกับฐานข้อมูล และใช้ AS เพื่อแปลงเป็น camelCase ในผลลัพธ์ JSON
    let query = `
      SELECT 
        subject_id AS subjectId,
        course_id AS courseId,
        subject_type_id AS subjectTypeId,
        subject_category_id AS subjectCategoryId,
        sub_credit_id AS subCreditId,
        subject_code AS subjectCode,
        name_subject_thai AS nameSubjectThai,
        name_subject_eng AS nameSubjectEng,
        is_visible AS isVisible
      FROM subject
      WHERE 1=1
    `;

    const params: string[] = [];

    if (q) {
      // แก้ไข: ใช้ชื่อคอลัมน์ที่ถูกต้องใน WHERE clause
      query += ` AND (subject_code LIKE ? OR name_subject_thai LIKE ? OR name_subject_eng LIKE ?)`;
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // แก้ไข: ใช้ชื่อคอลัมน์ที่ถูกต้องใน ORDER BY clause
    query += ` ORDER BY subject_code ASC`;
    // ---- END: โค้ดที่แก้ไข ----

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({ 
      success: true, 
      items: rows 
    });
  } catch (error: any) {
    console.error('GET /api/subjects/ru-subject error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - Update subject
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    // ---- START: โค้ดที่แก้ไข ----
    // แก้ไข: เปลี่ยน 'credit' เป็น 'subCreditId' เพื่อให้สอดคล้องกับฐานข้อมูล
    const { 
      subjectId, 
      subjectCode, 
      nameSubjectThai, 
      nameSubjectEng, 
      subCreditId, // เปลี่ยนจาก credit
      isVisible 
    } = body;
    // ---- END: โค้ดที่แก้ไข ----

    // Validate required fields
    if (!subjectId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ subjectId' },
        { status: 400 }
      );
    }

    // ---- START: โค้ดที่แก้ไข ----
    // แก้ไข: ตรวจสอบ 'subCreditId' แทน 'credit'
    if (!subjectCode || !nameSubjectThai || !nameSubjectEng || subCreditId === undefined || isVisible === undefined) {
    // ---- END: โค้ดที่แก้ไข ----
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ---- START: โค้ดที่แก้ไข ----
    // แก้ไข: ใช้ชื่อคอลัมน์แบบ snake_case ให้ตรงกับฐานข้อมูล
    const query = `
      UPDATE subject 
      SET 
        subject_code = ?,
        name_subject_thai = ?,
        name_subject_eng = ?,
        sub_credit_id = ?,
        is_visible = ?
      WHERE subject_id = ?
    `;

    // แก้ไข: ส่ง 'subCreditId' เป็นพารามิเตอร์
    const [result] = await pool.query<ResultSetHeader>(
      query, 
      [subjectCode, nameSubjectThai, nameSubjectEng, subCreditId, isVisible, subjectId]
    );
    // ---- END: โค้ดที่แก้ไข ----

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'อัปเดตข้อมูลสำเร็จ' 
    });
  } catch (error: any) {
    console.error('PUT /api/subjects/ru-subject error:', error);
    
    // Check for duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, message: 'รหัสวิชานี้มีอยู่ในระบบแล้ว' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' },
      { status: 500 }
    );
  }
}