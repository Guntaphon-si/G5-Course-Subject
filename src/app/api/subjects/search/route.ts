import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../../lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    let query = `
      SELECT 
        s.subject_id AS subjectId,
        s.course_id AS courseId,
        s.subject_type_id AS subjectTypeId,
        s.subject_category_id AS subjectCategoryId,
        s.subject_code AS subjectCode,
        s.name_subject_thai AS nameSubjectThai,
        s.name_subject_eng AS nameSubjectEng,
        s.credit AS credit,
        s.is_visible AS isVisible
      FROM subject s
      WHERE 1=1
    `;

    const params: any[] = [];

    if (q) {
      query += `
        AND (s.subject_code LIKE ? 
        OR s.name_subject_thai LIKE ? 
        OR s.name_subject_eng LIKE ?)
      `;
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    query += ` ORDER BY s.subject_code ASC`;

    const [rows]: any = await db.query(query, params);

    return NextResponse.json({ success: true, items: rows }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/subjects/ru-subject error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
