import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function POST(req: Request) {
  const data = (await req.json());

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 1️⃣ Insert into course
    const [courseResult]: any = await conn.query(
      `INSERT INTO course 
      (name_course_th, name_course_use, name_course_eng,
       name_full_degree_th, name_full_degree_eng,
       name_initials_degree_th, name_initials_degree_eng, department_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name_course_th,
        data.name_course_use ?? "",
        data.name_course_eng ?? "",
        data.name_full_degree_th ?? "",
        data.name_full_degree_eng ?? "",
        data.name_initials_degree_th ?? "",
        data.name_initials_degree_eng ?? "",
        data.department_id,
      ]
    );

    const courseId = courseResult.insertId;

    // 2️⃣ Insert into course_plan
    const [planResult]: any = await conn.query(
      `INSERT INTO course_plan 
       (course_id, plan_course, credit_intern, total_credit, internship_hours)
       VALUES (?, ?, ?, ?, ?)`,
      [
        courseId,
        data.plan_course ?? "แผนหลักสูตรทั่วไป",
        data.credit_intern ?? 0,
        data.total_credit ??
          ((data.general_subject_credit ?? 0) +
            (data.specific_subject_credit ?? 0) +
            (data.free_subject_credit ?? 0)),
        data.internship_hours ?? 0,
      ]
    );

    const planId = planResult.insertId;

    // 3️⃣ สร้าง Map สำหรับเก็บ id ของหมวดหลัก
    const masterCategories: Record<string, number> = {};

    // 4️⃣ เพิ่มหมวดหลักก่อน
    const mainCats: [string, number | undefined][] = [
      ["หมวดวิชาศึกษาทั่วไป", data.general_subject_credit],
      ["หมวดวิชาเฉพาะ", data.specific_subject_credit],
      ["หมวดวิชาเลือกเสรี", data.free_subject_credit],
    ];

    for (const [name, credit] of mainCats) {
      if (!credit) continue;
      const [mainCat]: any = await conn.query(
        `INSERT INTO subject_category (course_id, category_level, category_name)
         VALUES (?, 1, ?)`,
        [courseId, name]
      );
      const catId = mainCat.insertId;
      masterCategories[name] = catId;

      // บันทึกหน่วยกิตหลัก
      await conn.query(
        `INSERT INTO credit_require (course_plan_id, subject_category_id, credit_require)
         VALUES (?, ?, ?)`,
        [planId, catId, credit]
      );
    }

    // 5️⃣ กลุ่มย่อยและกลุ่มสาระ (มี master_category)
    const subCategories: [string, number | undefined, string | null][] = [
      // กลุ่มสาระ → หมวดวิชาศึกษาทั่วไป
      ["กลุ่มสาระอยู่ดีมีสุข", data.happy_subject_credit, "หมวดวิชาศึกษาทั่วไป"],
      ["กลุ่มสาระศาสตร์แห่งผู้ประกอบการ", data.entrepreneurship_subject_credit, "หมวดวิชาศึกษาทั่วไป"],
      ["กลุ่มสาระภาษากับการสื่อสาร", data.language_subject_credit, "หมวดวิชาศึกษาทั่วไป"],
      ["กลุ่มสาระพลเมืองไทยและพลเมืองโลก", data.people_subject_credit, "หมวดวิชาศึกษาทั่วไป"],
      ["กลุ่มสาระสุนทรียศาสตร์", data.aesthetics_subject_credit, "หมวดวิชาศึกษาทั่วไป"],

      // วิชาเฉพาะย่อย → หมวดวิชาเฉพาะ
      ["วิชาแกน", data.core_subject_credit, "หมวดวิชาเฉพาะ"],
      ["วิชาเฉพาะด้าน", data.special_subject_credit, "หมวดวิชาเฉพาะ"],
      ["วิชาเลือก", data.select_subject_credit, "หมวดวิชาเฉพาะ"],
    ];

    for (const [name, credit, masterName] of subCategories) {
      if (!credit) continue;

      const master = masterName ? masterCategories[masterName] ?? null : null;

      const [insSub]: any = await conn.query(
        `INSERT INTO subject_category (course_id, category_level, category_name, master_category)
         VALUES (?, 2, ?, ?)`,
        [courseId, name, master]
      );

      const subId = insSub.insertId;

      await conn.query(
        `INSERT INTO credit_require (course_plan_id, subject_category_id, credit_require)
         VALUES (?, ?, ?)`,
        [planId, subId, credit]
      );
    }

    // 6️⃣ Commit
    await conn.commit();

    return NextResponse.json({
      message: "✅ บันทึกหลักสูตรสำเร็จ",
      course_id: courseId,
      plan_id: planId,
    });
  } catch (err: any) {
    await conn.rollback();
    console.error("❌ Error adding course:", err);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการบันทึกหลักสูตร", error: err.message },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
