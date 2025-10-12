import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const like = `%${q}%`;

    // ---- START: โค้ดที่แก้ไข ----
    // สร้าง ID สังเคราะห์ขึ้นมาสำหรับใช้เป็น key ในฝั่ง Frontend
    // โดยการนำ subject_id และ previous_subject_id มาต่อกัน
    const [rows]: any = await db.execute(
      `SELECT CONCAT(ps.subject_id, '-', ps.previous_subject_id) AS preSubjectId,
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
    // ---- END: โค้ดที่แก้ไข ----
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
    const [subjects]: any = await db.execute(
      'SELECT subject_id FROM subject WHERE subject_id IN (?, ?)',
      [subjectId, previousSubjectId]
    );

    if (!subjects || subjects.length !== 2) {
      return NextResponse.json({ message: 'ไม่พบรายวิชาหลักหรือรายวิชาที่ต้องเรียนก่อนในฐานข้อมูล' }, { status: 404 });
    }

    // ---- START: โค้ดที่แก้ไข ----
    // ตรวจสอบข้อมูลซ้ำโดยใช้ subject_id ที่มีอยู่จริงในตาราง
    const [dup]: any = await db.execute(
      'SELECT subject_id FROM pre_subject WHERE subject_id = ? AND previous_subject_id = ? LIMIT 1',
      [subjectId, previousSubjectId]
    );
    // ---- END: โค้ดที่แก้ไข ----
    if (dup && dup.length > 0) {
      return NextResponse.json({ message: 'รายวิชานี้ได้เชื่อมกันอยู่เเล้ว' }, { status: 409 });
    }

    const [prevInfo]: any = await db.execute(
      'SELECT subject_code FROM subject WHERE subject_id = ? LIMIT 1',
      [previousSubjectId]
    );
    const prevCode = prevInfo[0].subject_code;

    // ---- START: โค้ดที่แก้ไข ----
    // ตรวจสอบข้อมูลซ้ำโดยใช้ subject_id ที่มีอยู่จริงในตาราง
    const [dupByCode]: any = await db.execute(
      `SELECT ps.subject_id
       FROM pre_subject ps
       JOIN subject p ON p.subject_id = ps.previous_subject_id
       WHERE ps.subject_id = ? AND p.subject_code = ?
       LIMIT 1`,
      [subjectId, prevCode]
    );
    // ---- END: โค้ดที่แก้ไข ----

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

// ---- START: โค้ดที่แก้ไข ----
// การแก้ไข (PUT) จะซับซ้อนขึ้น เพราะต้องระบุทั้งข้อมูลเก่าและใหม่
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    // รับ ID เดิมเพื่อใช้ในการค้นหาแถวที่จะแก้
    const originalSubjectId = Number(body.originalSubjectId);
    const originalPreviousSubjectId = Number(body.originalPreviousSubjectId);
    // รับ ID ใหม่ที่จะอัปเดต
    const newSubjectId = Number(body.subjectId);
    const newPreviousSubjectId = Number(body.previousSubjectId);

    if (!originalSubjectId || !originalPreviousSubjectId || !newSubjectId || !newPreviousSubjectId) {
      return NextResponse.json({ message: 'ข้อมูลสำหรับอัปเดตไม่ครบถ้วน' }, { status: 400 });
    }
    if (newSubjectId === newPreviousSubjectId) {
      return NextResponse.json({ message: 'ห้ามเชื่อมรายวิชากับตัวเอง' }, { status: 400 });
    }

    // ตรวจสอบว่าข้อมูลใหม่ซ้ำกับที่มีอยู่แล้วหรือไม่ (ยกเว้นแถวเดิมของตัวเอง)
    const [dup]: any = await db.execute(
      'SELECT subject_id FROM pre_subject WHERE subject_id = ? AND previous_subject_id = ? LIMIT 1',
      [newSubjectId, newPreviousSubjectId]
    );
    if (dup && dup.length > 0) {
      // ตรวจสอบให้แน่ใจว่าข้อมูลที่ซ้ำ ไม่ใช่ข้อมูลเดิมของแถวที่กำลังแก้ไข
      const isSelf = newSubjectId === originalSubjectId && newPreviousSubjectId === originalPreviousSubjectId;
      if (!isSelf) {
        return NextResponse.json({ message: 'มีความสัมพันธ์นี้อยู่แล้ว' }, { status: 409 });
      }
    }

    // อัปเดตข้อมูลโดยอ้างอิงจากข้อมูลเดิม
    await db.execute(
      'UPDATE pre_subject SET subject_id = ?, previous_subject_id = ? WHERE subject_id = ? AND previous_subject_id = ?',
      [newSubjectId, newPreviousSubjectId, originalSubjectId, originalPreviousSubjectId]
    );

    return NextResponse.json({ message: 'อัปเดตสำเร็จ' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// ลบข้อมูลโดยใช้ subjectId และ previousSubjectId
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // รับค่า Key ทั้งสองตัวจาก URL
    const subjectId = Number(searchParams.get('subjectId'));
    const previousSubjectId = Number(searchParams.get('previousSubjectId'));

    if (!subjectId || !previousSubjectId) {
      return NextResponse.json({ message: 'ต้องระบุ subjectId และ previousSubjectId' }, { status: 400 });
    }
    await db.execute('DELETE FROM pre_subject WHERE subject_id = ? AND previous_subject_id = ?', [subjectId, previousSubjectId]);
    return NextResponse.json({ message: 'ลบสำเร็จ' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
// ---- END: โค้ดที่แก้ไข ----