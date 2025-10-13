import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

// Helper function to create subject category
async function createSubjectCategory(
  conn: any,
  courseId: number,
  categoryName: string,
  categoryLevel: number,
  masterCategory: number | null
) {
  const [result]: any = await conn.query(
    `INSERT INTO subject_category (course_id, category_name, category_level, master_category) 
     VALUES (?, ?, ?, ?)`,
    [courseId, categoryName, categoryLevel, masterCategory]
  );
  return result.insertId;
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
  selected_categories?: string[];
}

// Mapping ของ category จากชื่อใน checkbox เป็นข้อมูลในฐานข้อมูล
const categoryMapping: {
  [key: string]: { level: number; name: string; master?: string };
} = {
  // Level 1 - หมวดหลัก
  general_education: { level: 1, name: "หมวดวิชาศึกษาทั่วไป" },
  specific_subject: { level: 1, name: "หมวดวิชาเฉพาะ" },
  free_elective: { level: 1, name: "หมวดวิชาเลือกเสรี" },

  // Level 2 - กลุ่มสาระของหมวดศึกษาทั่วไป
  happy_subject: {
    level: 2,
    name: "กลุ่มสาระอยู่ดีมีสุข",
    master: "general_education",
  },
  entrepreneurship_subject: {
    level: 2,
    name: "กลุ่มสาระศาสตร์แห่งผู้ประกอบการ",
    master: "general_education",
  },
  language_subject: {
    level: 2,
    name: "กลุ่มสาระภาษากับการสื่อสาร",
    master: "general_education",
  },
  people_subject: {
    level: 2,
    name: "กลุ่มสาระพลเมืองไทยและพลเมืองโลก",
    master: "general_education",
  },
  aesthetics_subject: {
    level: 2,
    name: "กลุ่มสาระสุนทรียศาสตร์",
    master: "general_education",
  },

  // Level 2 - กลุ่มของหมวดวิชาเฉพาะ
  core_subject: { level: 2, name: "วิชาแกน", master: "specific_subject" },
  specialized_subject: {
    level: 2,
    name: "วิชาเฉพาะด้าน",
    master: "specific_subject",
  },
  elective_subject: { level: 2, name: "วิชาเลือก", master: "specific_subject" },

  // Level 3 - กลุ่มย่อยของวิชาเฉพาะด้าน
  hardware_architecture: {
    level: 3,
    name: "กลุ่มฮาร์ดแวร์และสถาปัตยกรรมคอมพิวเตอร์",
    master: "specialized_subject",
  },
  system_infrastructure: {
    level: 3,
    name: "กลุ่มโครงสร้างพื้นฐานของระบบ",
    master: "specialized_subject",
  },
  software_technology: {
    level: 3,
    name: "กลุ่มเทคโนโลยีและวิธีการทางซอฟต์แวร์",
    master: "specialized_subject",
  },
  applied_technology: {
    level: 3,
    name: "กลุ่มเทคโนโลยีเพื่องานประยุกต์",
    master: "specialized_subject",
  },
  independent_study: {
    level: 3,
    name: "กลุ่มการค้นคว้าอิสระ",
    master: "specialized_subject",
  },
};

export async function POST(req: Request) {
  const data: CourseData = await req.json();

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Validate required fields
    if (!data.name_course_th || !data.department_id) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลที่จำเป็น (ชื่อหลักสูตรและคณะ)" },
        { status: 400 }
      );
    }

    // Insert into course table
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

    console.log("Inserted course with ID:", courseResult.insertId);
    const courseId = courseResult.insertId;

    // สร้างโครงสร้างหลักสูตรในตาราง subject_category (ถ้ามีการเลือกหมวดวิชา)
    if (
      data.selected_categories &&
      Array.isArray(data.selected_categories) &&
      data.selected_categories.length > 0
    ) {
      const selectedCategories = data.selected_categories;

      // เก็บ mapping ของ category_id ที่สร้างขึ้นมา
      const categoryIdMap: { [key: string]: number } = {};

      // แยก categories ตาม level เพื่อ insert ตามลำดับ
      const level1Categories = selectedCategories.filter(
        (cat) => categoryMapping[cat]?.level === 1
      );
      const level2Categories = selectedCategories.filter(
        (cat) => categoryMapping[cat]?.level === 2
      );
      const level3Categories = selectedCategories.filter(
        (cat) => categoryMapping[cat]?.level === 3
      );

      // Insert Level 1
      for (const categoryKey of level1Categories) {
        const categoryInfo = categoryMapping[categoryKey];
        if (categoryInfo) {
          const categoryId = await createSubjectCategory(
            conn,
            courseId,
            categoryInfo.name,
            categoryInfo.level,
            null
          );
          categoryIdMap[categoryKey] = categoryId;
        }
      }

      // Insert Level 2
      for (const categoryKey of level2Categories) {
        const categoryInfo = categoryMapping[categoryKey];
        if (categoryInfo && categoryInfo.master) {
          const masterCategoryId = categoryIdMap[categoryInfo.master];

          if (masterCategoryId) {
            const categoryId = await createSubjectCategory(
              conn,
              courseId,
              categoryInfo.name,
              categoryInfo.level,
              masterCategoryId
            );
            categoryIdMap[categoryKey] = categoryId;
          }
        }
      }

      // Insert Level 3
      for (const categoryKey of level3Categories) {
        const categoryInfo = categoryMapping[categoryKey];
        if (categoryInfo && categoryInfo.master) {
          const masterCategoryId = categoryIdMap[categoryInfo.master];

          if (masterCategoryId) {
            await createSubjectCategory(
              conn,
              courseId,
              categoryInfo.name,
              categoryInfo.level,
              masterCategoryId
            );
          }
        }
      }
    }

    await conn.commit();

    return NextResponse.json({
      message: "✅ บันทึกหลักสูตรสำเร็จ",
      course_id: courseId,
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