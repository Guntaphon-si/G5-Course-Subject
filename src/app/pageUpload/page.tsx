'use client';

import { useState, useCallback } from 'react';
import { Button, Card, Col, Form, Row, Typography, message as antdMessage, Space, Upload, Tag, Divider, Alert } from 'antd';
import { UploadOutlined, InboxOutlined, FileTextOutlined } from '@ant-design/icons';

// --- จุดที่แก้ไข 1: สร้าง Array ของชื่อหัวคอลัมน์ที่จำเป็น ---
const requiredHeaders = [
  'ชื่อหลักสูตร', 'แผนการเรียน', 'ปีที่เรียน', 'เทอมที่เรียน', 'รหัสวิชา',
  'ชื่อวิชา(ภาษาไทย)', 'ชื่อวิชา(ภาษาอังกฤษ)', 'จำนวนหน่วยกิต', 'ชั่วโมงบรรยาย',
  'ชั่วโมงปฎิบัติ', 'ชั่วโมงเรียนรู้ด้วยตนเอง', 'กลุ่มของวิชาตามหลักสูตร'
];

export default function HomePage() {
  const { Title, Paragraph, Text } = Typography;
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [form] = Form.useForm();

  const handleBeforeUpload = useCallback((newFile: File) => {
    const isCsv = newFile.type === 'text/csv' || newFile.name.endsWith('.csv');
    if (!isCsv) {
      antdMessage.error('กรุณาอัปโหลดไฟล์ .csv เท่านั้น!');
      return Upload.LIST_IGNORE;
    }
    setFile(newFile);
    setStatusMessage('');
    return false;
  }, []);

  const handleRemove = useCallback(() => {
    setFile(null);
    return true;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setStatusMessage('กรุณาเลือกไฟล์ CSV ก่อน');
      antdMessage.warning('กรุณาเลือกไฟล์');
      return;
    }

    setIsUploading(true);
    setStatusMessage(`กำลังอัปโหลดไฟล์: ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await response.json();
      
      if (response.ok) {
        antdMessage.success(result.message || 'อัปโหลดสำเร็จ!');
        setStatusMessage(result.message);
        setFile(null);
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดบางอย่าง');
      }
    } catch (error: any) {
      antdMessage.error(`เกิดข้อผิดพลาด: ${error.message}`);
      setStatusMessage(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: 'auto' }}>
      <Title level={2}>หน้าอัปโหลดไฟล์วิชา (CSV)</Title>
      <Paragraph>
        ระบบนี้ใช้สำหรับนำเข้าข้อมูลรายวิชาจากไฟล์ CSV เข้าสู่ฐานข้อมูลโดยตรง
      </Paragraph>
      <Divider />
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item>
              <Upload.Dragger
                name="file"
                multiple={false}
                beforeUpload={handleBeforeUpload}
                onRemove={handleRemove}
                showUploadList={false}
                disabled={isUploading}
                accept=".csv"
                height={220}
              >
                {file ? (
                  <>
                    <p className="ant-upload-drag-icon">
                      <FileTextOutlined style={{ color: '#1890ff' }} />
                    </p>
                    <p className="ant-upload-text" style={{ fontSize: '18px' }}>{file.name}</p>
                    <p className="ant-upload-hint">
                      ขนาดไฟล์: {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <Paragraph type="secondary" style={{ marginTop: 16 }}>
                      คลิกปุ่ม "อัปโหลด" ด้านล่างเพื่อเริ่มการนำเข้าข้อมูล
                    </Paragraph>
                  </>
                ) : (
                  <>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">คลิก หรือลากไฟล์มาวางที่นี่เพื่ออัปโหลด</p>
                    <p className="ant-upload-hint">
                      รองรับการอัปโหลดไฟล์เดียว และต้องเป็นไฟล์นามสกุล .csv เท่านั้น
                    </p>
                  </>
                )}
              </Upload.Dragger>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={isUploading} icon={<UploadOutlined />} disabled={!file}>
                  {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
                </Button>
                {file && (
                   <Button danger onClick={() => setFile(null)} disabled={isUploading}>ล้างไฟล์</Button>
                )}
              </Space>
            </Form.Item>
          </Form>

          {statusMessage && (
             <Alert 
                message={statusMessage} 
                type={statusMessage.startsWith('เกิดข้อผิดพลาด:') ? 'error' : 'info'}
                showIcon 
                style={{ marginTop: 12 }} 
             />
          )}
        </Col>

        <Col xs={24} md={8}>
          <Card size="small">
            <Title level={5} style={{ marginTop: 0 }}>คำแนะนำ</Title>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 0 }}>- ไฟล์ต้องเป็นนามสกุล <Text code>.csv</Text></Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>- การเข้ารหัสไฟล์ (Encoding) ควรเป็น <Text code>UTF-8</Text></Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>- หัวคอลัมน์ต้องตรงตามเทมเพลตที่กำหนด</Paragraph>
            </Space>
            
            {/* --- จุดที่แก้ไข 2: เพิ่มส่วนแสดงผล --- */}
            <Divider style={{ margin: '12px 0' }} />
            <Paragraph strong style={{ marginBottom: 8 }}>
              หัวคอลัมน์ที่จำเป็นในไฟล์:
            </Paragraph>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {requiredHeaders.map(header => (
                <Tag key={header}>{header}</Tag>
              ))}
            </div>
            {/* --- สิ้นสุดส่วนที่แก้ไข --- */}
            
          </Card>
        </Col>
      </Row>
    </div>
  );
}