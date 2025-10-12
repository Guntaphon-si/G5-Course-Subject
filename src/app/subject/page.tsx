"use client";
import { useEffect, useState, useCallback } from 'react';
import { Card, Col, Row, Typography, Space, Button, message as antdMessage, Table, Input, Modal, Form, Select } from 'antd';
import { ReloadOutlined, EditOutlined } from '@ant-design/icons';

type SubjectRow = {
  subjectId: number;
  courseId: number;
  subjectTypeId: number;
  subjectCategoryId: number;
  subCreditId: number;
  subjectCode: string;
  nameSubjectThai: string;
  nameSubjectEng: string;
  isVisible: number;
  nameCourseUse: string;
  credit: number;
  lectureHours: number;
  labHours: number;
  bySelfHours: number;
};

type CourseOption = {
  courseId: number;
  nameCourseUse: string;
};

export default function SubjectPage() {
  const { Title } = Typography;
  const [form] = Form.useForm();
  const [listLoading, setListLoading] = useState(false);
  const [rows, setRows] = useState<SubjectRow[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<SubjectRow | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchRows = useCallback(async (q: string, courseId: string = '') => {
    try {
      setListLoading(true);
      let url = `/api/subjects/ru-subject?`;
      if (q) url += `q=${encodeURIComponent(q)}&`;
      if (courseId) url += `courseId=${encodeURIComponent(courseId)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setRows(data.items || []);
    } catch (e) {
      antdMessage.error('ดึงข้อมูลไม่สำเร็จ');
    } finally {
      setListLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/course/list');
      const data = await res.json();
      setCourseOptions(data.items || []);
    } catch (e) {
      antdMessage.error('ดึงข้อมูลหลักสูตรไม่สำเร็จ');
    }
  }, []);

  useEffect(() => {
    fetchRows('', '');
    fetchCourses();
  }, [fetchRows, fetchCourses]);

  const handleEdit = (record: SubjectRow) => {
    setEditingRow(record);
    form.setFieldsValue({
      subjectCode: record.subjectCode,
      nameSubjectThai: record.nameSubjectThai,
      nameSubjectEng: record.nameSubjectEng,
      isVisible: record.isVisible,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingRow) return;
    
    try {
      const values = await form.validateFields();
      setUpdating(true);
      
      const res = await fetch('/api/subjects/ru-subject', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: editingRow.subjectId,
          subCreditId: editingRow.subCreditId,
          ...values,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'อัปเดตไม่สำเร็จ');
      
      antdMessage.success('อัปเดตสำเร็จ');
      setEditOpen(false);
      form.resetFields();
      fetchRows(searchQ, selectedCourse);
    } catch (e: any) {
      antdMessage.error(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ padding: 10 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        <Row>
          <Col span={12}>
            <Title style={{ marginTop: 0, marginBottom: 0, fontSize: 18 }}>จัดการรายวิชา</Title>
          </Col>
        </Row>

        <Card className="chemds-container">
          <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
            <Col>
              <Title level={4} style={{ margin: 0, fontSize: 16 }}>รายการวิชาทั้งหมด</Title>
            </Col>
            <Col>
              <Space>
                <Select
                  placeholder="เลือกหลักสูตร"
                  value={selectedCourse || undefined}
                  onChange={(value) => {
                    setSelectedCourse(value);
                    fetchRows(searchQ, value);
                  }}
                  style={{ width: 250 }}
                >
                <Select.Option value="">ไม่ระบุ</Select.Option>
                  {courseOptions.map((course) => (
                    <Select.Option key={course.courseId} value={String(course.courseId)}>
                      {course.nameCourseUse}
                    </Select.Option>
                  ))}
                </Select>
                <Input.Search 
                  allowClear 
                  placeholder="ค้นหา รหัส/ชื่อวิชา" 
                  value={searchQ} 
                  onChange={(e) => setSearchQ(e.target.value)} 
                  onSearch={() => fetchRows(searchQ, selectedCourse)} 
                  style={{ width: 300 }}
                />
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={() => { 
                    setSearchQ(''); 
                    setSelectedCourse('');
                    fetchRows('', ''); 
                  }}
                >
                  ล้าง
                </Button>
              </Space>
            </Col>
          </Row>

          <Table
            rowKey="subjectId"
            loading={listLoading}
            dataSource={rows}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: false,
              hideOnSinglePage: false 
            }}
            scroll={{ x: 1200 }}
            columns={[
              { 
                title: 'รหัสวิชา', 
                dataIndex: 'subjectCode', 
                key: 'subjectCode', 
                width: 120,
                fixed: 'left',
              },
              { 
                title: 'หลักสูตร', 
                dataIndex: 'nameCourseUse', 
                key: 'nameCourseUse',
                width: 180,
              },
              { 
                title: 'ชื่อวิชา (ไทย/อังกฤษ)', 
                key: 'subjectName',
                width: 300,
                render: (_: any, record: SubjectRow) => (
                  <div>
                    <div>{record.nameSubjectThai}</div>
                    <div style={{ color: '#888', fontSize: '0.9em' }}>{record.nameSubjectEng}</div>
                  </div>
                )
              },
              { 
                title: 'หน่วยกิต', 
                key: 'creditFormat', 
                width: 130,
                align: 'center',
                render: (_: any, record: SubjectRow) => {
                  const credit = record.credit || 0;
                  const lecture = record.lectureHours || 0;
                  const lab = record.labHours || 0;
                  const bySelf = record.bySelfHours || 0;
                  return `${credit} (${lecture}-${lab}-${bySelf})`;
                }
              },
              { 
                title: 'สถานะ', 
                dataIndex: 'isVisible', 
                key: 'isVisible', 
                width: 100,
                align: 'center',
                render: (val: number) => val === 1 ? 'แสดง' : 'ซ่อน'
              },
              {
                title: 'การทำงาน', 
                key: 'actions', 
                width: 120,
                fixed: 'right',
                render: (_: any, record: SubjectRow) => (
                  <Button 
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  >
                    แก้ไข
                  </Button>
                )
              }
            ]}
          />
        </Card>

        <Modal
          title="แก้ไขรายวิชา"
          open={editOpen}
          onCancel={() => {
            setEditOpen(false);
            form.resetFields();
          }}
          onOk={handleUpdate}
          confirmLoading={updating}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 20 }}
          >
            <Form.Item
              label="รหัสวิชา"
              name="subjectCode"
              rules={[{ required: true, message: 'กรุณากรอกรหัสวิชา' }]}
            >
              <Input placeholder="เช่น CS101" />
            </Form.Item>

            <Form.Item
              label="ชื่อวิชา (ไทย)"
              name="nameSubjectThai"
              rules={[{ required: true, message: 'กรุณากรอกชื่อวิชา' }]}
            >
              <Input placeholder="ชื่อวิชาภาษาไทย" />
            </Form.Item>

            <Form.Item
              label="ชื่อวิชา (อังกฤษ)"
              name="nameSubjectEng"
              rules={[{ required: true, message: 'กรุณากรอกชื่อวิชา' }]}
            >
              <Input placeholder="Subject name in English" />
            </Form.Item>

            <Form.Item
              label="สถานะการแสดง"
              name="isVisible"
              rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
            >
              <Select>
                <Select.Option value={1}>แสดง</Select.Option>
                <Select.Option value={0}>ซ่อน</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </div>
  );
}