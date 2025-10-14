import { NextResponse } from "next/server";
import db from "../../../../../lib/db"; // << ปรับ path ไปยังไฟล์ db connection ของคุณ

// --- Interfaces ---
interface Category {
  key: string;
  name: string;
  children: Category[];
  level: number;
}

interface CourseData {
  name_course_th: string;
  name_course_use?: string;
  name_course_eng?: string;
  name_full_degree_th?: string;
  name_full_degree_eng?: string;
  name_initials_degree_th?: string;
  name_initials_degree_eng?: string;
  department_id: number;
  category_structure: Category[];
}

/**
 * ฟังก์ชัน Recursive สำหรับบันทึก Category ลงฐานข้อมูล
 * @param conn - Connection ของฐานข้อมูล
 * @param courseId - ID ของหลักสูตรที่กำลังสร้าง
 * @param categories - Array ของหมวดหมู่ที่ต้องบันทึก
 * @param masterCategoryId - ID ของหมวดหมู่แม่ (เป็น null สำหรับ level 1)
 */
async function insertCategoriesRecursive(
  conn: any,
  courseId: number,
  categories: Category[],
  masterCategoryId: number | null
) {
  for (const category of categories) {
    // 1. บันทึก category ปัจจุบันลง DB
    const [result]: any = await conn.query(
      `INSERT INTO subject_category (course_id, category_name, category_level, master_category)
       VALUES (?, ?, ?, ?)`,
      [courseId, category.name.trim(), category.level, masterCategoryId]
    );
    const newCategoryId = result.insertId;

    // 2. ถ้ามี children, ให้เรียกฟังก์ชันตัวเองอีกครั้ง
    //    โดยส่ง ID ที่เพิ่งสร้างเป็น master_category ใหม่สำหรับ children
    if (category.children && category.children.length > 0) {
      await insertCategoriesRecursive(
        conn,
        courseId,
        category.children,
        newCategoryId
      );
    }
  }
}

export async function POST(req: Request) {
  const data: CourseData = await req.json();
  let conn;

  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    if (!data.name_course_th || !data.department_id) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลที่จำเป็น (ชื่อหลักสูตรและคณะ)" },
        { status: 400 }
      );
    }

    // 1. Insert ข้อมูลลงในตาราง `course`
    const [courseResult]: any = await conn.query(
        `INSERT INTO course (name_course_th, name_course_use, name_course_eng, name_full_degree_th, name_full_degree_eng, name_initials_degree_th, name_initials_degree_eng, department_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.name_course_th, data.name_course_use ?? null, data.name_course_eng ?? null,
            data.name_full_degree_th ?? null, data.name_full_degree_eng ?? null,
            data.name_initials_degree_th ?? null, data.name_initials_degree_eng ?? null,
            data.department_id,
        ]
    );
    const courseId = courseResult.insertId;

    // 2. บันทึกโครงสร้างหลักสูตร (subject_category)
    if (data.category_structure && data.category_structure.length > 0) {
      await insertCategoriesRecursive(
        conn,
        courseId,
        data.category_structure,
        null // เริ่มต้นที่ Level 1 ไม่มี master_category
      );
    }

    await conn.commit();

    return NextResponse.json({
      message: "บันทึกหลักสูตรสำเร็จ",
      course_id: courseId,
    }, { status: 201 });

  } catch (err: any) {
    if (conn) await conn.rollback();
    console.error("เกิดข้อผิดพลาดในการบันทึกหลักสูตร:", err);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์", error: err.message },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}