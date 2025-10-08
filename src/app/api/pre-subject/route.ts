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
              cs.nameCourseTh AS subjectCourseNameTh,
              p.subjectId AS previousSubjectId,
              p.subjectCode AS previousSubjectCode,
              p.nameSubjectThai AS previousSubjectNameTh,
              cp.nameCourseTh AS previousSubjectCourseNameTh
       FROM preSubject ps
       JOIN subject s ON s.subjectId = ps.subjectId
       JOIN course cs ON cs.courseId = s.courseId
       JOIN subject p ON p.subjectId = ps.previousSubjectId
       JOIN course cp ON cp.courseId = p.courseId
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
    // ---- START: โค้ดที่แก้ไข ----
    // ตรวจสอบว่ารายวิชามีอยู่จริง และดึง courseId มาเปรียบเทียบ
    const [subjects]: any = await db.execute(
      'SELECT subjectId, courseId FROM subject WHERE subjectId IN (?, ?)',
      [subjectId, previousSubjectId]
    );

    // ตรวจสอบว่าพบรายวิชาครบทั้ง 2 ตัวหรือไม่
    if (!subjects || subjects.length !== 2) {
      return NextResponse.json({ message: 'ไม่พบรายวิชาหลักหรือรายวิชาที่ต้องเรียนก่อนในฐานข้อมูล' }, { status: 404 });
    }

    // เปรียบเทียบ courseId ของทั้งสองรายวิชา
    const mainSubjectCourseId = subjects.find((s: any) => s.subjectId === subjectId).courseId;
    const prevSubjectCourseId = subjects.find((s: any) => s.subjectId === previousSubjectId).courseId;

    if (mainSubjectCourseId !== prevSubjectCourseId) {
      return NextResponse.json({ message: 'ไม่สามารถเชื่อมวิชากับรายวิชาที่อยู่คนละหลักสูตรได้' }, { status: 400 });
    }
    // ---- END: โค้ดที่แก้ไข ----

    // กันซ้ำแบบ exact pair
    const [dup]: any = await db.execute(
      'SELECT preSubjectId FROM preSubject WHERE subjectId = ? AND previousSubjectId = ? LIMIT 1',
      [subjectId, previousSubjectId]
    );
    if (dup && dup.length > 0) {
      return NextResponse.json({ message: 'รายวิชานี้ได้เชื่อมกันอยู่เเล้ว' }, { status: 409 });
    }

    // กันซ้ำแบบ รหัสวิชา + หลักสูตร ของวิชาที่ต้องเรียนก่อน (แม้จะเป็นคนละ subjectId)
    const [prevInfo]: any = await db.execute(
      'SELECT subjectCode, courseId FROM subject WHERE subjectId = ? LIMIT 1',
      [previousSubjectId]
    );
    // ส่วนนี้ไม่ต้องเช็ค prevInfo.length เพราะการเช็คด้านบนครอบคลุมแล้ว
    const prevCode = prevInfo[0].subjectCode;
    const prevCourseId = prevInfo[0].courseId;
    const [dupByCodeCourse]: any = await db.execute(
      `SELECT ps.preSubjectId
       FROM preSubject ps
       JOIN subject p ON p.subjectId = ps.previousSubjectId
       WHERE ps.subjectId = ? AND p.subjectCode = ? AND p.courseId = ?
       LIMIT 1`,
      [subjectId, prevCode, prevCourseId]
    );
    if (dupByCodeCourse && dupByCodeCourse.length > 0) {
      return NextResponse.json({ message: 'เชื่อมข้อมูลซ้ำ (ซ้ำตาม รหัสวิชา + หลักสูตร)' }, { status: 400 });
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

    // ---- START: โค้ดที่แก้ไข ----
    // ตรวจสอบว่ารายวิชามีอยู่จริง และดึง courseId มาเปรียบเทียบ
    const [subjects]: any = await db.execute(
      'SELECT subjectId, courseId FROM subject WHERE subjectId IN (?, ?)',
      [subjectId, previousSubjectId]
    );

    // ตรวจสอบว่าพบรายวิชาครบทั้ง 2 ตัวหรือไม่
    if (!subjects || subjects.length !== 2) {
      return NextResponse.json({ message: 'ไม่พบรายวิชาหลักหรือรายวิชาที่ต้องเรียนก่อนในฐานข้อมูล' }, { status: 404 });
    }

    // เปรียบเทียบ courseId ของทั้งสองรายวิชา
    const mainSubjectCourseId = subjects.find((s: any) => s.subjectId === subjectId).courseId;
    const prevSubjectCourseId = subjects.find((s: any) => s.subjectId === previousSubjectId).courseId;

    if (mainSubjectCourseId !== prevSubjectCourseId) {
      return NextResponse.json({ message: 'ไม่สามารถเชื่อมวิชากับรายวิชาที่อยู่คนละหลักสูตรได้' }, { status: 400 });
    }
    // ---- END: โค้ดที่แก้ไข ----

    const [dup]: any = await db.execute(
      'SELECT preSubjectId FROM preSubject WHERE subjectId = ? AND previousSubjectId = ? AND preSubjectId <> ? LIMIT 1',
      [subjectId, previousSubjectId, preSubjectId]
    );
    if (dup && dup.length > 0) {
      // ---- แก้ไข status จาก 200 เป็น 409 ----
      return NextResponse.json({ message: 'มีความสัมพันธ์นี้อยู่แล้ว' }, { status: 409 });
    }

    // กันซ้ำแบบ รหัสวิชา + หลักสูตร ของวิชาที่ต้องเรียนก่อน (แม้จะเป็นคนละ subjectId)
    const [prevInfo]: any = await db.execute(
      'SELECT subjectCode, courseId FROM subject WHERE subjectId = ? LIMIT 1',
      [previousSubjectId]
    );
    const prevCode = prevInfo[0].subjectCode;
    const prevCourseId = prevInfo[0].courseId;
    const [dupByCodeCourse]: any = await db.execute(
      `SELECT ps.preSubjectId
       FROM preSubject ps
       JOIN subject p ON p.subjectId = ps.previousSubjectId
       WHERE ps.subjectId = ? AND p.subjectCode = ? AND p.courseId = ? AND ps.preSubjectId <> ?
       LIMIT 1`,
      [subjectId, prevCode, prevCourseId, preSubjectId]
    );
    if (dupByCodeCourse && dupByCodeCourse.length > 0) {
      return NextResponse.json({ message: 'เชื่อมข้อมูลซ้ำ (ซ้ำตาม รหัสวิชา + หลักสูตร)' }, { status: 400 });
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

