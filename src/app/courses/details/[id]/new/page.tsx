"use client";
import React, { useState, useEffect, useCallback } from 'react';
// จำลองการ Import Ant Design Components (ใน Canvas จะไม่มีการโหลด library จริง แต่ใช้ชื่อ component เพื่อจำลอง)
import { Form, Select, Button, Spin, Alert, Row, Col, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useSearchParams, useRouter } from 'next/navigation';

// --------------------------------------------------------------------------------
// --- INTERFACES & MOCK DATA (จำลอง API Response/Data Structure) ---
// --------------------------------------------------------------------------------

const { Option } = Select;
const { Title, Text } = Typography;

interface CoursePlan {
    coursePlanId: number;
    planCourse: string;
}

interface Subject {
    subjectId: number;
    subjectCode: string;
    nameSubjectThai: string;
}

interface DropdownDataResponse {
    coursePlans: CoursePlan[];
    subjects: Subject[];
    studyYears: number[];
    terms: number[];
}

interface Message {
    text: string;
    type: 'success' | 'error' | 'loading' | 'info';
}

// --------------------------------------------------------------------------------
// --- MAIN COMPONENT ---
// --------------------------------------------------------------------------------
const AddSubjectCourse: React.FC = () => {
    const [isAppReady] = useState<boolean>(true);

    // --- DATA STATE ---
    const [fetchedCoursePlans, setFetchedCoursePlans] = useState<CoursePlan[]>([]);
    const [fetchedSubjects, setFetchedSubjects] = useState<Subject[]>([]);
    const [fetchedStudyYears, setFetchedStudyYears] = useState<number[]>([]);
    const [fetchedTerms, setFetchedTerms] = useState<number[]>([]);  
    const [message, setMessage] = useState<Message | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const coursePlanId = searchParams.get('initialId');
    const router = useRouter();
    


    // --- FORM STATE ---
    // ใช้ antd Form instance
    const [form] = Form.useForm();


    // --- HOOKS FOR QUERY PARAMETER ---
    const initialCoursePlanIdString = searchParams.get('initialId'); 

    // --- DATA FETCHING LOGIC ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Call API Route (จำลองการเรียกไปยัง /api/dropdowns/route.ts)
                // ใน Next.js คุณสามารถเรียกใช้ API Route โดยตรงจาก Path ได้
                const response = await fetch('/api/subjectCourse/newSubjectCourse'); 
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // 2. รับข้อมูลที่ 'รวมกัน' มา
                const data: DropdownDataResponse = await response.json();
                
                // 3. Client 'แยก' ข้อมูลที่รวมกันแล้วเพื่อเก็บเข้า State
                setFetchedCoursePlans(data.coursePlans.filter(cp => cp.coursePlanId == coursePlanId));
                setFetchedSubjects(data.subjects);
                setFetchedStudyYears(data.studyYears); // แยกปีการศึกษา
                setFetchedTerms(data.terms);           // แยกภาคเรียน

            } catch (error) {
                console.error("Error fetching initial data:", error);
                setMessage({ text: `ไม่สามารถดึงข้อมูลเริ่มต้นจาก Backend ได้: ${(error as Error).message}`, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, []);

    // หาชื่อแผนการเรียนที่ถูกล็อกไว้สำหรับแสดงผลแบบ Static
    const selectedCoursePlanName = fetchedCoursePlans.length === 1 && initialCoursePlanIdString
        ? fetchedCoursePlans[0].planCourse
        : null;

    // --- SUBMIT LOGIC ---
    const onFinish = useCallback(async (values: any) => {
        
        if (!isAppReady) {
            setMessage({ text: 'ระบบยังไม่พร้อม.', type: 'info' });
            return;
        }

        setIsLoading(true);
        setMessage({ text: 'กำลังส่งข้อมูลไปยัง SQL Backend...', type: 'loading' });

        const newSubjectCourseData = {
            subjectId: parseInt(values.subjectId),
            coursePlanId: parseInt(values.coursePlanId), // ใช้ค่าที่ล็อกไว้ หรือค่าที่เลือก
            studyYear: parseInt(values.studyYear),
            term: parseInt(values.term),
        };

        try {
            const res = await fetch('/api/subjectCourse/newSubjectCourse', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSubjectCourseData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
            router.push("/courses");
            
        } catch (error) {
            console.error("Error simulating API call:", error);
            setMessage({ text: `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${(error as Error).message}. (SQL Failure)`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [isAppReady, form, initialCoursePlanIdString]);
    
    // สำหรับใช้กับ Antd Form Validation
    const onFinishFailed = (errorInfo: any) => {
        setMessage({ text: 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', type: 'error' });
        console.log('Failed:', errorInfo);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
            <Spin spinning={isLoading} tip="กำลังโหลดข้อมูล...">
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                    <Title level={3} style={{ marginBottom: 24 }}>
                        เพิ่มวิชาในแผนการเรียนใหม่
                    </Title>

                    {/* Message Area */}
                    {message && (
                        <Alert
                            message={message.text}
                            type={message.type === 'loading' ? 'info' : message.type}
                            showIcon
                            style={{ marginBottom: 20 }}
                            icon={message.type === 'loading' ? <LoadingOutlined /> : undefined}
                        />
                    )}

                    {/* Form */}
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        initialValues={{
                            // กำหนดค่าเริ่มต้นสำหรับ coursePlanId หากมี initialId
                            coursePlanId: initialCoursePlanIdString || undefined
                        }}
                    >
                        
                        {/* Course Plan ID - ถูกล็อกหรือเป็น Dropdown สำหรับเลือก */}
                        {initialCoursePlanIdString && selectedCoursePlanName ? (
                            <Form.Item label="แผนการเรียน (Course Plan)">
                                <div style={{ 
                                    padding: '8px 12px', 
                                    border: '1px solid #d9d9d9', 
                                    borderRadius: '6px', 
                                    backgroundColor: '#f5f5f5',
                                    color: 'rgba(0, 0, 0, 0.88)',
                                    fontWeight: '500'
                                }}>
                                    {selectedCoursePlanName}
                                    <Text type="danger" style={{ display: 'block', fontSize: '0.85em' }}>
                                        (ล็อกจากหน้าหลักสูตร: ID {initialCoursePlanIdString})
                                    </Text>
                                </div>
                                {/* ซ่อน Form.Item ที่เก็บค่าจริงเพื่อให้ค่าถูกส่งในการ submit */}
                                <Form.Item name="coursePlanId" noStyle>
                                    <input type="hidden" />
                                </Form.Item>
                            </Form.Item>
                        ) : (
                            // Fallback: แสดง Dropdown ปกติ ถ้าไม่ได้มีการล็อกค่า
                            <Form.Item 
                                label="แผนการเรียน (Course Plan)" 
                                name="coursePlanId"
                                rules={[{ required: true, message: 'กรุณาเลือกแผนการเรียน!' }]}
                            >
                                <Select
                                    placeholder="--- เลือกแผนการเรียน ---"
                                    disabled={!isAppReady}
                                >
                                    {fetchedCoursePlans.map(cp => (
                                        <Option key={cp.coursePlanId} value={cp.coursePlanId.toString()}>
                                            {cp.planCourse}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}
                        
                        {/* Subject ID */}
                        <Form.Item
                            label="รหัสและชื่อวิชา (Subject)"
                            name="subjectId"
                            rules={[{ required: true, message: 'กรุณาเลือกวิชา!' }]}
                        >
                            <Select
                                showSearch
                                placeholder="--- ค้นหาและเลือกวิชา ---"
                                optionFilterProp="children"
                                disabled={!isAppReady}
                                filterOption={(input, option) =>
                                    (option?.children as unknown as string).toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {fetchedSubjects.map(s => (
                                    <Option key={s.subjectId} value={s.subjectId.toString()}>
                                        {`${s.subjectCode}: ${s.nameSubjectThai}`}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* Study Year and Term */}
                        <Row gutter={16}>
                            {/* Study Year */}
                            <Col span={12}>
                                <Form.Item
                                    label="ชั้นปีที่ (Study Year)"
                                    name="studyYear"
                                    rules={[{ required: true, message: 'กรุณาเลือกชั้นปี!' }]}
                                >
                                    <Select
                                        placeholder="--- เลือกชั้นปี ---"
                                        disabled={!isAppReady}
                                    >
                                        {fetchedStudyYears.map(year => (
                                            <Option key={year} value={year.toString()}>
                                                ชั้นปีที่ {year}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            {/* Term */}
                            <Col span={12}>
                                <Form.Item
                                    label="ภาคเรียนที่ (Term)"
                                    name="term"
                                    rules={[{ required: true, message: 'กรุณาเลือกภาคเรียน!' }]}
                                >
                                    <Select
                                        placeholder="--- เลือกภาคเรียน ---"
                                        disabled={!isAppReady}
                                    >
                                        {fetchedTerms.map(term => (
                                            <Option key={term} value={term.toString()}>
                                                ภาคเรียนที่ {term}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Submit Button */}
                        <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={isLoading}
                                disabled={!isAppReady}
                                block
                            >
                                {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Spin>
        </div>
    );
};

export default AddSubjectCourse;
