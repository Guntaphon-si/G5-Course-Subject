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

// แก้ไข: เปลี่ยน Interface เป็น snake_case
interface CourseData {
  name_course_th: string;
  name_course_use?: string;
  name_course_eng?: string;
  name_full_degree_th?: string;
  name_full_degree_eng?: string;
  name_initials_degree_th?: string;
  name_initials_degree_eng?: string;
  
  plan_course: number;
  total_credit: number;
  general_subject_credit: number;
  specific_subject_credit: number;
  free_subject_credit: number;
  core_subject_credit: number;
  special_subject_credit: number;
  select_subject_credit: number;
  happy_subject_credit: number;
  entrepreneurship_subject_credit: number;
  language_subject_credit: number;
  people_subject_credit: number;
  aesthetics_subject_credit: number;
  internship_hours: number;
  credit_intern: number;
}
interface DepartmentFromApi {
  department_id: number;
  department_code: string;
  department_name:string;
  // เพิ่ม field อื่นๆ ที่ API คืนค่ามาหากจำเป็น
}

export default function AddCoursePage() {
  const { Title } = Typography;
  const [form] = Form.useForm<CourseData>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<DepartmentFromApi[]>([]);
  // แก้ไข: เปลี่ยนค่าเริ่มต้นเป็น snake_case
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
  const initialFormValues: CourseData = {
    name_course_th: '',
    plan_course: 4,
    total_credit: 120, 
    general_subject_credit: 0,
    specific_subject_credit: 0,
    free_subject_credit: 0,
    core_subject_credit: 0,
    special_subject_credit: 0,
    select_subject_credit: 0,
    happy_subject_credit: 0,
    entrepreneurship_subject_credit: 0,
    language_subject_credit: 0,
    people_subject_credit: 0,
    aesthetics_subject_credit: 0,
    internship_hours: 0,
    credit_intern: 0,
  };


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
          <Form 
            layout="vertical" 
            form={form} 
            onFinish={onFinish}
            initialValues={initialFormValues}
          >
            
            <Title level={5}>ข้อมูลหลักสูตร (Course)</Title>
            <Row gutter={12}>
              {/* แก้ไข: เปลี่ยน name เป็น snake_case */}
              <Col span={12}>
                <Form.Item
                  label="ชื่อหลักสูตร (ไทย)"
                  name="name_course_th"
                  rules={[{ required: true, message: "กรอกชื่อหลักสูตร (ไทย)" }]}
                >
                  <Input placeholder="วิศวกรรมคอมพิวเตอร์" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อหลักสูตร (ใช้จริง)" name="name_course_use">
                  <Input placeholder="วศ.คอม 66" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อหลักสูตร (อังกฤษ)" name="name_course_eng">
                  <Input placeholder="Computer Engineering" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อเต็มปริญญา (ไทย)" name="name_full_degree_th">
                  <Input placeholder="วิศวกรรมศาสตรบัณฑิต" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อเต็มปริญญา (อังกฤษ)" name="name_full_degree_eng">
                  <Input placeholder="Bachelor of Engineering" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อย่อปริญญา (ไทย)" name="name_initials_degree_th">
                  <Input placeholder="วศ.บ." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อย่อปริญญา (อังกฤษ)" name="name_initials_degree_eng">
                  <Input placeholder="B.Eng." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="คณะ"
                  name="department_id"
                  rules={[{ required: true, message: "กรุณาเลือกคณะ" }]}
                >
                  {/* เพิ่ม loading={loading} เพื่อแสดงสถานะการโหลด */}
                  <Select
                    placeholder="เลือกคณะ"
                    optionFilterProp="children"
                    loading={loading}
                  >
                    {department
                      .filter((department) => department.department_id != null)
                      .map((department) => (
                        <Select.Option
                          key={department.department_id}
                          value={department.department_id}
                        >
                          {`${department.department_name} (${department.department_code} )`}
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Title level={5} style={{ marginTop: 24 }}>แผนการเรียนและหน่วยกิตรวม</Title>
            <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="แผนการเรียน (ปี)" name="plan_course" rules={[{ required: true, message: "กรอกแผนการเรียน" }]}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="หน่วยกิตรวมขั้นต่ำ" name="total_credit" rules={[{ required: true, message: "กรอกหน่วยกิตรวม" }]}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
            </Row>

            <Title level={5} style={{ marginTop: 24 }}>หน่วยกิตรายกลุ่มวิชา</Title>
            <Row gutter={12}>
                <Col span={6}>
                  <Form.Item label="วิชาทั่วไป" name="general_subject_credit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="วิชาเฉพาะด้าน" name="specific_subject_credit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="วิชาเลือกเสรี" name="free_subject_credit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="วิชาแกน" name="core_subject_credit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="วิชาเฉพาะ (Special)" name="special_subject_credit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="วิชาเลือก" name="select_subject_credit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="กลุ่มอยู่ดีมีสุข" name="happy_subject_credit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="กลุ่มผู้ประกอบการ" name="entrepreneurship_subject_credit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="กลุ่มภาษากับการสื่อสาร" name="language_subject_credit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="กลุ่มพลเมือง" name="people_subject_credit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="กลุ่มสุนทรียศาสตร์" name="aesthetics_subject_credit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
            </Row>

            <Title level={5} style={{ marginTop: 24 }}>ข้อมูลการฝึกงาน</Title>
            <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="ชั่วโมงฝึกงาน" name="internship_hours">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="หน่วยกิตฝึกงาน" name="credit_intern">
                    <InputNumber min={0} style={{ width: '100%' }} />
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

