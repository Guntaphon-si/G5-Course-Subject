import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../../lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    // ---- START: โค้ดที่แก้ไข ----
    // แก้ไข: เปลี่ยน s.credit เป็น s.sub_credit_id และเพิ่ม JOIN กับตาราง course
    let query = `
      SELECT 
        s.subject_id AS subjectId,
        s.subject_code AS subjectCode,
        s.name_subject_thai AS nameSubjectThai,
        s.name_subject_eng AS nameSubjectEng,
        c.course_id AS courseId
      FROM subject s
      JOIN course c ON s.course_id = c.course_id
      WHERE 1=1
    `;

    const params: string[] = [];
    if (q) {
      const searchTerm = `%${q}%`;
      // แก้ไข: ปรับเงื่อนไขการค้นหาให้เหมาะสม
      query += ` AND (s.subject_code LIKE ? OR s.name_subject_thai LIKE ?)`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY s.subject_code ASC`;

    const [rows] = await db.query<RowDataPacket[]>(query, params);

    return NextResponse.json({ success: true, items: rows }, { status: 200 });
    // ---- END: โค้ดที่แก้ไข ----

  } catch (error: any) {
    // แก้ไข: ปรับปรุง Error Log และ Response ให้สื่อความหมายชัดเจนขึ้น
    console.error('GET /api/subjects/search error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการค้นหาวิชา' },
      { status: 500 }
    );
  }
}

