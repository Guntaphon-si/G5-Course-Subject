"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Form, Select, Button, Spin, Alert, Row, Col, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useSearchParams, useRouter } from "next/navigation";

const { Option } = Select;
const { Title, Text } = Typography;

interface CoursePlan {
  course_plan_id: number;
  plan_course: string;
}

interface Subject {
  subject_id: number;
  subject_code: string;
  name_subject_thai: string;
}

interface DropdownDataResponse {
  course_plans: CoursePlan[];
  subjects: Subject[];
  study_years: number[];
  terms: number[];
}

interface Message {
  text: string;
  type: "success" | "error" | "loading" | "info";
}

const AddSubjectCourse: React.FC = () => {
  const [is_app_ready] = useState<boolean>(true);

  // --- DATA STATE ---
  const [fetched_course_plans, set_fetched_course_plans] = useState<CoursePlan[]>([]);
  const [fetched_subjects, set_fetched_subjects] = useState<Subject[]>([]);
  const [fetched_study_years, set_fetched_study_years] = useState<number[]>([]);
  const [fetched_terms, set_fetched_terms] = useState<number[]>([]);
  const [message, set_message] = useState<Message | null>(null);
  const [is_loading, set_is_loading] = useState(false);

  const search_params = useSearchParams();
  const course_plan_id = search_params.get("initial_id");
  const router = useRouter();

  const [form] = Form.useForm();

  // --- HOOKS FOR QUERY PARAMETER ---
  const initial_course_plan_id_string = search_params.get("initial_id");

  // --- DATA FETCHING LOGIC ---
  useEffect(() => {
    const fetch_data = async () => {
      set_is_loading(true);
      try {
        const response = await fetch("/api/subjectCourse/newSubjectCourse");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: DropdownDataResponse = await response.json();

        set_fetched_course_plans(
          data.course_plans.filter((cp) => cp.course_plan_id == course_plan_id)
        );
        set_fetched_subjects(data.subjects);
        set_fetched_study_years(data.study_years);
        set_fetched_terms(data.terms);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        set_message({
          text: `ไม่สามารถดึงข้อมูลเริ่มต้นจาก Backend ได้: ${(error as Error).message}`,
          type: "error",
        });
      } finally {
        set_is_loading(false);
      }
    };

    fetch_data();
  }, []);

  // ชื่อแผนการเรียนที่ถูกล็อกไว้
  const selected_course_plan_name =
    fetched_course_plans.length === 1 && initial_course_plan_id_string
      ? fetched_course_plans[0].plan_course
      : null;

  // --- SUBMIT LOGIC ---
  const on_finish = useCallback(
    async (values: any) => {
      if (!is_app_ready) {
        set_message({ text: "ระบบยังไม่พร้อม.", type: "info" });
        return;
      }

      set_is_loading(true);
      set_message({ text: "กำลังส่งข้อมูลไปยัง SQL Backend...", type: "loading" });

      const new_subject_course_data = {
        subject_id: parseInt(values.subject_id),
        course_plan_id: parseInt(values.course_plan_id),
        study_year: parseInt(values.study_year),
        term: parseInt(values.term),
      };

      try {
        const res = await fetch("/api/subjectCourse/newSubjectCourse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(new_subject_course_data),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");

        router.push(`/courses/details/${course_plan_id}`);
      } catch (error) {
        console.error("Error simulating API call:", error);
        set_message({
          text: `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${(error as Error).message}. (SQL Failure)`,
          type: "error",
        });
      } finally {
        set_is_loading(false);
      }
    },
    [is_app_ready, form, initial_course_plan_id_string]
  );

  const on_finish_failed = (error_info: any) => {
    set_message({ text: "กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง", type: "error" });
    console.log("Failed:", error_info);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <Spin spinning={is_loading} tip="กำลังโหลดข้อมูล...">
        <div
          style={{
            backgroundColor: "#fff",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Title level={3} style={{ marginBottom: 24 }}>
            เพิ่มวิชาในแผนการเรียนใหม่
          </Title>

          {message && (
            <Alert
              message={message.text}
              type={message.type === "loading" ? "info" : message.type}
              showIcon
              style={{ marginBottom: 20 }}
              icon={message.type === "loading" ? <LoadingOutlined /> : undefined}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={on_finish}
            onFinishFailed={on_finish_failed}
            initialValues={{
              course_plan_id: initial_course_plan_id_string || undefined,
            }}
          >
            {/* Course Plan */}
            {initial_course_plan_id_string && selected_course_plan_name ? (
              <Form.Item label="แผนการเรียน (Course Plan)">
                <div
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "6px",
                    backgroundColor: "#f5f5f5",
                    color: "rgba(0, 0, 0, 0.88)",
                    fontWeight: "500",
                  }}
                >
                  {selected_course_plan_name}
                  <Text type="danger" style={{ display: "block", fontSize: "0.85em" }}>
                    (ล็อกจากหน้าหลักสูตร: ID {initial_course_plan_id_string})
                  </Text>
                </div>
                <Form.Item name="course_plan_id" noStyle>
                  <input type="hidden" />
                </Form.Item>
              </Form.Item>
            ) : (
              <Form.Item
                label="แผนการเรียน (Course Plan)"
                name="course_plan_id"
                rules={[{ required: true, message: "กรุณาเลือกแผนการเรียน!" }]}
              >
                <Select placeholder="--- เลือกแผนการเรียน ---" disabled={!is_app_ready}>
                  {fetched_course_plans.map((cp) => (
                    <Option key={cp.course_plan_id} value={cp.course_plan_id.toString()}>
                      {cp.plan_course}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {/* Subject */}
            <Form.Item
              label="รหัสและชื่อวิชา (Subject)"
              name="subject_id"
              rules={[{ required: true, message: "กรุณาเลือกวิชา!" }]}
            >
              <Select
                showSearch
                placeholder="--- ค้นหาและเลือกวิชา ---"
                optionFilterProp="children"
                disabled={!is_app_ready}
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
              >
                {fetched_subjects.map((s) => (
                  <Option key={s.subject_id} value={s.subject_id.toString()}>
                    {`${s.subject_code}: ${s.name_subject_thai}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Study Year and Term */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="ชั้นปีที่ (Study Year)"
                  name="study_year"
                  rules={[{ required: true, message: "กรุณาเลือกชั้นปี!" }]}
                >
                  <Select placeholder="--- เลือกชั้นปี ---" disabled={!is_app_ready}>
                    {fetched_study_years.map((year) => (
                      <Option key={year} value={year.toString()}>
                        ชั้นปีที่ {year}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="ภาคเรียนที่ (Term)"
                  name="term"
                  rules={[{ required: true, message: "กรุณาเลือกภาคเรียน!" }]}
                >
                  <Select placeholder="--- เลือกภาคเรียน ---" disabled={!is_app_ready}>
                    {fetched_terms.map((term) => (
                      <Option key={term} value={term.toString()}>
                        ภาคเรียนที่ {term}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={is_loading}
                disabled={!is_app_ready}
                block
              >
                {is_loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Spin>
    </div>
  );
};

export default AddSubjectCourse;
