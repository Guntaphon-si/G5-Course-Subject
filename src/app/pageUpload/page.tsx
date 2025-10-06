'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Button, Card, Col, Form, Row, Typography, message as antdMessage, Space } from 'antd';
import { UploadOutlined, LinkOutlined } from '@ant-design/icons';

export default function HomePage() {
  const { Title, Paragraph, Text } = Typography;
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setMessage('กรุณาเลือกไฟล์ CSV ก่อนครับ');
      return;
    }

    setIsUploading(true);
    setMessage('กำลังอัปโหลดและประมวลผลไฟล์...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`อัปโหลดสำเร็จ! เพิ่มข้อมูลทั้งหมด ${result.insertedRows} แถว`);
        antdMessage.success('อัปโหลดสำเร็จ');
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดบางอย่าง');
      }
    } catch (error: any) {
      setMessage(`เกิดข้อผิดพลาด: ${error.message}`);
      antdMessage.error(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: 10 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        <Row>
          <Col span={12}>
            <Title style={{ marginTop: 0, marginBottom: 0, fontSize: 18 }}>
              อัปโหลดไฟล์ CSV หลักสูตร
            </Title>
          </Col>
        </Row>

        <Card className="chemds-container">
          <Form layout="vertical" onSubmitCapture={handleSubmit}>
            <Form.Item label="เลือกไฟล์ CSV">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <Paragraph style={{ marginTop: 8 }}>
                <Text type="secondary">เลือกไฟล์ <Text code>course_cpe_60_not_int.csv</Text> เพื่อบันทึกลงฐานข้อมูล</Text>
              </Paragraph>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isUploading} icon={<UploadOutlined />}>
                {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
              </Button>
            </Form.Item>
          </Form>

          {message && (
            <Paragraph style={{ marginTop: 12 }}>{message}</Paragraph>
          )}

          <div style={{ marginTop: 16 }}>
            <Link href="/pre-subject">
              <Button icon={<LinkOutlined />}>ไปหน้าจับเชื่อมรายวิชาที่เกี่ยวข้อง (preSubject)</Button>
            </Link>
          </div>
        </Card>
      </Space>
    </div>
  );
}


