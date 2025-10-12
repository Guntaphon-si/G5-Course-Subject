import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Read subjects
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const courseId = searchParams.get('courseId') || '';

    let query = `
      SELECT 
        s.subject_id AS subjectId,
        s.course_id AS courseId,
        s.subject_type_id AS subjectTypeId,
        s.subject_category_id AS subjectCategoryId,
        s.sub_credit_id AS subCreditId,
        s.subject_code AS subjectCode,
        s.name_subject_thai AS nameSubjectThai,
        s.name_subject_eng AS nameSubjectEng,
        s.is_visible AS isVisible,
        c.name_course_use AS nameCourseUse,
        sc.credit AS credit,
        sc.lecture_hours AS lectureHours,
        sc.lab_hours AS labHours,
        sc.by_self_hours AS bySelfHours
      FROM subject s
      LEFT JOIN course c ON s.course_id = c.course_id
      LEFT JOIN sub_credit sc ON s.sub_credit_id = sc.sub_credit_id
      WHERE 1=1
    `;

    const params: string[] = [];

    if (q) {
      query += ` AND (s.subject_code LIKE ? OR s.name_subject_thai LIKE ? OR s.name_subject_eng LIKE ?)`;
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (courseId) {
      query += ` AND s.course_id = ?`;
      params.push(courseId);
    }

    query += ` ORDER BY s.subject_code ASC`;

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
      subCreditId,
      isVisible 
    } = body;

    // Validate required fields
    if (!subjectId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ subjectId' },
        { status: 400 }
      );
    }

    if (!subjectCode || !nameSubjectThai || !nameSubjectEng || subCreditId === undefined || isVisible === undefined) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

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

    const [result] = await pool.query<ResultSetHeader>(
      query, 
      [subjectCode, nameSubjectThai, nameSubjectEng, subCreditId, isVisible, subjectId]
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