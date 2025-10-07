'use client';

import { useState, useCallback } from 'react';
import { Button, Card, Col, Form, Row, Typography, message as antdMessage, Space, Upload, Tag, Divider } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';

export default function HomePage() {
  const { Title, Paragraph, Text } = Typography;
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleBeforeUpload = useCallback((newFile: File) => {
    setFile(newFile);
    return false; // prevent auto upload
  }, []);

  const handleRemove = useCallback(() => {
    setFile(null);
    return true;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setStatusMessage('กรุณาเลือกไฟล์ CSV ก่อนครับ');
      antdMessage.warning('กรุณาเลือกไฟล์');
      return;
    }

    setIsUploading(true);
    setStatusMessage('กำลังอัปโหลดและประมวลผลไฟล์...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (response.ok) {
        setStatusMessage(`อัปโหลดสำเร็จ! เพิ่มข้อมูลทั้งหมด ${result.insertedRows} แถว`);
        antdMessage.success('อัปโหลดสำเร็จ');
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดบางอย่าง');
      }
    } catch (error: any) {
      setStatusMessage(`เกิดข้อผิดพลาด: ${error.message}`);
      antdMessage.error(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  return (
    <div style={{ padding: 10 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        <Row>
          <Col span={12}>
            <Title style={{ marginTop: 0, marginBottom: 0, fontSize: 18 }}>อัปโหลดไฟล์ CSV หลักสูตร</Title>
          </Col>
        </Row>

        <Card className="chemds-container">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Form layout="vertical" onFinish={handleSubmit}>
                <Form.Item label="เลือกไฟล์ CSV">
                  <Upload.Dragger
                    name="file"
                    multiple={false}
                    accept=".csv"
                    beforeUpload={handleBeforeUpload}
                    onRemove={handleRemove}
                    fileList={file ? [{ uid: '-1', name: file.name, status: 'done' as const }]: []}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">ลากและวางไฟล์ CSV ที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                    <p className="ant-upload-hint">รองรับเฉพาะไฟล์ .csv เท่านั้น</p>
                  </Upload.Dragger>
                  <Paragraph style={{ marginTop: 8 }}>
                    <Text type="secondary">
  กรุณาใช้รูปแบบไฟล์ตามเทมเพลต เช่น <Text code>course_cpe_60_not_int.csv</Text>
</Text>

<Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
  โดยในไฟล์ควรประกอบไปด้วยหัวข้อต่อไปนี้:
</Text>

<div style={{ marginTop: 10 }}>
  <Text code>
    {`ชื่อหลักสูตร,
แผนการเรียน,
ปีที่เรียน,
เทอมที่เรียน,
รหัสวิชา,
ชื่อวิชา(ภาษาไทย),
ชื่อวิชา(ภาษาอังกฤษ),
จำนวนหน่วยกิต,
ชั่วโมงบรรยาย,
ชั่วโมงปฏิบัติ,
ชั่วโมงเรียนรู้ด้วยตนเอง,
กลุ่มของวิชาตามหลักสูตร,
บังคับหรือไม่บังคับ (ต้องเรียน: 0, เลือกเรียนตัวไหนก็ได้ในหมวดเดียวกัน: 1)`}
  </Text>
</div>

                  </Paragraph>
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={isUploading} icon={<UploadOutlined />}>
                      {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
                    </Button>
                    <Button danger onClick={() => setFile(null)} disabled={isUploading || !file}>ล้างไฟล์</Button>
                  </Space>
                </Form.Item>
              </Form>

              {statusMessage && (
                <Paragraph style={{ marginTop: 12 }}>{statusMessage}</Paragraph>
              )}
            </Col>

            <Col xs={24} md={8}>
              <Card size="small" variant="outlined">
                <Title level={5} style={{ marginTop: 0 }}>คำแนะนำการอัปโหลด</Title>
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Paragraph style={{ marginBottom: 0 }}>- ไฟล์ต้องเป็นรหัส UTF-8</Paragraph>
                  <Paragraph style={{ marginBottom: 0 }}>- หัวคอลัมน์ต้องตรงตามเทมเพลต</Paragraph>
                </Space>
                <Divider style={{ margin: '12px 0' }} />
                <Paragraph style={{ marginBottom: 6 }}>สถานะ:</Paragraph>
                <Tag color={isUploading ? 'processing' : file ? 'blue' : 'default'}>
                  {isUploading ? 'กำลังอัปโหลด' : file ? 'มีไฟล์ที่เลือก' : 'ยังไม่ได้เลือกไฟล์'}
                </Tag>
              </Card>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
}

