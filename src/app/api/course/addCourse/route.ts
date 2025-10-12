import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

// Helper function to create subject category
async function createSubjectCategory(conn: any, courseId: number, categoryName: string, categoryLevel: number, masterCategory: number | null) {
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
  selected_categories?: number[];
}

export async function POST(req: Request) {
  const data = (await req.json());

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Insert into course table only
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
    // 3. สร้างโครงสร้างหลักสูตรในตาราง subject_category (ถ้ามีการเลือกหมวดวิชา)
    if (data.selected_categories && data.selected_categories.length > 0) {
      // สร้างตาราง course_subject_category ถ้ายังไม่มี
    //   await conn.query(`
    //     CREATE TABLE IF NOT EXISTS course_subject_category (
    //       id INT AUTO_INCREMENT PRIMARY KEY,
    //       course_id INT,
    //       subject_category_id INT,
    //       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //       FOREIGN KEY (course_id) REFERENCES course(course_id),
    //       FOREIGN KEY (subject_category_id) REFERENCES subject_category(subject_category_id)
    //     )
    //   `);

      // สร้างโครงสร้างหลักสูตรตามลำดับชั้น
      let generalEducationId = null;
      let specificSubjectId = null;
      let freeElectiveId = null;
      let specializedSubjectId = null;

      // Level 1: สร้างหมวดวิชาหลัก
      for (const categoryId of data.selected_categories) {
        let categoryName = '';
        let categoryLevel = 1;
        let masterCategory = null;

        switch (categoryId) {
          case 16: // หมวดวิชาศึกษาทั่วไป
            categoryName = 'หมวดวิชาศึกษาทั่วไป';
            generalEducationId = await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            break;
          case 17: // หมวดวิชาเฉพาะ
            categoryName = 'หมวดวิชาเฉพาะ';
            specificSubjectId = await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            break;
          case 18: // หมวดวิชาเลือกเสรี
            categoryName = 'หมวดวิชาเลือกเสรี';
            freeElectiveId = await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            break;
        }
      }

      // Level 2: สร้างหมวดวิชาย่อย
      for (const categoryId of data.selected_categories) {
        let categoryName = '';
        let categoryLevel = 2;
        let masterCategory = null;

        switch (categoryId) {
          case 19: // กลุ่มสาระอยู่ดีมีสุข
            if (generalEducationId) {
              categoryName = 'กลุ่มสาระอยู่ดีมีสุข';
              masterCategory = generalEducationId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
          case 20: // กลุ่มสาระศาสตร์แห่งผู้ประกอบการ
            if (generalEducationId) {
              categoryName = 'กลุ่มสาระศาสตร์แห่งผู้ประกอบการ';
              masterCategory = generalEducationId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
          case 21: // กลุ่มสาระภาษากับการสื่อสาร
            if (generalEducationId) {
              categoryName = 'กลุ่มสาระภาษากับการสื่อสาร';
              masterCategory = generalEducationId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
          case 22: // กลุ่มสาระพลเมืองไทยและพลเมืองโลก
            if (generalEducationId) {
              categoryName = 'กลุ่มสาระพลเมืองไทยและพลเมืองโลก';
              masterCategory = generalEducationId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
          case 23: // กลุ่มสาระสุนทรียศาสตร์
            if (generalEducationId) {
              categoryName = 'กลุ่มสาระสุนทรียศาสตร์';
              masterCategory = generalEducationId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
          case 24: // วิชาแกน
            if (specificSubjectId) {
              categoryName = 'วิชาแกน';
              masterCategory = specificSubjectId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
          case 25: // วิชาเฉพาะด้าน
            if (specificSubjectId) {
              categoryName = 'วิชาเฉพาะด้าน';
              masterCategory = specificSubjectId;
              specializedSubjectId = await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
          case 26: // วิชาเลือก
            if (specificSubjectId) {
              categoryName = 'วิชาเลือก';
              masterCategory = specificSubjectId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
        }
      }

      // Level 3: สร้างหมวดวิชาละเอียด
      for (const categoryId of data.selected_categories) {
        let categoryName = '';
        let categoryLevel = 3;
        let masterCategory = null;

        switch (categoryId) {
          case 27: // กลุ่มฮาร์ดแวร์และสถาปัตยกรรมคอมพิวเตอร์
            if (specializedSubjectId) {
              categoryName = 'กลุ่มฮาร์ดแวร์และสถาปัตยกรรมคอมพิวเตอร์';
              masterCategory = specializedSubjectId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
          case 28: // กลุ่มโครงสร้างพื้นฐานของระบบ
            if (specializedSubjectId) {
              categoryName = 'กลุ่มโครงสร้างพื้นฐานของระบบ';
              masterCategory = specializedSubjectId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
          case 29: // กลุ่มเทคโนโลยีและวิธีการทางซอฟต์แวร์
            if (specializedSubjectId) {
              categoryName = 'กลุ่มเทคโนโลยีและวิธีการทางซอฟต์แวร์';
              masterCategory = specializedSubjectId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
          case 30: // กลุ่มเทคโนโลยีเพื่องานประยุกต์
            if (specializedSubjectId) {
              categoryName = 'กลุ่มเทคโนโลยีเพื่องานประยุกต์';
              masterCategory = specializedSubjectId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
          case 16: // กลุ่มการค้นคว้าอิสระ
            if (specializedSubjectId) {
              categoryName = 'กลุ่มการค้นคว้าอิสระ';
              masterCategory = specializedSubjectId;
              await createSubjectCategory(conn, courseId, categoryName, categoryLevel, masterCategory);
            }
            break;
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
