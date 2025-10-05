"use client";
import { useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  Image,
  PaginationProps,
  Row,
  Space,
  Table,
  TableProps,
  Typography,
  Tooltip,
  InputNumber,
  Divider,
  Card,
  Flex,
} from "antd";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";

export default function HomePage() {
  const { Title } = Typography;
  const [form] = Form.useForm();
  const router = useRouter();

  return (
    <>
      <div style={{ padding: 10 }}>
        <Space direction="vertical" style={{ width: "100%" }} size={10}>
          <Row>
            <Col span={12}>
              <Title
                style={{
                  marginTop: 0,
                  marginBottom: 0,
                  fontSize: 18,
                }}>
                {"ระบบที่สามารถเข้าถึงได้"}
              </Title>
            </Col>
          </Row>
          <Row style={{ marginBottom: "1%" }}>
            <Col span={16}>
              <Form layout="inline" form={form}>
                <Col>
                  <Button
                    className="chemds-button"
                    type="primary"
                    onClick={() => {
                    }}>
                    ค้นหา
                  </Button>
                </Col>
              </Form>
            </Col>
          </Row>
        </Space>
      </div>
    </>
  );
}