"use client";
import { useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Typography,
  message,
} from "antd";
import { useRouter } from "next/navigation";

// กำหนด Interface สำหรับข้อมูลที่จะถูกส่งไป POST เพื่อเพิ่ม Type Safety
interface CourseData {
  nameCourseTh: string;
  nameCourseUse?: string;
  nameCourseEng?: string;
  nameFullDegreeTh?: string;
  nameFullDegreeEng?: string;
  nameInitialsDegreeTh?: string;
  nameInitialsDegreeEng?: string;
  
  planCourse: number; // แผนการเรียน (ปี)
  totalCredit: number; // หน่วยกิตรวม
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
  internshipHours: number;
  creditIntern: number;
}


export default function AddCoursePage() {
  const { Title } = Typography;
  const [form] = Form.useForm<CourseData>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // กำหนดค่าเริ่มต้นเพื่อให้แน่ใจว่า Field ที่ไม่ได้กรอกจะมีค่าเป็น 0 หรือค่าเริ่มต้นที่เหมาะสม
  const initialFormValues: CourseData = {
    nameCourseTh: '',
    planCourse: 4, // แผน 4 ปี
    totalCredit: 120, 
    generalSubjectCredit: 0,
    specificSubjectCredit: 0,
    freeSubjectCredit: 0,
    coreSubjectCredit: 0,
    spacailSubjectCredit: 0,
    selectSubjectCredit: 0,
    happySubjectCredit: 0,
    entrepreneurshipSubjectCredit: 0,
    languageSubjectCredit: 0,
    peopleSubjectCredit: 0,
    aestheticsSubjectCredit: 0,
    internshipHours: 0,
    creditIntern: 0,
  };


  const onFinish = async (values: CourseData) => {
    setSubmitting(true);
    try {
      // ตรวจสอบค่าที่ถูกส่งไป
      // console.log("Sending Data:", values); 
      
      const res = await fetch("/api/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      
      if (!res.ok) {
         // Log error จาก server
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
            initialValues={initialFormValues} // ใส่ค่าเริ่มต้นเพื่อป้องกัน undefined
          >
            
            {/* ===================== ข้อมูลหลักสูตร ===================== */}
            <Title level={5}>ข้อมูลหลักสูตร (Course)</Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="ชื่อหลักสูตร (ไทย)"
                  name="nameCourseTh"
                  rules={[{ required: true, message: "กรอกชื่อหลักสูตร (ไทย)" }]}
                >
                  <Input placeholder="วิศวกรรมคอมพิวเตอร์" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อหลักสูตร (ใช้จริง)" name="nameCourseUse">
                  <Input placeholder="วศ.คอม 66" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชื่อหลักสูตร (อังกฤษ)" name="nameCourseEng">
                  <Input placeholder="Computer Engineering" />
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

            {/* ===================== แผนการเรียนและหน่วยกิตรวม (CoursePlan) ===================== */}
            <Title level={5} style={{ marginTop: 24 }}>แผนการเรียนและหน่วยกิตรวม</Title>
            <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="แผนการเรียน (ปี)" name="planCourse" rules={[{ required: true, message: "กรอกแผนการเรียน" }]}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="หน่วยกิตรวมขั้นต่ำ" name="totalCredit" rules={[{ required: true, message: "กรอกหน่วยกิตรวม" }]}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
            </Row>

            {/* ===================== หน่วยกิตกลุ่มวิชา ===================== */}
            <Title level={5} style={{ marginTop: 24 }}>หน่วยกิตรายกลุ่มวิชา</Title>
            <Row gutter={12}>
                <Col span={6}>
                  <Form.Item label="วิชาทั่วไป" name="generalSubjectCredit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="วิชาเฉพาะด้าน" name="specificSubjectCredit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="วิชาเลือกเสรี" name="freeSubjectCredit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="วิชาแกน" name="coreSubjectCredit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="วิชาเฉพาะ (Special)" name="spacailSubjectCredit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="วิชาเลือก" name="selectSubjectCredit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="กลุ่มอยู่ดีมีสุข" name="happySubjectCredit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="กลุ่มผู้ประกอบการ" name="entrepreneurshipSubjectCredit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="กลุ่มภาษากับการสื่อสาร" name="languageSubjectCredit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="กลุ่มพลเมือง" name="peopleSubjectCredit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="กลุ่มสุนทรียศาสตร์" name="aestheticsSubjectCredit">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
            </Row>

            {/* ===================== ข้อมูลการฝึกงาน ===================== */}
            <Title level={5} style={{ marginTop: 24 }}>ข้อมูลการฝึกงาน</Title>
            <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="ชั่วโมงฝึกงาน" name="internshipHours">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="หน่วยกิตฝึกงาน" name="creditIntern">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
            </Row>


            {/* ===================== ปุ่ม ===================== */}
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