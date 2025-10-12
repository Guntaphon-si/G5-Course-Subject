"use client";
import React, { useEffect, useState } from 'react';
import { Flex, Table, Button, Space, Modal, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { createStyles } from 'antd-style';
import { useRouter } from 'next/navigation';

const useStyle = createStyles(({ css, token, prefixCls }) => {
  return {
    customTable: css`
      .${prefixCls}-table {
        .${prefixCls}-table-container {
          .${prefixCls}-table-body,
          .${prefixCls}-table-content {
            scrollbar-width: thin;
            scrollbar-color: #eaeaea transparent;
            scrollbar-gutter: stable;
          }
        }
      }
    `,
  };
});


interface FixedDataType {
  key: React.Key;
  name: string;
  description: string;
}
interface CourseDataType {
  key: React.Key;
  course_plan_id: number;
name_course_use: string;
plan_course: string;
total_credit: number;
internship_hours: number;
credit_intern: number;
}
interface DetailDataType {
  title: string;
  credit: number;
}

const App: React.FC = () => {
  const { styles } = useStyle();
  const [dataSource, setDataSource] = useState<CourseDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const handleViewDetails = (id: number) => {
    // ไปที่หน้า details/ตาม id ที่ส่งมา
    router.push(`/courses/details/${id}`);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?',
      content: 'ข้อมูลจะถูกซ่อน แต่ยังคงอยู่ในระบบ',
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          // ส่ง request ไปยัง API เพื่อลบข้อมูล
          const response = await fetch(`/api/course`, {
            method: 'PATCH',
            headers: {
            'Content-Type': 'application/json',
          },
          // 3. ส่ง ID เข้าไปใน body ของ request
          body: JSON.stringify({ course_plan_id: id }),
          });

          if (!response.ok) {
            throw new Error('ไม่สามารถลบข้อมูลได้');
          }

          // ลบข้อมูลใน State เพื่อให้ตารางอัปเดตทันที
          setDataSource(dataSource.filter(item => item.key !== id));
          message.success('ลบข้อมูลสำเร็จ');

        } catch (error) {
          console.error(error);
          message.error('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
      },
    });
  };
  const fixedColumns: TableColumnsType<CourseDataType> = [

 { title: 'ชื่อหลักสูตร (ไทย)', dataIndex: 'name_course_use', fixed: true, width: 100 },
{ title: 'แผนการเรียน', dataIndex: 'plan_course', width: 150, fixed: true },
{ title: 'หน่วยกิตรวม', dataIndex: 'total_credit', width: 120 }    ,
// { title: 'หมวดวิชาศึกษาทั่วไป', dataIndex: 'general_subject_credit', width: 150 },
// { title: 'หมวดวิชาเฉพาะ', dataIndex: 'specific_subject_credit', width: 150 },
// { title: 'หมวดวิชาเลือกเสรี', dataIndex: 'free_subject_credit', width: 150 },
// { title: 'วิชาแกน', dataIndex: 'core_subject_credit', width: 120 },
// { title: 'วิชาเฉพาะด้าน', dataIndex: 'special_subject_credit', width: 150 },
// { title: 'วิชาเลือก', dataIndex: 'select_subject_credit', width: 120 },
// { title: 'กลุ่มสาระอยู่ดีมีสุข', dataIndex: 'happy_subject_credit', width: 180 },
// { title: 'กลุ่มสาระศาสตร์แห่งผู้ประกอบการ', dataIndex: 'entrepreneurship_subject_credit', width: 220 },
// { title: 'กลุ่มสาระภาษาและการสื่อสาร', dataIndex: 'language_subject_credit', width: 220 },
// { title: 'กลุ่มสาระพลเมืองดี', dataIndex: 'people_subject_credit', width: 180 },
// { title: 'กลุ่มสาระสุนทรียศาสตร์', dataIndex: 'aesthetics_subject_credit', width: 180 },
{ title: 'ชั่วโมงฝึกงาน', dataIndex: 'internship_hours', width: 150 },
{ title: 'หน่วยกิตฝึกงาน', dataIndex: 'credit_intern', width: 150 },
  {
      title: 'การจัดการ',
      key: 'action',
      fixed: 'right', // ทำให้คอลัมน์นี้อยู่ขวาสุดเสมอ
      width: 150,
      render: (text, record) => ( // record คือข้อมูลของแถวนั้นๆ
        <Space size="middle">
          <Button onClick={() => handleViewDetails(record.course_plan_id)}>
            👁️ ดูรายละเอียด
          </Button>
          <Button type="primary" danger onClick={() => handleDelete(record.course_plan_id)}>
            🗑️ ลบ
          </Button>
        </Space>
      ),
    },
];
   useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/course'); // เรียก Endpoint เดิม
        const data = await response.json();
        // ป้องกันกรณี API ส่ง object/error แทน array
        if (Array.isArray(data)) {
          setDataSource(data);
        } else {
          console.warn('Unexpected /api/course payload:', data);
          setDataSource([]);
        }
        console.log(data);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        setDataSource([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  const ExpandedContent: React.FC<{ courseId: number }> = ({ courseId }) => {
  const [details, setDetails] = useState<DetailDataType[]>([]);
  const [detailLoading, setDetailLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setDetailLoading(true);
        // **!!! เปลี่ยน API Endpoint ตรงนี้ให้ตรงกับ Backend ของคุณ !!!**
        const response = await fetch(`/api/course/creditDetail?id=${courseId}`);
        const data = await response.json();

        // แปลง Object ที่ได้จาก API ให้เป็น Array เพื่อใช้กับ Table ย่อย
        const formattedData: DetailDataType[] = [
          ...data
        ].filter(item => item.credit != null); // กรองเฉพาะรายการที่มีข้อมูล

        setDetails(formattedData);
      } catch (error) {
        console.error("Failed to fetch course details:", error);
        message.error('ไม่สามารถโหลดรายละเอียดหน่วยกิตได้');
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetails();
  }, [courseId]);

  const detailColumns: TableColumnsType<DetailDataType> = [
    { title: 'หมวดวิชา/กลุ่มสาระ', dataIndex: 'title', width: 300 },
    { title: 'หน่วยกิต', dataIndex: 'credit', width: 100 },
  ];


  return (
    <div style={{ padding: '16px', background: '#fafafa' }}>
      <p style={{ fontWeight: 'bold' }}>รายละเอียดหน่วยกิตย่อย</p>
      <Table
        columns={detailColumns}
        dataSource={details.map((item, index) => ({ ...item, key: index }))}
        pagination={false}
        loading={detailLoading}
        size="small"
        bordered
      />
    </div>
  );
};


  return (
    <Flex vertical gap="small">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" onClick={() => router.push('/courses/new/')}>+ สร้างหลักสูตร</Button>
          &nbsp;
        <Button type="primary" onClick={() => router.push('/courses/new/addCoursePlan')}>+ สร้างแผนการเรียน</Button>
      </div>
      <Table<CourseDataType>
        className={styles.customTable}
        columns={fixedColumns}
        dataSource={dataSource}
        pagination={{ pageSize: 10 }} // เพิ่ม Pagination เพื่อความสวยงาม
        scroll={{ x: 1500}} // ปรับ scroll x ให้กว้างขึ้น
        bordered

        expandable={{
          expandedRowRender: (record) => (
            <ExpandedContent courseId={record.course_plan_id} />
          ),
          rowExpandable: (record) => record.total_credit !== 0, // กำหนดเงื่อนไขการขยายถ้าต้องการ
        }}

      />
    </Flex>
  );
};

export default App;