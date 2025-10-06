import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const subjectId = Number(body.subjectId);
  const previousSubjectId = Number(body.previousSubjectId);
  if (!subjectId || !previousSubjectId) {
    return NextResponse.json({ message: 'subjectId และ previousSubjectId ต้องไม่ว่าง' }, { status: 400 });
  }
  if (subjectId === previousSubjectId) {
    return NextResponse.json({ message: 'ห้ามเชื่อมรายวิชากับตัวเอง' }, { status: 400 });
  }

  try {
    // ตรวจว่ามี subject ทั้งสองตัวจริงไหม
    const [exists]: any = await db.execute(
      'SELECT COUNT(*) AS c FROM subject WHERE subjectId IN (?, ?)',
      [subjectId, previousSubjectId]
    );
    if (!exists || exists[0].c !== 2) {
      return NextResponse.json({ message: 'ไม่พบ subjectId หรือ previousSubjectId ในฐานข้อมูล' }, { status: 400 });
    }

    // กันซ้ำ
    const [dup]: any = await db.execute(
      'SELECT preSubjectId FROM preSubject WHERE subjectId = ? AND previousSubjectId = ? LIMIT 1',
      [subjectId, previousSubjectId]
    );
    if (dup && dup.length > 0) {
      return NextResponse.json({ message: 'มีความสัมพันธ์นี้อยู่แล้ว' }, { status: 200 });
    }

    await db.execute(
      'INSERT INTO preSubject (subjectId, previousSubjectId) VALUES (?, ?)',
      [subjectId, previousSubjectId]
    );

    return NextResponse.json({ message: 'บันทึกความสัมพันธ์สำเร็จ' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}


