import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

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

    // 3. บันทึกโครงสร้างหลักสูตรที่เลือก (ถ้ามี)
    if (data.selected_categories && data.selected_categories.length > 0) {
      // สร้างตาราง course_curriculum_structure ถ้ายังไม่มี
      await conn.query(`
        CREATE TABLE IF NOT EXISTS course_curriculum_structure (
          id INT AUTO_INCREMENT PRIMARY KEY,
          course_id INT,
          structure_type VARCHAR(100),
          structure_name VARCHAR(255),
          credit_hours VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES course(course_id)
        )
      `);

      // บันทึกโครงสร้างที่เลือก
      for (const structureType of data.selected_categories) {
        let structureName = '';
        let creditHours = '';

        // กำหนดชื่อและหน่วยกิตตามประเภท
        switch (structureType) {
          case 'general_education':
            structureName = 'หมวดวิชาศึกษาทั่วไป';
            creditHours = 'ไม่น้อยกว่า 30 หน่วยกิต';
            break;
          case 'happy_subject':
            structureName = 'กลุ่มสาระอยู่ดีมีสุข';
            creditHours = 'ไม่น้อยกว่า 5 หน่วยกิต';
            break;
          case 'entrepreneurship_subject':
            structureName = 'กลุ่มสาระศาสตร์แห่งผู้ประกอบการ';
            creditHours = 'ไม่น้อยกว่า 6 หน่วยกิต';
            break;
          case 'language_subject':
            structureName = 'กลุ่มสาระภาษากับการสื่อสาร';
            creditHours = '13 หน่วยกิต';
            break;
          case 'people_subject':
            structureName = 'กลุ่มสาระพลเมืองไทยและพลเมืองโลก';
            creditHours = 'ไม่น้อยกว่า 3 หน่วยกิต';
            break;
          case 'aesthetics_subject':
            structureName = 'กลุ่มสาระสุนทรียศาสตร์';
            creditHours = 'ไม่น้อยกว่า 3 หน่วยกิต';
            break;
          case 'specific_subject':
            structureName = 'หมวดวิชาเฉพาะ';
            creditHours = 'ไม่น้อยกว่า 104 หน่วยกิต';
            break;
          case 'core_subject':
            structureName = 'วิชาแกน';
            creditHours = '30 หน่วยกิต';
            break;
          case 'specialized_subject':
            structureName = 'วิชาเฉพาะด้าน';
            creditHours = '55 หน่วยกิต';
            break;
          case 'hardware_architecture':
            structureName = 'กลุ่มฮาร์ดแวร์และสถาปัตยกรรมคอมพิวเตอร์';
            creditHours = '18 หน่วยกิต';
            break;
          case 'system_infrastructure':
            structureName = 'กลุ่มโครงสร้างพื้นฐานของระบบ';
            creditHours = '19 หน่วยกิต';
            break;
          case 'software_technology':
            structureName = 'กลุ่มเทคโนโลยีและวิธีการทางซอฟต์แวร์';
            creditHours = '14 หน่วยกิต';
            break;
          case 'applied_technology':
            structureName = 'กลุ่มเทคโนโลยีเพื่องานประยุกต์';
            creditHours = '3 หน่วยกิต';
            break;
          case 'independent_study':
            structureName = 'กลุ่มการค้นคว้าอิสระ';
            creditHours = '1 หน่วยกิต';
            break;
          case 'elective_subject':
            structureName = 'วิชาเลือก';
            creditHours = 'ไม่น้อยกว่า 19 หน่วยกิต';
            break;
          case 'free_elective':
            structureName = 'หมวดวิชาเลือกเสรี';
            creditHours = 'ไม่น้อยกว่า 6 หน่วยกิต';
            break;
          case 'internship':
            structureName = 'หมวดการฝึกงาน';
            creditHours = 'ไม่น้อยกว่า 240 ชั่วโมง';
            break;
        }

        await conn.query(
          `INSERT INTO course_curriculum_structure (course_id, structure_type, structure_name, credit_hours) 
           VALUES (?, ?, ?, ?)`,
          [courseId, structureType, structureName, creditHours]
        );
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
