"use client";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
  message,
  InputNumber,
  Divider,
} from "antd";
import { useRouter } from "next/navigation";

interface CourseData {
  // ข้อมูล course
  name_course_th: string;
  name_course_use?: string;
  name_course_eng?: string;
  name_full_degree_th?: string;
  name_full_degree_eng?: string;
  name_initials_degree_th?: string;
  name_initials_degree_eng?: string;
  department_id: number;
  
  // หมวดวิชาศึกษาทั่วไป
  general_subject_credit?: number;
  
  // หมวดวิชาเฉพาะ
  specific_subject_credit?: number;
  core_subject_credit?: number;
  special_subject_credit?: number;
  select_subject_credit?: number;
  
  // กลุ่มสาระ (ในหมวดวิชาศึกษาทั่วไป)
  happy_subject_credit?: number;
  entrepreneurship_subject_credit?: number;
  language_subject_credit?: number;
  people_subject_credit?: number;
  aesthetics_subject_credit?: number;
  
  // หมวดวิชาเลือกเสรี
  free_subject_credit?: number;
  
  // ฝึกงาน
  internship_hours?: number;
  credit_intern?: number;
}

interface DepartmentFromApi {
  dept_id: number;
  dept_code: string;
  dept_name: string;
  dept_alias_th?: string;
}

export default function AddCoursePage() {
  const { Title, Text } = Typography;
  const [form] = Form.useForm<CourseData>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<DepartmentFromApi[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/department")
      .then((res) => {
        if (!res.ok)
          throw new Error("ไม่สามารถดึงข้อมูลคณะได้จากเซิร์ฟเวอร์");
        return res.json();
      })
      .then((data: DepartmentFromApi[]) => {
        if (Array.isArray(data)) {
          setDepartment(data);
        } else {
          message.error("รูปแบบข้อมูลคณะที่ได้รับไม่ถูกต้อง");
        }
      })
      .catch((err) => {
        console.error(err);
        message.error(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลคณะ");
      })
      .finally(() => setLoading(false));
  }, []);

  const onFinish = async (values: CourseData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/course/addCourse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("Server Error Response:", data);
        throw new Error(data.message || "เกิดข้อผิดพลาดในการบันทึกหลักสูตร");
      }

      message.success("บันทึกหลักสูตรสำเร็จ");
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
          <Col span={24}>
            <Title style={{ marginTop: 0, marginBottom: 0, fontSize: 18 }}>
              สร้างหลักสูตรใหม่
            </Title>
          </Col>
        </Row>

        <Card className="chemds-container">
          <Form layout="vertical" form={form} onFinish={onFinish}>
            {/* ข้อมูลหลักสูตร */}
            <Title level={5}>ข้อมูลหลักสูตร</Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="ชื่อหลักสูตร (ไทย)"
                  name="name_course_th"
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อหลักสูตร (ไทย)" },
                  ]}
                >
                  <Input placeholder="หลักสูตรวิศวกรรมศาสตร์ เอกวิศวกรรมคอมพิวเตอร์" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อหลักสูตร (ใช้จริง)" name="name_course_use">
                  <Input placeholder="วศ.คอม 60" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="ชื่อหลักสูตร (อังกฤษ)" name="name_course_eng">
                  <Input placeholder="Bachelor of Engineering Program in Computer Engineering" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* ชื่อปริญญา */}
            <Title level={5}>ชื่อปริญญา</Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="ชื่อเต็มปริญญา (ไทย)"
                  name="name_full_degree_th"
                >
                  <Input placeholder="วิศวกรรมศาสตรบัณฑิต (วิศวกรรมคอมพิวเตอร์)" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="ชื่อเต็มปริญญา (อังกฤษ)"
                  name="name_full_degree_eng"
                >
                  <Input placeholder="Bachelor of Engineering (Computer Engineering)" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="ชื่อย่อปริญญา (ไทย)"
                  name="name_initials_degree_th"
                >
                  <Input placeholder="วศ.บ. (วิศวกรรมคอมพิวเตอร์)" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="ชื่อย่อปริญญา (อังกฤษ)"
                  name="name_initials_degree_eng"
                >
                  <Input placeholder="B.Eng. (Computer Engineering)" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* สังกัดและแผนการเรียน */}
            <Title level={5}>สังกัดและแผนการเรียน</Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="คณะ"
                  name="department_id"
                  rules={[{ required: true, message: "กรุณาเลือกคณะ" }]}
                >
                  <Select
                    placeholder="เลือกคณะ"
                    optionFilterProp="children"
                    loading={loading}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as string)
                        ?.toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {department
                      .filter((dept) => dept.dept_id != null)
                      .map((dept) => (
                        <Select.Option
                          key={dept.dept_id}
                          value={dept.dept_id}
                        >
                          {`${dept.dept_name} (${dept.dept_code})`}
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
              </Col>
               <Col span={6}>
                <Form.Item
                  label="แผนการเรียน"
                  name="plan_course"
                  rules={[
                    { required: true, message: "กรุณากรอกแผนการเรียน" },
                  ]}
                >
                  <InputNumber
                    min={1}
                    placeholder="60"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="หน่วยกิตรวม" name="total_credit">
                  <InputNumber
                    min={0}
                    placeholder="140"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* 3.1.1 หมวดวิชาศึกษาทั่วไป */}
            <Title level={5}>3.1.1 หมวดวิชาศึกษาทั่วไป</Title>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label="หน่วยกิตขั้นต่ำ"
                  name="general_subject_credit"
                  extra={<Text type="secondary">ตัวอย่าง: 30 หน่วยกิต</Text>}
                >
                  <InputNumber
                    min={0}
                    placeholder="30"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12} style={{ marginLeft: 20 }}>
              <Col span={24}>
                <Text strong>กลุ่มสาระต่างๆ:</Text>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="กลุ่มสาระอยู่ดีมีสุข"
                  name="happy_subject_credit"
                >
                  <InputNumber
                    min={0}
                    placeholder="5"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="กลุ่มสาระศาสตร์แห่งผู้ประกอบการ"
                  name="entrepreneurship_subject_credit"
                >
                  <InputNumber
                    min={0}
                    placeholder="6"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="กลุ่มสาระภาษากับการสื่อสาร"
                  name="language_subject_credit"
                >
                  <InputNumber
                    min={0}
                    placeholder="13"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="กลุ่มสาระพลเมืองไทยและพลเมืองโลก"
                  name="people_subject_credit"
                >
                  <InputNumber
                    min={0}
                    placeholder="3"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="กลุ่มสาระสุนทรียศาสตร์"
                  name="aesthetics_subject_credit"
                >
                  <InputNumber
                    min={0}
                    placeholder="3"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* 3.1.2 หมวดวิชาเฉพาะ */}
            <Title level={5}>3.1.2 หมวดวิชาเฉพาะ</Title>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label="หน่วยกิตขั้นต่ำรวม"
                  name="specific_subject_credit"
                  extra={<Text type="secondary">ตัวอย่าง: 104 หน่วยกิต</Text>}
                >
                  <InputNumber
                    min={0}
                    placeholder="104"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12} style={{ marginLeft: 20 }}>
              <Col span={24}>
                <Text strong>1) หมวดวิชาเฉพาะบังคับ:</Text>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="- วิชาแกน"
                  name="core_subject_credit"
                >
                  <InputNumber
                    min={0}
                    placeholder="30"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="- วิชาเฉพาะด้าน"
                  name="special_subject_credit"
                >
                  <InputNumber
                    min={0}
                    placeholder="55"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Text strong>2) หมวดวิชาเลือก:</Text>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="- วิชาเลือก"
                  name="select_subject_credit"
                >
                  <InputNumber
                    min={0}
                    placeholder="19"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* 3) หมวดวิชาเลือกเสรี */}
            <Title level={5}>3) หมวดวิชาเลือกเสรี</Title>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label="หน่วยกิตขั้นต่ำ"
                  name="free_subject_credit"
                  extra={<Text type="secondary">ตัวอย่าง: 6 หน่วยกิต</Text>}
                >
                  <InputNumber
                    min={0}
                    placeholder="6"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* 4) หมวดการฝึกงาน */}
            <Title level={5}>4) หมวดการฝึกงาน</Title>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label="ชั่วโมงฝึกงาน"
                  name="internship_hours"
                  extra={<Text type="secondary">ตัวอย่าง: 240 ชั่วโมง</Text>}
                >
                  <InputNumber
                    min={0}
                    placeholder="240"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="หน่วยกิตฝึกงาน"
                  name="credit_intern"
                >
                  <InputNumber
                    min={0}
                    placeholder="0"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Space style={{ marginTop: 24 }}>
              <Button onClick={() => router.push("/courses")}>ยกเลิก</Button>
              <Button  type="primary" htmlType="submit" loading={submitting}>
                บันทึก
              </Button>
            </Space>
          </Form>
        </Card>
      </Space>
    </div>
  );
}