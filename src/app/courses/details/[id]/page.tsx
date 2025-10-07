import React, { useEffect, useState } from 'react';
import CourseSubjectTable from '@/app/components/CourseSubjectTable'; 
// import { Flex, Table, Button, Space, Modal, message, Input, Select } from 'antd';
// import type { TableColumnsType } from 'antd';
// import { createStyles } from 'antd-style';
// import { useRouter } from 'next/navigation';


interface ServerPageProps {
  params: {
    id: string; // Server Component จะจัดการ params ได้โดยตรง
  };
}

export default async function App({ params }: ServerPageProps){
  const unwrappedParams = await params; 
  const subjectCourseId = unwrappedParams.id;

  return (
    // ส่งค่า ID ที่ถูกแกะแล้วลงไปเป็น Prop ธรรมดา
    <CourseSubjectTable subjectCourseId={subjectCourseId} />
  );
};
