import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT department_id, department_code , department_name FROM department`
    );
    connection.release();
    
    return NextResponse.json(rows);

  } catch (error) {
    console.error("Database Error (department-for-dropdown):", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}