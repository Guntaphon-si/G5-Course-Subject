"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Form,
  Select,
  Input,
  InputNumber,
  Button,
  Card,
  Typography,
  Divider,
  Row,
  Col,
  message,
  Spin
} from 'antd';
import { FormInstance } from 'antd/lib/form';

const { Title, Text } = Typography;
const { Option } = Select;

type SubjectCategory = {
  subject_category_id: number;
  category_name: string;
  category_level: number;
  master_category: number | null;
};

type MasterCategory = {
  subject_category_id: number;
  category_name: string;
  sub_categories: SubjectCategory[];
};

type Course = {
  course_id: number;
  name_course_use: string;
};

// Component นี้ใช้เพื่อแสดงผลเท่านั้น ไม่กระทบการส่งข้อมูล
const CreditSumDisplay = ({ masterCategory, form }: { masterCategory: MasterCategory, form: FormInstance }) => {
  const credits = Form.useWatch('credits', form);
  const sum = useMemo(() => {
    if (!credits || !masterCategory.sub_categories) return 0;
    return masterCategory.sub_categories.reduce((acc, subCat) => {
      const value = credits[subCat.subject_category_id] || 0;
      return acc + Number(value);
    }, 0);
  }, [credits, masterCategory]);

  return (
    <Form.Item label={`ผลรวมหน่วยกิตของ "${masterCategory.category_name}"`}>
      <InputNumber value={sum} disabled style={{ width: '100%', fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.88)' }} />
    </Form.Item>
  );
};


export default function AddCoursePlanPage() {
  const [form] = Form.useForm();
  const [courses, setCourses] = useState<Course[]>([]);
  const [masterCategories, setMasterCategories] = useState<MasterCategory[]>([]);
  const [standaloneCategories, setStandaloneCategories] = useState<SubjectCategory[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/coursePlan/CourseDropDown'); 
        const data = await res.json();
        setCourses(data.items || []);
      } catch (error) {
        message.error('ไม่สามารถดึงข้อมูลหลักสูตรได้');
      }
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      async function fetchAndStructureCategories() {
        setLoadingCategories(true);
        try {
          const res = await fetch(`/api/subject-category?course_id=${selectedCourseId}`);
          const data = await res.json();
          const rawCategories: SubjectCategory[] = data.items || [];
          const mastersWithChildren: MasterCategory[] = [];
          const standalones: SubjectCategory[] = [];
          const topLevelCats = rawCategories.filter(cat => cat.category_level === 1);
          topLevelCats.forEach(master => {
            const subs = rawCategories.filter(sub => sub.master_category === master.subject_category_id);
            if (subs.length > 0) {
              mastersWithChildren.push({ ...master, sub_categories: subs });
            } else {
              standalones.push(master);
            }
          });
          setMasterCategories(mastersWithChildren);
          setStandaloneCategories(standalones);
        } catch (error) {
          message.error('ไม่สามารถดึงข้อมูลกลุ่มวิชาได้');
        } finally {
          setLoadingCategories(false);
        }
      }
      fetchAndStructureCategories();
    } else {
      setMasterCategories([]);
      setStandaloneCategories([]);
    }
  }, [selectedCourseId]);
  
  const handleCourseChange = (value: number) => {
    setSelectedCourseId(value);
    form.resetFields(['credits']);
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    
    // =================== จุดที่แก้ไข ===================
    // ไม่ต้องคำนวณผลรวมหรือแยกข้อมูลอีกต่อไป
    // `values` ที่ได้จากฟอร์มคือข้อมูลทั้งหมดที่ต้องส่งไป API
    const payload = values;
    // =================================================
    
    try {
      const res = await fetch('/api/coursePlan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      message.success('บันทึกแผนการเรียนสำเร็จ!');
      form.resetFields();
      setSelectedCourseId(null);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>เพิ่มแผนการเรียนใหม่</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ credits: {} }}
      >
        <Card title="ข้อมูลแผนการเรียน (Course Plan)">
           <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="course_id" label="เลือกหลักสูตร" rules={[{ required: true, message: 'กรุณาเลือกหลักสูตร' }]}>
                <Select showSearch placeholder="ค้นหาหรือเลือกหลักสูตร" onChange={handleCourseChange} optionFilterProp="children">
                  {courses.map(course => (
                    <Option key={course.course_id} value={course.course_id}>
                      {course.name_course_use}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="plan_course" label="ชื่อแผนการเรียน (เช่น แผนสหกิจศึกษา)" rules={[{ required: true, message: 'กรุณากรอกชื่อแผนการเรียน' }]}>
                <Input placeholder="เช่น แผนสหกิจศึกษา" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="total_credit" label="หน่วยกิตรวมตลอดหลักสูตร" rules={[{ required: true, message: 'กรุณากรอกหน่วยกิตรวม' }]}>
                <InputNumber style={{ width: '100%' }} placeholder="เช่น 128" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="credit_intern" label="หน่วยกิตฝึกงาน">
                <InputNumber style={{ width: '100%' }} placeholder="เช่น 6" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="internship_hours" label="ชั่วโมงฝึกงาน/สหกิจ">
                <InputNumber style={{ width: '100%' }} placeholder="เช่น 480" min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        <Card title="กำหนดหน่วยกิตตามกลุ่มวิชา (Credit Requirement)">
          {selectedCourseId ? (
            loadingCategories ? (
              <div style={{ textAlign: 'center' }}><Spin /></div>
            ) : (
              <>
                {/* ส่วนแสดงผลกลุ่มที่มีลำดับชั้น */}
                {masterCategories.map(masterCat => (
                  <div key={masterCat.subject_category_id}>
                    <Divider orientation="left" style={{ borderColor: '#d9d9d9' }}>{masterCat.category_name}</Divider>
                    <Row gutter={16}>
                      <Col span={24}>
                         <CreditSumDisplay masterCategory={masterCat} form={form} />
                      </Col>
                      {masterCat.sub_categories.map(subCat => (
                        <Col span={8} key={subCat.subject_category_id}>
                          <Form.Item name={['credits', subCat.subject_category_id]} label={subCat.category_name}>
                            <InputNumber style={{ width: '100%' }} placeholder="ระบุหน่วยกิต" min={0} />
                          </Form.Item>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
                
                {/* ส่วนแสดงผลกลุ่มวิชาเดี่ยว */}
                {standaloneCategories.length > 0 && <Divider orientation="left" style={{ borderColor: '#d9d9d9' }}>หมวดหมู่อื่นๆ</Divider>}
                <Row gutter={16}>
                    {standaloneCategories.map(standaloneCat => (
                        <Col span={8} key={standaloneCat.subject_category_id}>
                            <Form.Item name={['credits', standaloneCat.subject_category_id]} label={standaloneCat.category_name}>
                                <InputNumber style={{ width: '100%' }} placeholder="ระบุหน่วยกิต" min={0} />
                            </Form.Item>
                        </Col>
                    ))}
                </Row>
              </>
            )
          ) : (
            <Text type="secondary">กรุณาเลือกหลักสูตรก่อนเพื่อกำหนดหน่วยกิต</Text>
          )}
        </Card>

        <Form.Item style={{ marginTop: '24px' }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            บันทึกข้อมูล
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}