import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Read subjects
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get('q') || '';

    let query = `
      SELECT 
        subjectId,
        courseId,
        subjectTypeId,
        subjectCategoryId,
        subjectCode,
        nameSubjectThai,
        nameSubjectEng,
        credit,
        isVisible
      FROM subject
      WHERE 1=1
    `;

    const params: string[] = [];

    if (q) {
      query += ` AND (subjectCode LIKE ? OR nameSubjectThai LIKE ? OR nameSubjectEng LIKE ?)`;
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY subjectCode ASC`;

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
    const { 
      subjectId, 
      subjectCode, 
      nameSubjectThai, 
      nameSubjectEng, 
      credit, 
      isVisible 
    } = body;

    // Validate required fields
    if (!subjectId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ subjectId' },
        { status: 400 }
      );
    }

    if (!subjectCode || !nameSubjectThai || !nameSubjectEng || credit === undefined || isVisible === undefined) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE subject 
      SET 
        subjectCode = ?,
        nameSubjectThai = ?,
        nameSubjectEng = ?,
        credit = ?,
        isVisible = ?
      WHERE subjectId = ?
    `;

    const [result] = await pool.query<ResultSetHeader>(
      query, 
      [subjectCode, nameSubjectThai, nameSubjectEng, credit, isVisible, subjectId]
    );

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