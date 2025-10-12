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
} from "antd";
import { useRouter } from "next/navigation";

interface CourseData {
  name_course_th: string;
  name_course_use?: string;
  name_course_eng?: string;
  name_full_degree_th?: string;
  name_full_degree_eng?: string;
  name_initials_degree_th?: string;
  name_initials_degree_eng?: string;
  department_id: number;
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
      const res = await fetch("/api/course", {
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

            <Title level={5} style={{ marginTop: 16 }}>
              ชื่อปริญญา
            </Title>
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

            <Title level={5} style={{ marginTop: 16 }}>
              สังกัด
            </Title>
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

            <Space style={{ marginTop: 24 }}>
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