"use client";
import { useState } from "react";
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Typography, message } from "antd";
import { useRouter } from "next/navigation";

export default function AddCoursePlanPage() {
  const { Title } = Typography;
  const [form] = Form.useForm();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);

  // ดึงข้อมูลหลักสูตรทั้งหมด
  useState(() => {
    fetch("/api/course")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCourses(data);
        }
      })
      .catch(err => console.error(err));
  });

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/coursePlan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      message.success("บันทึกแผนการเรียนสำเร็จ");
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
            <Title style={{ marginTop: 0, marginBottom: 0, fontSize: 18 }}>สร้างแผนการเรียนใหม่</Title>
          </Col>
        </Row>
        <Card className="chemds-container">
          <Form layout="vertical" form={form} onFinish={onFinish}>
            {/* เลือกหลักสูตร */}
            <Title level={5}>เลือกหลักสูตร</Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="หลักสูตร" name="courseId" rules={[{ required: true, message: "กรุณาเลือกหลักสูตร" }]}>
                  <Select placeholder="เลือกหลักสูตร" showSearch optionFilterProp="children">
                    {courses.map((course) => (
                      <Select.Option key={course.courseId} value={course.courseId}>
                        {course.nameCourseTh}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* COURSE PLAN */}
            <Title level={5} style={{ marginTop: 12 }}>ข้อมูลแผนการเรียน (ตาราง coursePlan)</Title>
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
            </Row>

            {/* CREDIT REQUIRE - ตาราง creditRequire */}
            <Title level={5} style={{ marginTop: 12 }}>หน่วยกิตตามหมวดหมู่วิชา (ตาราง creditRequire)</Title>
            <Row gutter={12}>
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
                <Form.Item label="กลุ่มสาระอยู่ดีมีสุข" name="happySubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="กลุ่มสาระศาสตร์แห่งผู้ประกอบการ" name="entrepreneurshipSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="กลุ่มสาระภาษากับการสื่อสาร" name="languageSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="กลุ่มสาระพลเมืองไทยและพลเมืองโลก" name="peopleSubjectCredit" initialValue={0}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="กลุ่มสาระสุนทรียศาสตร์" name="aestheticsSubjectCredit" initialValue={0}>
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