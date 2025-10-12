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
  Divider,
  Checkbox,
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
  selected_categories?: string[];
}

interface DepartmentFromApi {
  dept_id: number;
  dept_code: string;
  dept_name: string;
  dept_alias_th?: string;
}


export default function AddCoursePage() {
  const { Title } = Typography;
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      message.error(errorMessage);
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
                      (option?.children as unknown as string)
                        ?.toLowerCase()
                        .includes(input.toLowerCase()) ?? false
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
            </Row>

            <Divider />

            {/* โครงสร้างหลักสูตร */}
            <Title level={5}>3.1.2 โครงสร้างหลักสูตร</Title>
            <Form.Item name="selected_categories">
              <Checkbox.Group>
                <Space direction="vertical" style={{ width: '100%' }}>
                  
                  {/* 1. หมวดวิชาศึกษาทั่วไป */}
                  <div style={{ marginLeft: 0 }}>
                    <Checkbox value="general_education">
                      <strong>1. หมวดวิชาศึกษาทั่วไป</strong> (ไม่น้อยกว่า 30 หน่วยกิต)
                    </Checkbox>
                    <div style={{ marginLeft: 24, marginTop: 8 }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Checkbox value="happy_subject">
                          • กลุ่มสาระอยู่ดีมีสุข (ไม่น้อยกว่า 5 หน่วยกิต)
                        </Checkbox>
                        <Checkbox value="entrepreneurship_subject">
                          • กลุ่มสาระศาสตร์แห่งผู้ประกอบการ (ไม่น้อยกว่า 6 หน่วยกิต)
                        </Checkbox>
                        <Checkbox value="language_subject">
                          • กลุ่มสาระภาษากับการสื่อสาร (13 หน่วยกิต)
                        </Checkbox>
                        <Checkbox value="people_subject">
                          • กลุ่มสาระพลเมืองไทยและพลเมืองโลก (ไม่น้อยกว่า 3 หน่วยกิต)
                        </Checkbox>
                        <Checkbox value="aesthetics_subject">
                          • กลุ่มสาระสุนทรียศาสตร์ (ไม่น้อยกว่า 3 หน่วยกิต)
                        </Checkbox>
                      </Space>
                    </div>
                  </div>

                  {/* 2. หมวดวิชาเฉพาะ */}
                  <div style={{ marginLeft: 0 }}>
                    <Checkbox value="specific_subject">
                      <strong>2. หมวดวิชาเฉพาะ</strong> (ไม่น้อยกว่า 104 หน่วยกิต)
                    </Checkbox>
                    <div style={{ marginLeft: 24, marginTop: 8 }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Checkbox value="core_subject">
                          • วิชาแกน (30 หน่วยกิต)
                        </Checkbox>
                        <Checkbox value="specialized_subject">
                          • วิชาเฉพาะด้าน (55 หน่วยกิต)
                        </Checkbox>
                        <div style={{ marginLeft: 24, marginTop: 8 }}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Checkbox value="hardware_architecture">
                              - กลุ่มฮาร์ดแวร์และสถาปัตยกรรมคอมพิวเตอร์ (18 หน่วยกิต)
                            </Checkbox>
                            <Checkbox value="system_infrastructure">
                              - กลุ่มโครงสร้างพื้นฐานของระบบ (19 หน่วยกิต)
                            </Checkbox>
                            <Checkbox value="software_technology">
                              - กลุ่มเทคโนโลยีและวิธีการทางซอฟต์แวร์ (14 หน่วยกิต)
                            </Checkbox>
                            <Checkbox value="applied_technology">
                              - กลุ่มเทคโนโลยีเพื่องานประยุกต์ (3 หน่วยกิต)
                            </Checkbox>
                            <Checkbox value="independent_study">
                              - กลุ่มการค้นคว้าอิสระ (1 หน่วยกิต)
                            </Checkbox>
                          </Space>
                        </div>
                        <Checkbox value="elective_subject">
                          • วิชาเลือก (ไม่น้อยกว่า 19 หน่วยกิต)
                        </Checkbox>
                      </Space>
                    </div>
                  </div>

                  {/* 3. หมวดวิชาเลือกเสรี */}
                  <div style={{ marginLeft: 0 }}>
                    <Checkbox value="free_elective">
                      <strong>3. หมวดวิชาเลือกเสรี</strong> (ไม่น้อยกว่า 6 หน่วยกิต)
                    </Checkbox>
                  </div>

                  {/* 4. หมวดการฝึกงาน */}
                  <div style={{ marginLeft: 0 }}>
                    <Checkbox value="internship">
                      <strong>4. หมวดการฝึกงาน</strong> (ไม่น้อยกว่า 240 ชั่วโมง)
                    </Checkbox>
                  </div>

                </Space>
              </Checkbox.Group>
            </Form.Item>

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