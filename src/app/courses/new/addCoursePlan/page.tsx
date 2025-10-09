"use client";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { useRouter } from "next/navigation";

// Interface สำหรับข้อมูลหลักสูตรที่ดึงมาจาก API
interface CourseFromApi {
  course_id: number;
  name_course_th: string;
  name_course_use:string;
  // เพิ่ม field อื่นๆ ที่ API คืนค่ามาหากจำเป็น
}

// Interface สำหรับข้อมูลที่ส่งไป POST
interface CoursePlanFormValues {
  courseId: number;
  planCourse: string;
  internshipHours: number;
  creditIntern: number;
  totalCredit: number;
  generalSubjectCredit: number;
  specificSubjectCredit: number;
  freeSubjectCredit: number;
  coreSubjectCredit: number;
  spacailSubjectCredit: number;
  selectSubjectCredit: number;
  happySubjectCredit: number;
  entrepreneurshipSubjectCredit: number;
  languageSubjectCredit: number;
  peopleSubjectCredit: number;
  aestheticsSubjectCredit: number;
}

export default function AddCoursePlanPage() {
  const { Title } = Typography;
  // ใช้ Form.useForm<T> เพื่อกำหนด Type ของ Form Values
  const [form] = Form.useForm<CoursePlanFormValues>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  // กำหนด Type ที่ชัดเจนสำหรับ courses และเพิ่ม loading state
  const [courses, setCourses] = useState<CourseFromApi[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลหลักสูตรทั้งหมด (ใช้ useEffect เพื่อเรียก API เพียงครั้งเดียว)
  useEffect(() => {
    setLoading(true);
    fetch("/api/coursePlan/CourseDropDown")
      .then((res) => {
        if (!res.ok)
          throw new Error("ไม่สามารถดึงข้อมูลหลักสูตรได้จากเซิร์ฟเวอร์");
        return res.json();
      })
      .then((data: CourseFromApi[]) => {
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          message.error("รูปแบบข้อมูลหลักสูตรที่ได้รับไม่ถูกต้อง");
        }
      })
      .catch((err) => {
        console.error(err);
        message.error(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลหลักสูตร");
      })
      .finally(() => setLoading(false));
  }, []); // [] ทำให้ Effect ทำงานแค่ครั้งเดียวหลัง Render ครั้งแรก

  // ใช้ Type ที่กำหนดไว้ใน onFinish
  const onFinish = async (values: CoursePlanFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/coursePlan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาดในการบันทึก");
      message.success("บันทึกแผนการเรียนสำเร็จ");
      router.push("/courses");
    } catch (e: any) {
      message.error(e.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
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
              สร้างแผนการเรียนใหม่
            </Title>
          </Col>
        </Row>
        <Card className="chemds-container">
          <Form layout="vertical" form={form} onFinish={onFinish}>
            {/* เลือกหลักสูตร */}
            <Title level={5}>เลือกหลักสูตร</Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="หลักสูตร"
                  name="courseId"
                  rules={[{ required: true, message: "กรุณาเลือกหลักสูตร" }]}
                >
                  {/* เพิ่ม loading={loading} เพื่อแสดงสถานะการโหลด */}
                  <Select
                    placeholder="เลือกหลักสูตร"
                    showSearch
                    optionFilterProp="children"
                    loading={loading}
                  >
                    {courses
                      .filter((course) => course.course_id != null)
                      .map((course) => (
                        <Select.Option
                          key={course.course_id}
                          value={course.course_id}
                        >
                          {`${course.name_course_th|| "ไม่ระบุชื่อหลักสูตร"} (${course.name_course_use|| "ไม่ระบุชื่อหลักสูตร"} )`}
                        </Select.Option>
                      ))}

                    {/* ✅ กรณีมีบาง course ที่ไม่มี courseId ให้ fallback key */}
                    {/* {courses
                      .filter((course) => course.courseId == null)
                      .map((course, index) => (
                        <Select.Option
                          key={index}
                          value={index}
                        >
                          {course.nameCourseTh || "ไม่ระบุชื่อหลักสูตร"}
                        </Select.Option>
                      ))} */}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* COURSE PLAN */}
            <Title level={5} style={{ marginTop: 12 }}>
              ข้อมูลแผนการเรียน (ตาราง coursePlan)
            </Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="แผนการเรียน"
                  name="planCourse"
                  rules={[{ required: true, message: "กรอกแผนการเรียน" }]}
                >
                  <Input placeholder="แผนสหกิจศึกษา / แผนไม่สหกิจศึกษา" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="ชั่วโมงฝึกงาน"
                  name="internshipHours"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="หน่วยกิตฝึกงาน"
                  name="creditIntern"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="หน่วยกิตรวม"
                  name="totalCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="หมวดศึกษาทั่วไป"
                  name="generalSubjectCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="หมวดวิชาเฉพาะ"
                  name="specificSubjectCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="หมวดเลือกเสรี"
                  name="freeSubjectCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            {/* CREDIT REQUIRE - ตาราง creditRequire */}
            <Title level={5} style={{ marginTop: 12 }}>
              หน่วยกิตตามหมวดหมู่วิชา (ตาราง creditRequire)
            </Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="วิชาแกน"
                  name="coreSubjectCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="วิชาเฉพาะด้าน"
                  name="spacailSubjectCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="วิชาเลือก"
                  name="selectSubjectCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="กลุ่มสาระอยู่ดีมีสุข"
                  name="happySubjectCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="กลุ่มสาระศาสตร์แห่งผู้ประกอบการ"
                  name="entrepreneurshipSubjectCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="กลุ่มสาระภาษากับการสื่อสาร"
                  name="languageSubjectCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="กลุ่มสาระพลเมืองไทยและพลเมืองโลก"
                  name="peopleSubjectCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="กลุ่มสาระสุนทรียศาสตร์"
                  name="aestheticsSubjectCredit"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
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
