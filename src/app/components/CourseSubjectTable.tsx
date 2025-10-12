// src/app/components/course_subject_table.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Flex, Table, Button, Space, Modal, message, Input, Select } from "antd";
import type { TableColumnsType } from "antd";
import { createStyles } from "antd-style";
import { useRouter } from "next/navigation";

const use_style = createStyles(({ css, token }) => {
  const { antCls } = token;

  return {
    custom_table: css`
      ${antCls}-table {
        ${antCls}-table-container {
          ${antCls}-table-body,
          ${antCls}-table-content {
            scrollbar-width: thin;
            scrollbar-color: #eaeaea transparent;
            scrollbar-gutter: stable;
          }
        }
      }
    `,
  };
});

interface CourseSubjectTableProps {
  subject_course_id: string;
}

interface CourseDataType {
  key: React.Key;
  name_course_use: string;
  plan_course: string;
  subject_code: string;
  name_subject_thai: string;
  name_subject_eng: string;
  subject_category_name: string;
  subject_group_name: string;
  study_year: number;
  term: number;
}

const CourseSubjectTable: React.FC<CourseSubjectTableProps> = ({
  subject_course_id,
}) => {
  const { styles } = use_style();
  const [data_source, set_data_source] = useState<CourseDataType[]>([]);
  const [loading, set_loading] = useState(true);
  const [course_name_filter, set_course_name_filter] = useState<string>("all");
  const [all_data, set_all_data] = useState<CourseDataType[]>([]);
  const [search_term, set_search_term] = useState("");
  const router = useRouter();

  const handle_delete = (id: number) => {
    Modal.confirm({
      title: "คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?",
      okText: "ยืนยัน",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          const response = await fetch(`/api/subjectCourse`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
          });

          if (!response.ok) {
            throw new Error("ไม่สามารถลบข้อมูลได้");
          }

          set_all_data((prev) => prev.filter((item) => item.key !== id));
          message.success("ลบข้อมูลสำเร็จ");
        } catch (error) {
          console.error(error);
          message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        }
      },
    });
  };

  const filter_data = (
    data: CourseDataType[],
    term: string,
    name_filter: string
  ) => {
    const lower_case_term = term.toLowerCase().trim();
    let filtered_by_name = data;

    if (name_filter !== "all") {
      filtered_by_name = data.filter(
        (item) => item.name_course_use === name_filter
      );
    }

    if (!lower_case_term) {
      return filtered_by_name;
    }

    return filtered_by_name.filter((item) => {
      const search_fields = [
        item.name_course_use,
        item.plan_course,
        item.subject_code,
        item.name_subject_thai,
        item.name_subject_eng,
        item.subject_category_name,
        item.subject_group_name,
        item.study_year.toString(),
        item.term.toString(),
      ]
        .join("|")
        .toLowerCase();

      return search_fields.includes(lower_case_term);
    });
  };

  const fixed_columns: TableColumnsType<CourseDataType> = [
    { title: "รหัสรายวิชา", dataIndex: "subject_code", width: 50 },
    { title: "ชื่อวิชา (ไทย)", dataIndex: "name_subject_thai", width: 100 },
    { title: "ชื่อวิชา (อังกฤษ)", dataIndex: "name_subject_eng", width: 100 },
    { title: "หมวดหมู่วิชา", dataIndex: "subject_category_name", width: 50 },
    { title: "ปีที่เรียน", dataIndex: "study_year", width: 35 },
    { title: "เทอมที่เรียน", dataIndex: "term", width: 35 },
    {
      title: "การจัดการ",
      key: "action",
      width: 100,
      render: (text, record) => (
        <Space size="middle">
          <Button
            type="primary"
            danger
            onClick={() => handle_delete(Number(record.key))}
          >
            🗑️ ลบ
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    const fetch_data = async () => {
      try {
        set_loading(true);
        const response = await fetch(`/api/subjectCourse?id=${subject_course_id}`);
        const data = await response.json();

        if (Array.isArray(data)) {
          set_all_data(data);
          set_data_source(data);
        } else {
          console.warn("Unexpected /api/subjectCourse payload:", data);
          set_all_data([]);
          set_data_source([]);
        }
      } catch (error) {
        console.error("Failed to fetch subject_course:", error);
        set_data_source([]);
      } finally {
        set_loading(false);
      }
    };

    fetch_data();
  }, [subject_course_id]);

  useEffect(() => {
    const final_filtered_data = filter_data(all_data, search_term, course_name_filter);
    set_data_source(final_filtered_data);
  }, [course_name_filter, all_data, search_term]);

  const get_course_name_options = () => {
    const names = Array.from(new Set(all_data.map((item) => item.name_course_use))).sort();

    const options = names.map((name) => ({
      value: name,
      label: name.length > 30 ? `${name.substring(0, 30)}...` : name,
    }));

    options.unshift({ value: "all", label: "ทั้งหมด" });
    return options;
  };

  return (
    <Flex vertical gap="small">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Subject Course: { data_source[0]?.name_course_use} </h1>
        <h2>แผนการเรียน: { data_source[0]?.plan_course} </h2>
        <Space>
          {/* <label>กรองตามชื่อหลักสูตร:</label>
          <Select
            value={course_name_filter}
            style={{ width: 120 }}
            onChange={set_course_name_filter}
            options={get_course_name_options()}
            loading={loading && all_data.length === 0}
          /> */}
          <Input.Search
            placeholder="ค้นหาทุก Field..."
            value={search_term}
            onChange={(e) => set_search_term(e.target.value)}
            style={{ width: 300 }}
            loading={loading}
          />
        </Space>
        <Button
          type="primary"
          onClick={() =>
            router.push(
              `/courses/details/${subject_course_id}/new?initial_id=${subject_course_id}`
            )
          }
        >
          + สร้าง Subject Course เพิ่ม
        </Button>
      </div>
      <Table<CourseDataType>
        className={styles.custom_table}
        columns={fixed_columns}
        dataSource={data_source}
        pagination={{ 
              pageSize: 10,
              showSizeChanger: false,
              hideOnSinglePage: false 
            }}
        bordered
        loading={loading}
      />
    </Flex>
  );
};

export default CourseSubjectTable;
