"use client";
import { useState } from "react";
import { Button, Card, Col, Form, Input, Row, Space, Typography, message } from "antd";
import { useRouter } from "next/navigation";

export default function AddCoursePage() {
  const { Title } = Typography;
  const [form] = Form.useForm();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      message.success("บันทึกหลักสูตรสำเร็จ");
      router.push("/courses");
    } catch (e: any) {
      message.error(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 10 }}>
      <Space direction="vertical" style={{ width: "100%" }} size={10}>
        <Row>
          <Col span={12}>
            <Title style={{ marginTop: 0, marginBottom: 0, fontSize: 18 }}>
              สร้างหลักสูตรใหม่
            </Title>
          </Col>
        </Row>
        <Card className="chemds-container">
          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Title level={5}>ข้อมูลหลักสูตร</Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item 
                  label="ชื่อหลักสูตร (ไทย)" 
                  name="nameCourseTh" 
                  rules={[{ required: true, message: "กรอกชื่อหลักสูตร (ไทย)" }]}
                >
                  <Input placeholder="วศ.คอม 60" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อหลักสูตร (ใช้จริง)" name="nameCourseUse">
                  <Input placeholder="วศ.คอม 60" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อหลักสูตร (อังกฤษ)" name="nameCourseEng">
                  <Input placeholder="B.Eng. Computer Engineering" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อเต็มปริญญา (ไทย)" name="nameFullDegreeTh">
                  <Input placeholder="วิศวกรรมศาสตรบัณฑิต" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อเต็มปริญญา (อังกฤษ)" name="nameFullDegreeEng">
                  <Input placeholder="Bachelor of Engineering" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อย่อปริญญา (ไทย)" name="nameInitialsDegreeTh">
                  <Input placeholder="วศ.บ." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อย่อปริญญา (อังกฤษ)" name="nameInitialsDegreeEng">
                  <Input placeholder="B.Eng." />
                </Form.Item>
              </Col>
            </Row>

            <Space style={{ marginTop: 16 }}>
              <Button onClick={() => router.push("/courses")}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                บันทึก
              </Button>
            </Space>
          </Form>
        </Card>
      </Space>
    </div>
  );
}