"use client";
import { useState } from "react";
import { Button, Card, Col, Form, Input, InputNumber, Row, Space, Typography, message } from "antd";
import { useRouter } from "next/navigation";

export default function NewCoursePage() {
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
            <Title style={{ marginTop: 0, marginBottom: 0, fontSize: 18 }}>สร้างหลักสูตรใหม่</Title>
          </Col>
        </Row>
        <Card className="chemds-container">
          <Form layout="vertical" form={form} onFinish={onFinish}>
            {/* COURSE */}
            <Title level={5}>ข้อมูลหลักสูตร (ตาราง course)</Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="ชื่อหลักสูตร (ไทย)" name="nameCourseTh" rules={[{ required: true, message: "กรอกชื่อหลักสูตร (ไทย)" }]}>
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
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อเต็มปริญญา (ไทย)" name="nameFullDegreeTh">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อเต็มปริญญา (อังกฤษ)" name="nameFullDegreeEng">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อย่อปริญญา (ไทย)" name="nameInitialsDegreeTh">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อย่อปริญญา (อังกฤษ)" name="nameInitialsDegreeEng">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            {/* COURSE PLAN */}
            <Title level={5} style={{ marginTop: 12 }}>แผนการเรียน (ตาราง coursePlan)</Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="แผนการเรียน" name="planCourse" rules={[{ required: true, message: "กรอกแผนการเรียน" }]}>
                  <Input placeholder="แผนสหกิจศึกษา / แผนไม่สหกิจศึกษา" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชั่วโมงฝึกงาน" name="internshipHours" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="หน่วยกิตฝึกงาน" name="creditIntern" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="หน่วยกิตรวม" name="totalCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="หมวดศึกษาทั่วไป" name="generalSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="หมวดวิชาเฉพาะ" name="specificSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="หมวดเลือกเสรี" name="freeSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="วิชาแกน" name="coreSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="วิชาเฉพาะด้าน" name="spacailSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="วิชาเลือก" name="selectSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="อยู่ดีมีสุข" name="happySubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ผู้ประกอบการ" name="entrepreneurshipSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ภาษาและการสื่อสาร" name="languageSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="พลเมืองดี" name="peopleSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="สุนทรียศาสตร์" name="aestheticsSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Space>
              <Button onClick={() => router.push("/courses")}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>บันทึก</Button>
            </Space>
          </Form>
        </Card>
      </Space>
    </div>
  );
}


