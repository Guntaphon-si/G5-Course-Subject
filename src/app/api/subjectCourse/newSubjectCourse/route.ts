import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';// ใช้ connection pool เดิมจาก src/lib/db.js

interface Context {
    params: {
        id: string; // ชื่อต้องตรงกับ [id] ในชื่อไฟล์/โฟลเดอร์
    };
}

export interface CoursePlan {
    coursePlanId: number;
    planCourse: string;
}

/**
 * Interface สำหรับโครงสร้างข้อมูลวิชา (ตาราง Subject)
 */
export interface Subject {
    subjectId: number;
    subjectCode: string;
    nameSubjectThai: string;
}

/**
 * Interface สำหรับข้อมูลที่ส่งกลับไปให้ Frontend (รวมข้อมูลที่ต้องการทั้งหมด)
 */
export interface DropdownDataResponse {
    coursePlans: CoursePlan[];
    subjects: Subject[];
}

export async function GET(request: NextRequest) {
    try {
        // 1. เชื่อมต่อฐานข้อมูล
        const connection = await pool.getConnection();

        // 2. กำหนด SQL Queries
        const querySubject = `SELECT * FROM subject`;
        const queryCoursePlan = `SELECT * FROM coursePlan`;

        // 3. รัน Queries พร้อมกัน
        const [subjectRows]: [any[], any] = await connection.query(querySubject) as [any[], any];
        const [coursePlanRows]: [any[], any] = await connection.query(queryCoursePlan) as [any[], any];
        
        // 4. ปล่อย Connection คืน
        connection.release();

        // 5. กำหนดข้อมูลคงที่ (Static Data) สำหรับ ปีการศึกษาและภาคเรียน
        const staticStudyYears: number[] = [1, 2, 3, 4]; // ปี 1, 2, 3, 4
        const staticTerms: number[] = [1, 2];          // เทอม 1, 2

        // 6. รวมข้อมูลทั้งหมดสำหรับส่งกลับไปให้ Frontend
        // Frontend จะรับ Object นี้และทำการ 'แยก' (Separation) ไปใช้กับ Dropdown ต่างๆ
        const responseData = {
            subjects: subjectRows,
            coursePlans: coursePlanRows,
            studyYears: staticStudyYears,
            terms: staticTerms,
        };
        
        // console.log("Data to be sent to Frontend:", responseData); // สำหรับ Debug

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error during data fetch." },
            { status: 500 }
        );
    }
}


export async function POST(request: NextRequest) {
  try {
    
    // 1. เชื่อมต่อฐานข้อมูล
    const connection = await pool.getConnection();
    
    // 2. อ่านข้อมูลจาก request body
    const { coursePlanId, subjectId , studyYear, term} = await request.json();

    // 3. สร้าง SQL Query สําหรับการบันทึกข้อมูล
    const sql = `INSERT INTO subjectCourse (coursePlanId, subjectId, studyYear, term) VALUES (?, ?, ? , ?)`;

    // 4. รัน SQL Query
    const [result] = await connection.query(sql, [coursePlanId, subjectId, studyYear, term]);

    // 5. ปล่อย Connection คืน
    connection.release();

    // 6. ส่งสถานะความสำเร็จกลับไป
    return NextResponse.json({ message: "Subject added successfully" }, { status: 200 });

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}