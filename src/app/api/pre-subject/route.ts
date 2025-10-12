import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const like = `%${q}%`;
    const [rows]: any = await db.execute(
      `SELECT ps.pre_subject_id AS preSubjectId,
              s.subject_id AS subjectId,
              s.subject_code AS subjectCode,
              s.name_subject_thai AS subjectNameTh,
              cs.name_course_th AS subjectCourseNameTh,
              p.subject_id AS previousSubjectId,
              p.subject_code AS previousSubjectCode,
              p.name_subject_thai AS previousSubjectNameTh,
              cp.name_course_th AS previousSubjectCourseNameTh
       FROM pre_subject ps
       JOIN subject s ON s.subject_id = ps.subject_id
       JOIN course cs ON cs.course_id = s.course_id
       JOIN subject p ON p.subject_id = ps.previous_subject_id
       JOIN course cp ON cp.course_id = p.course_id
       ${q ? `WHERE s.subject_code LIKE ? OR s.name_subject_thai LIKE ? OR p.subject_code LIKE ? OR p.name_subject_thai LIKE ?` : ''}
       ORDER BY s.subject_code, p.subject_code
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
    // ตรวจสอบว่ารายวิชามีอยู่จริงในฐานข้อมูลหรือไม่
    const [subjects]: any = await db.execute(
      'SELECT subject_id FROM subject WHERE subject_id IN (?, ?)',
      [subjectId, previousSubjectId]
    );

    // ตรวจสอบว่าพบรายวิชาครบทั้ง 2 ตัวหรือไม่
    if (!subjects || subjects.length !== 2) {
      return NextResponse.json({ message: 'ไม่พบรายวิชาหลักหรือรายวิชาที่ต้องเรียนก่อนในฐานข้อมูล' }, { status: 404 });
    }

    // กันซ้ำแบบ exact pair (subject_id ตรงกันทั้งคู่)
    const [dup]: any = await db.execute(
      'SELECT pre_subject_id FROM pre_subject WHERE subject_id = ? AND previous_subject_id = ? LIMIT 1',
      [subjectId, previousSubjectId]
    );
    if (dup && dup.length > 0) {
      return NextResponse.json({ message: 'รายวิชานี้ได้เชื่อมกันอยู่เเล้ว' }, { status: 409 });
    }

    // กันซ้ำตามรหัสวิชาของวิชาที่ต้องเรียนก่อน (previous subject)
    const [prevInfo]: any = await db.execute(
      'SELECT subject_code FROM subject WHERE subject_id = ? LIMIT 1',
      [previousSubjectId]
    );
    const prevCode = prevInfo[0].subject_code;

    const [dupByCode]: any = await db.execute(
      `SELECT ps.pre_subject_id
       FROM pre_subject ps
       JOIN subject p ON p.subject_id = ps.previous_subject_id
       WHERE ps.subject_id = ? AND p.subject_code = ?
       LIMIT 1`,
      [subjectId, prevCode]
    );

    if (dupByCode && dupByCode.length > 0) {
      return NextResponse.json({ message: 'เชื่อมข้อมูลซ้ำ (รายวิชานี้ได้เชื่อมกับวิชาที่มีรหัสเดียวกันอยู่แล้ว)' }, { status: 409 });
    }

    await db.execute(
      'INSERT INTO pre_subject (subject_id, previous_subject_id) VALUES (?, ?)',
      [subjectId, previousSubjectId]
    );

    return NextResponse.json({ message: 'บันทึกความสัมพันธ์สำเร็จ' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating prerequisite:', error); 
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์', error: error.message }, { status: 500 });
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

    // ตรวจสอบว่ารายวิชามีอยู่จริง และดึง course_id มาเปรียบเทียบ
    const [subjects]: any = await db.execute(
      'SELECT subject_id, course_id FROM subject WHERE subject_id IN (?, ?)',
      [subjectId, previousSubjectId]
    );

    if (!subjects || subjects.length !== 2) {
      return NextResponse.json({ message: 'ไม่พบรายวิชาหลักหรือรายวิชาที่ต้องเรียนก่อนในฐานข้อมูล' }, { status: 404 });
    }

    const mainSubjectCourseId = subjects.find((s: any) => s.subject_id === subjectId).course_id;
    const prevSubjectCourseId = subjects.find((s: any) => s.subject_id === previousSubjectId).course_id;

    if (mainSubjectCourseId !== prevSubjectCourseId) {
      return NextResponse.json({ message: 'ไม่สามารถเชื่อมวิชากับรายวิชาที่อยู่คนละหลักสูตรได้' }, { status: 400 });
    }

    const [dup]: any = await db.execute(
      'SELECT pre_subject_id FROM pre_subject WHERE subject_id = ? AND previous_subject_id = ? AND pre_subject_id <> ? LIMIT 1',
      [subjectId, previousSubjectId, preSubjectId]
    );
    if (dup && dup.length > 0) {
      return NextResponse.json({ message: 'มีความสัมพันธ์นี้อยู่แล้ว' }, { status: 409 });
    }

    // กันซ้ำแบบ รหัสวิชา + หลักสูตร ของวิชาที่ต้องเรียนก่อน
    const [prevInfo]: any = await db.execute(
      'SELECT subject_code, course_id FROM subject WHERE subject_id = ? LIMIT 1',
      [previousSubjectId]
    );
    const prevCode = prevInfo[0].subject_code;
    const prevCourseId = prevInfo[0].course_id;
    const [dupByCodeCourse]: any = await db.execute(
      `SELECT ps.pre_subject_id
       FROM pre_subject ps
       JOIN subject p ON p.subject_id = ps.previous_subject_id
       WHERE ps.subject_id = ? AND p.subject_code = ? AND p.course_id = ? AND ps.pre_subject_id <> ?
       LIMIT 1`,
      [subjectId, prevCode, prevCourseId, preSubjectId]
    );
    if (dupByCodeCourse && dupByCodeCourse.length > 0) {
      return NextResponse.json({ message: 'เชื่อมข้อมูลซ้ำ (ซ้ำตาม รหัสวิชา + หลักสูตร)' }, { status: 400 });
    }

    await db.execute(
      'UPDATE pre_subject SET subject_id = ?, previous_subject_id = ? WHERE pre_subject_id = ?',
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
    await db.execute('DELETE FROM pre_subject WHERE pre_subject_id = ?', [id]);
    return NextResponse.json({ message: 'ลบสำเร็จ' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}