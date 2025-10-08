import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../../lib/db';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const like = `%${q}%`;
    const [rows]: any = await db.execute(
      `SELECT s.subjectId, s.subjectCode, s.nameSubjectThai, s.nameSubjectEng, c.nameCourseTh AS courseNameTh
       FROM subject s
       JOIN course c ON c.courseId = s.courseId
       WHERE s.subjectCode LIKE ? OR s.nameSubjectThai LIKE ? OR s.nameSubjectEng LIKE ?
       ORDER BY s.subjectCode LIMIT 20`,
      [like, like, like]
    );

    return NextResponse.json({ items: rows }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}


