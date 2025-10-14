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
  Modal,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

// --- Interfaces ---
interface CourseData {
  name_course_th: string;
  name_course_use?: string;
  name_course_eng?: string;
  name_full_degree_th?: string;
  name_full_degree_eng?: string;
  name_initials_degree_th?: string;
  name_initials_degree_eng?: string;
  department_id: number;
  category_structure: Category[];
}

interface DepartmentFromApi {
  dept_id: number;
  dept_code: string;
  dept_name: string;
  dept_alias_th?: string;
}

// Interface สำหรับโครงสร้างหมวดหมู่
export interface Category {
  key: string;
  name: string;
  children: Category[];
  level: number;
}

// --- โครงสร้างหมวดหมู่เริ่มต้น (เป็นตัวอย่าง) ---
const initialCategories: Category[] = [
  {
    key: crypto.randomUUID(),
    name: 'หมวดวิชาศึกษาทั่วไป',
    level: 1,
    children: []
  },
  {
    key: crypto.randomUUID(),
    name: 'หมวดวิชาเฉพาะ',
    level: 1,
    children: []
  },
  {
    key: crypto.randomUUID(),
    name: 'หมวดวิชาเลือกเสรี',
    level: 1,
    children: []
  },
];

export default function AddCoursePage() {
  const { Title, Text } = Typography;
  const [form] = Form.useForm<CourseData>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<DepartmentFromApi[]>([]);

  // State สำหรับจัดการโครงสร้างหลักสูตร
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{ parentKey: string | null; editingCategory?: Category }>({ parentKey: null });
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/department")
      .then((res) => {
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลคณะได้");
        return res.json();
      })
      .then((data) => setDepartment(data))
      .catch((err) => message.error(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลคณะ"))
      .finally(() => setLoading(false));
  }, []);

  // --- ฟังก์ชันสำหรับจัดการหมวดหมู่ ---

  const updateCategoriesRecursive = (items: Category[], key: string, action: (item: Category) => void): Category[] => {
      return items.map(item => {
          if (item.key === key) {
              action(item);
              return { ...item };
          }
          if (item.children.length > 0) {
              return { ...item, children: updateCategoriesRecursive(item.children, key, action) };
          }
          return item;
      });
  };

  const showModal = (parentKey: string | null, editingCategory?: Category) => {
    setModalData({ parentKey, editingCategory });
    setCategoryName(editingCategory?.name || "");
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    if (!categoryName.trim()) {
        message.error("กรุณากรอกชื่อหมวดหมู่");
        return;
    }

    const { parentKey, editingCategory } = modalData;

    if (editingCategory) { // กรณีแก้ไข
        const newCategories = updateCategoriesRecursive(categories, editingCategory.key, (item) => {
            item.name = categoryName;
        });
        setCategories(newCategories);
    } else { // กรณีเพิ่มใหม่
      const newCategory: Category = {
        key: crypto.randomUUID(),
        name: categoryName,
        children: [],
        level: 1, // default level
      };

      if (parentKey === null) { // เพิ่มที่ Level 1
        setCategories([...categories, newCategory]);
      } else { // เพิ่มเป็น children
        const addAsChild = (items: Category[]): Category[] => {
          return items.map(item => {
            if (item.key === parentKey) {
              newCategory.level = item.level + 1;
              return { ...item, children: [...item.children, newCategory] };
            }
            return { ...item, children: addAsChild(item.children) };
          });
        };
        setCategories(addAsChild(categories));
      }
    }

    setIsModalVisible(false);
    setCategoryName("");
  };

  const handleDelete = (keyToDelete: string) => {
      const deleteRecursive = (items: Category[]): Category[] => {
          return items.filter(item => item.key !== keyToDelete).map(item => {
              return { ...item, children: deleteRecursive(item.children) };
          });
      };
      setCategories(deleteRecursive(categories));
  };

  const renderCategories = (items: Category[], level = 0) => {
    return items.map((category) => (
      <div key={category.key} style={{ marginLeft: level * 24, marginBottom: 8 }}>
        <Space>
          <Text>{category.name}</Text>
          <Button icon={<EditOutlined />} size="small" onClick={() => showModal(null, category)} title="แก้ไขชื่อ" />
          <Button icon={<PlusOutlined />} size="small" onClick={() => showModal(category.key)} title="เพิ่มหมวดหมู่ย่อย"/>
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(category.key)} title="ลบหมวดหมู่" />
        </Space>
        {category.children.length > 0 && renderCategories(category.children, level + 1)}
      </div>
    ));
  };

  const onFinish = async (values: Omit<CourseData, 'category_structure'>) => {
    const finalValues: CourseData = {
      ...values,
      category_structure: categories,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/course/addCourse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalValues),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาดในการบันทึก");
      message.success("บันทึกหลักสูตรสำเร็จ!");
      router.push("/courses");
    } catch (e: any) {
      message.error(e.message);
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
                <Form.Item label="ชื่อหลักสูตร (ไทย)" name="name_course_th" rules={[{ required: true, message: "กรุณากรอกชื่อหลักสูตร (ไทย)" }]}>
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

            <Title level={5}>ชื่อปริญญา</Title>
            <Row gutter={12}>
                <Col span={12}>
                <Form.Item label="ชื่อเต็มปริญญา (ไทย)" name="name_full_degree_th">
                    <Input placeholder="วิศวกรรมศาสตรบัณฑิต (วิศวกรรมคอมพิวเตอร์)" />
                </Form.Item>
                </Col>
                <Col span={12}>
                <Form.Item label="ชื่อเต็มปริญญา (อังกฤษ)" name="name_full_degree_eng">
                    <Input placeholder="Bachelor of Engineering (Computer Engineering)" />
                </Form.Item>
                </Col>
                <Col span={12}>
                <Form.Item label="ชื่อย่อปริญญา (ไทย)" name="name_initials_degree_th">
                    <Input placeholder="วศ.บ. (วิศวกรรมคอมพิวเตอร์)" />
                </Form.Item>
                </Col>
                <Col span={12}>
                <Form.Item label="ชื่อย่อปริญญา (อังกฤษ)" name="name_initials_degree_eng">
                    <Input placeholder="B.Eng. (Computer Engineering)" />
                </Form.Item>
                </Col>
            </Row>

            <Divider />

            <Title level={5}>สังกัด</Title>
            <Row gutter={12}>
                <Col span={12}>
                <Form.Item label="คณะ" name="department_id" rules={[{ required: true, message: "กรุณาเลือกคณะ" }]}>
                    <Select placeholder="เลือกคณะ" loading={loading} showSearch filterOption={(input, option) => (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())}>
                    {department.map((dept) => (<Select.Option key={dept.dept_id} value={dept.dept_id}>{`${dept.dept_name} (${dept.dept_code})`}</Select.Option>))}
                    </Select>
                </Form.Item>
                </Col>
            </Row>

            <Divider />

            <Title level={5}>โครงสร้างหลักสูตร</Title>
            {/* ✅ FIX 1: แก้ไข `bodyStyle` เป็น `styles` */}
            <Card styles={{ body: { backgroundColor: '#fafafa' } }}>
                {renderCategories(categories)}
                <Button type="dashed" onClick={() => showModal(null)} style={{ marginTop: 16 }} icon={<PlusOutlined />}>
                    เพิ่มหมวดหมู่หลัก
                </Button>
            </Card>

            <Divider />

            <Space style={{ marginTop: 24 }}>
              <Button onClick={() => router.push("/courses")}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                บันทึก
              </Button>
            </Space>
          </Form>
        </Card>
      </Space>

      {/* ✅ FIX 2: แก้ไข `visible` เป็น `open` */}
      <Modal
        title={modalData.editingCategory ? "แก้ไขชื่อหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Input
          placeholder="กรอกชื่อหมวดหมู่"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          onPressEnter={handleModalOk}
        />
      </Modal>
    </div>
  );
}