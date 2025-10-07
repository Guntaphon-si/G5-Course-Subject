import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const like = `%${q}%`;
    const [rows]: any = await db.execute(
      `SELECT ps.preSubjectId,
              s.subjectId,
              s.subjectCode,
              s.nameSubjectThai AS subjectNameTh,
              p.subjectId AS previousSubjectId,
              p.subjectCode AS previousSubjectCode,
              p.nameSubjectThai AS previousSubjectNameTh
       FROM preSubject ps
       JOIN subject s ON s.subjectId = ps.subjectId
       JOIN subject p ON p.subjectId = ps.previousSubjectId
       ${q ? `WHERE s.subjectCode LIKE ? OR s.nameSubjectThai LIKE ? OR p.subjectCode LIKE ? OR p.nameSubjectThai LIKE ?` : ''}
       ORDER BY s.subjectCode, p.subjectCode
       LIMIT 200`,
      q ? [like, like, like, like] : []
    );
    return NextResponse.json({ items: rows }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const preSubjectId = Number(body.preSubjectId);
    const subjectId = Number(body.subjectId);
    const previousSubjectId = Number(body.previousSubjectId);
    if (!preSubjectId || !subjectId || !previousSubjectId) {
      return NextResponse.json({ message: 'preSubjectId, subjectId, previousSubjectId ต้องไม่ว่าง' }, { status: 400 });
    }
    if (subjectId === previousSubjectId) {
      return NextResponse.json({ message: 'ห้ามเชื่อมรายวิชากับตัวเอง' }, { status: 400 });
    }

    const [exists]: any = await db.execute(
      'SELECT COUNT(*) AS c FROM subject WHERE subjectId IN (?, ?)',
      [subjectId, previousSubjectId]
    );
    if (!exists || exists[0].c !== 2) {
      return NextResponse.json({ message: 'ไม่พบ subjectId หรือ previousSubjectId ในฐานข้อมูล' }, { status: 400 });
    }

    const [dup]: any = await db.execute(
      'SELECT preSubjectId FROM preSubject WHERE subjectId = ? AND previousSubjectId = ? AND preSubjectId <> ? LIMIT 1',
      [subjectId, previousSubjectId, preSubjectId]
    );
    if (dup && dup.length > 0) {
      return NextResponse.json({ message: 'มีความสัมพันธ์นี้อยู่แล้ว' }, { status: 200 });
    }

    await db.execute(
      'UPDATE preSubject SET subjectId = ?, previousSubjectId = ? WHERE preSubjectId = ?',
      [subjectId, previousSubjectId, preSubjectId]
    );

    return NextResponse.json({ message: 'อัปเดตสำเร็จ' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) {
      return NextResponse.json({ message: 'ต้องระบุ id' }, { status: 400 });
    }
    await db.execute('DELETE FROM preSubject WHERE preSubjectId = ?', [id]);
    return NextResponse.json({ message: 'ลบสำเร็จ' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

