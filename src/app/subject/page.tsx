"use client";
import { useEffect, useState, useCallback } from 'react';
import { Card, Col, Row, Typography, Space, Button, message as antdMessage, Table, Input, Modal, Form, Select } from 'antd';
import { ReloadOutlined, EditOutlined } from '@ant-design/icons';

type SubjectRow = {
  subjectId: number;
  courseId: number;
  subjectTypeId: number;
  subjectCategoryId: number;
  subjectCode: string;
  nameSubjectThai: string;
  nameSubjectEng: string;
  credit: number;
  isVisible: number;
};

export default function SubjectPage() {
  const { Title } = Typography;
  const [form] = Form.useForm();
  const [listLoading, setListLoading] = useState(false);
  const [rows, setRows] = useState<SubjectRow[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<SubjectRow | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchRows = useCallback(async (q: string) => {
    try {
      setListLoading(true);
      const res = await fetch(`/api/subjects/ru-subject${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      const data = await res.json();
      setRows(data.items || []);
    } catch (e) {
      antdMessage.error('ดึงข้อมูลไม่สำเร็จ');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows('');
  }, [fetchRows]);

  const handleEdit = (record: SubjectRow) => {
    setEditingRow(record);
    form.setFieldsValue({
      subjectCode: record.subjectCode,
      nameSubjectThai: record.nameSubjectThai,
      nameSubjectEng: record.nameSubjectEng,
      credit: record.credit,
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
          ...values,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'อัปเดตไม่สำเร็จ');
      
      antdMessage.success('อัปเดตสำเร็จ');
      setEditOpen(false);
      form.resetFields();
      fetchRows(searchQ);
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
                <Input.Search 
                  allowClear 
                  placeholder="ค้นหา รหัส/ชื่อวิชา" 
                  value={searchQ} 
                  onChange={(e) => setSearchQ(e.target.value)} 
                  onSearch={() => fetchRows(searchQ)} 
                  style={{ width: 300 }}
                />
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={() => { setSearchQ(''); fetchRows(''); }}
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
            pagination={{ pageSize: 10 }}
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
                title: 'ชื่อวิชา (ไทย)', 
                dataIndex: 'nameSubjectThai', 
                key: 'nameSubjectThai',
                width: 250,
              },
              { 
                title: 'ชื่อวิชา (อังกฤษ)', 
                dataIndex: 'nameSubjectEng', 
                key: 'nameSubjectEng',
                width: 250,
              },
              { 
                title: 'หน่วยกิต', 
                dataIndex: 'credit', 
                key: 'credit', 
                width: 100,
                align: 'center',
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
              label="หน่วยกิต"
              name="credit"
              rules={[{ required: true, message: 'กรุณาระบุหน่วยกิต' }]}
            >
              <Input type="number" min={0} placeholder="เช่น 3" />
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