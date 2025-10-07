// src/app/components/CourseSubjectTable.tsx
"use client";
import React, { useEffect, useState, CSSProperties } from 'react';
import { Flex, Table, Button, Space, Modal, message, Input, Select } from 'antd';
import type { TableColumnsType } from 'antd';
import { createStyles } from 'antd-style';
import { useRouter } from 'next/navigation';


const useStyle = createStyles(({ css, token }) => {
  const { antCls } = token;
  
  return {
    customTable: css`
      ${antCls}-table {
        ${antCls}-table-container {
          ${antCls}-table-body,
          ${antCls}-table-content {
            scrollbar-width: thin;
            scrollbar-color: #eaeaea transparent;
            scrollbar-gutter: stable;
          }
        }
      }
    `,
  };
});

interface CourseSubjectTableProps {
  subjectCourseId: string;
}

interface FixedDataType {
  key: React.Key;
  name: string;
  description: string;
}

interface CourseDataType {
  key: React.Key;
  nameFullDegreeTh:string;
  planCourse: string;
  subjectCode: string;
  nameSubjectThai: string;
  nameSubjectEng: string;
  subjectCategoryName: string;
  subjectGroupName: string;
  studyYear: number;
  term: number;
}

// เปลี่ยนชื่อ App เป็น CourseSubjectTable และรับ Prop ใหม่
const CourseSubjectTable: React.FC<CourseSubjectTableProps> = ({ subjectCourseId }) => {
  // ... (useStyle, States, และ Router ยังคงเหมือนเดิม)
  // ...
  const { styles } = useStyle();
  const [dataSource, setDataSource] = useState<CourseDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseNameFilter, setCourseNameFilter] = useState<string>('all');
  const [allData, setAllData] = useState<CourseDataType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // const handleViewDetails = (id: number) => {
  //   // ไปที่หน้า details/ตาม id ที่ส่งมา
  //   router.push(`/courses/details/${id}`);
  // };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?',
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          // ส่ง request ไปยัง API เพื่อลบข้อมูล
          const response = await fetch(`/api/subjectCourse`, {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
          },
          // 3. ส่ง ID เข้าไปใน body ของ request
          body: JSON.stringify({ id: id }),
          });

          if (!response.ok) {
            throw new Error('ไม่สามารถลบข้อมูลได้');
          }

          // ลบข้อมูลใน State เพื่อให้ตารางอัปเดตทันที
          setAllData(prevData => prevData.filter(item => item.key !== id));
          message.success('ลบข้อมูลสำเร็จ');

        } catch (error) {
          console.error(error);
          message.error('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
      },
    });
  };

  const filterData = (data: CourseDataType[], term: string, nameFilter: string) => {
    const lowerCaseTerm = term.toLowerCase().trim();

    let filteredByName = data;
    // กรองตาม 'ชื่อหลักสูตร (ไทย)' ก่อน
    if (nameFilter !== 'all') {
      filteredByName = data.filter(item => item.nameFullDegreeTh === nameFilter);
    }
    
    if (!lowerCaseTerm) {
      return filteredByName; 
    }

    // กรองตามคำค้นหาในทุก Field (ตามเดิม)
    return filteredByName.filter(item => {
      const searchFields = [
        item.nameFullDegreeTh,
        item.planCourse,
        item.subjectCode,
        item.nameSubjectThai,
        item.nameSubjectEng,
        item.subjectCategoryName,
        item.subjectGroupName,
        item.studyYear.toString(), 
        item.term.toString(),       
      ].join('|').toLowerCase();

      return searchFields.includes(lowerCaseTerm);
    });
  };


  const fixedColumns: TableColumnsType<CourseDataType> = [
    { title: 'ชื่อหลักสูตร (ไทย)', dataIndex: 'nameFullDegreeTh', width: 50 },
    { title: 'แผนการเรียน', dataIndex: 'planCourse', width: 60},
    { title: 'รหัสรายวิชา', dataIndex: 'subjectCode', width: 50 },
    { title: 'ชื่อวิชา (ไทย)', dataIndex: 'nameSubjectThai', width: 100 },
    { title: 'ชื่อวิชา (อังกฤษ)', dataIndex: 'nameSubjectEng', width: 100 },
    { title: 'หมวดหมู่วิชา', dataIndex: 'subjectCategoryName', width: 50 },
    { title: 'กลุ่มสาระการเรียนรู้', dataIndex: 'subjectGroupName', width: 100 },
    { title: 'ปีที่เรียน', dataIndex: 'studyYear', width: 35 },
    { title: 'เทอมที่เรียน', dataIndex: 'term', width: 35 },
    {
        title: 'การจัดการ',
        key: 'action',
        width: 100,
        render: (text, record) => ( // record คือข้อมูลของแถวนั้นๆ
          <Space size="middle">
            {/* <Button onClick={() => handleViewDetails(record.key)}>
              👁️ ดูรายละเอียด
            </Button> */}
            <Button type="primary" danger onClick={() => handleDelete(Number(record.key))}>
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
        const response = await fetch(`/api/subjectCourse?id=${subjectCourseId}`); // เรียก Endpoint เดิม
        const data = await response.json();
        // ป้องกันกรณี API ส่ง object/error แทน array
        if (Array.isArray(data)) {
          setAllData(data); // <<< 3. เก็บข้อมูลทั้งหมด
          setDataSource(data); // <<< 4. แสดงข้อมูลทั้งหมดในครั้งแรก
        } else {
          console.warn('Unexpected /api/subjectCourse payload:', data);
          setAllData([]);
          setDataSource([]);
        }
      } catch (error) {
        console.error("Failed to fetch subjectCourse:", error);
        setDataSource([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectCourseId]);

  // 2. ปรับ useEffect ให้ใช้ courseNameFilter
  useEffect(() => {
    // ใช้ฟังก์ชัน filterData เพื่อรวมการกรองชื่อหลักสูตรและ Global Search
    const finalFilteredData = filterData(allData, searchTerm, courseNameFilter);
    setDataSource(finalFilteredData);
  }, [courseNameFilter, allData, searchTerm]);

  // 3. สร้างฟังก์ชันเพื่อสร้าง Option สำหรับชื่อหลักสูตร
  const getCourseNameOptions = () => {
      // ดึงค่าชื่อหลักสูตรที่ไม่ซ้ำกันจากข้อมูลทั้งหมด
      const names = Array.from(new Set(allData.map(item => item.nameFullDegreeTh))).sort();
      
      const options = names.map(name => ({
          value: name,
          label: name.length > 30 ? `${name.substring(0, 30)}...` : name, // ตัดข้อความยาวๆ เพื่อให้แสดงผลได้สวยงาม
      }));
      
      // เพิ่มตัวเลือก "ทั้งหมด"
      options.unshift({ value: 'all', label: 'ทั้งหมด' });
      return options;
  };

  return (
    <Flex vertical gap="small">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          {/* Component Filter ตามปี */}
          <label>กรองตามชื่อหลักสูตร:</label>
          <Select
            value={courseNameFilter}
            style={{ width: 120 }}
            onChange={setCourseNameFilter}
            options={getCourseNameOptions()}
            loading={loading && allData.length === 0}
          />
          {/* 4. Component Global Search */}
          <Input.Search
            placeholder="ค้นหาทุก Field..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // อัปเดต searchTerm
            style={{ width: 300 }}
            loading={loading}
          />
        </Space>
        <Button type="primary" onClick={() => router.push(`/courses/details/${subjectCourseId}/new?initialId=${subjectCourseId}`)}>+ สร้าง Subject Course เพิ่ม</Button>
      </div>
      <Table<CourseDataType>
        className={styles.customTable}
        columns={fixedColumns}
        dataSource={dataSource}
        pagination={{ pageSize: 10 }} // เพิ่ม Pagination เพื่อความสวยงาม
        scroll={{ x: 1750, y: 750 }} // ปรับ scroll x ให้กว้างขึ้น
        bordered
        loading={loading}
      />
    </Flex>
  );
};

export default CourseSubjectTable;