import React from 'react';
import CourseSubjectTable from '@/app/components/CourseSubjectTable'; 

interface ServerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function App({ params }: ServerPageProps) {
  // Await params to get the actual values
  const { id } = await params;

  return (
    <CourseSubjectTable subject_course_id={id} />
  );
}