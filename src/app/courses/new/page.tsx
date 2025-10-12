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

interface SubjectCategory {
  subject_category_id: number;
  category_name: string;
  category_level: number;
  master_category: number | null;
  course_id: number;
}


export default function AddCoursePage() {
  const { Title } = Typography;
  const [form] = Form.useForm<CourseData>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<DepartmentFromApi[]>([]);
  const [subjectCategories, setSubjectCategories] = useState<SubjectCategory[]>([]);

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

  useEffect(() => {
    fetch("/api/subject-category/all")
      .then((res) => {
        if (!res.ok)
          throw new Error("ไม่สามารถดึงข้อมูลหมวดวิชาได้จากเซิร์ฟเวอร์");
        return res.json();
      })
      .then((data) => {
        if (data.items && Array.isArray(data.items)) {
          setSubjectCategories(data.items);
        } else {
          message.error("รูปแบบข้อมูลหมวดวิชาที่ได้รับไม่ถูกต้อง");
        }
      })
      .catch((err) => {
        console.error(err);
        message.error(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดวิชา");
      });
  }, []);

  const renderSubjectCategories = () => {
    // กรองข้อมูลตาม level และลบข้อมูลซ้ำโดยใช้ subject_category_id
    const uniqueCategories = subjectCategories.reduce((acc, cat) => {
      if (!acc.find(item => item.subject_category_id === cat.subject_category_id)) {
        acc.push(cat);
      }
      return acc;
    }, [] as SubjectCategory[]);

    const level1Categories = uniqueCategories.filter(cat => cat.category_level === 1);
    const level2Categories = uniqueCategories.filter(cat => cat.category_level === 2);
    const level3Categories = uniqueCategories.filter(cat => cat.category_level === 3);

    return level1Categories.map(level1 => {
      const level2Children = level2Categories.filter(cat => cat.master_category === level1.subject_category_id);
      
      return (
        <div key={level1.subject_category_id} style={{ marginBottom: 16 }}>
          <Checkbox value={level1.subject_category_id}>
            <strong>{level1.category_name}</strong>
          </Checkbox>
          
          {level2Children.length > 0 && (
            <div style={{ marginLeft: 24, marginTop: 8 }}>
              {level2Children.map(level2 => {
                const level3Children = level3Categories.filter(cat => cat.master_category === level2.subject_category_id);
                
                return (
                  <div key={level2.subject_category_id} style={{ marginBottom: 8 }}>
                    <Checkbox value={level2.subject_category_id}>
                      • {level2.category_name}
                    </Checkbox>
                    
                    {level3Children.length > 0 && (
                      <div style={{ marginLeft: 24, marginTop: 4 }}>
                        {level3Children.map(level3 => (
                          <div key={level3.subject_category_id} style={{ marginBottom: 4 }}>
                            <Checkbox value={level3.subject_category_id}>
                              - {level3.category_name}
                            </Checkbox>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

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
                  {renderSubjectCategories()}
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