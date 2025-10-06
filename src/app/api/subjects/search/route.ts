import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const like = `%${q}%`;
    const [rows]: any = await db.execute(
      `SELECT subjectId, subjectCode, nameSubjectThai, nameSubjectEng FROM subject 
       WHERE subjectCode LIKE ? OR nameSubjectThai LIKE ? OR nameSubjectEng LIKE ? 
       ORDER BY subjectCode LIMIT 20`,
      [like, like, like]
    );

    return NextResponse.json({ items: rows }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}


