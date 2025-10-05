"use client";
import {
  Avatar,
  Button,
  Col,
  Flex,
  Layout,
  Menu,
  Row,
  Typography,
  Dropdown,
  Space,
} from "antd";
import type { MenuProps } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DownOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import "./globals.css"
import * as Icons from "lucide-react";

export default function PersonnelAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { Title } = Typography;
  const router = useRouter();

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: "admin",
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "2",
      label: "ออกจากระบบ",
      icon: <Icons.LogOut />,
    },
  ];

  useEffect(() => {}, []);

  return (
    <html>
      <body>
           <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Sider
          width="300px"
          style={{
            padding: "10px",
            overflow: "auto",
            height: "100vh",
            position: "sticky",
            insetInlineStart: 0,
            top: 0,
            bottom: 0,
            scrollbarWidth: "thin",
            scrollbarGutter: "stable",
          }}>
          <div style={{ marginBottom: "10px", marginTop: 10 }}>
            <Row>
              <Col
                span={7}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Icons.MonitorCog width={70} height={70} color="#ffffff"
                style={{ marginRight: 10}} />
              </Col>
              <Col span={17}>
                <Title
                  style={{ marginBottom: 0, marginTop: 10, color: "#FDFEFE" }}
                  level={4}>
                  {"ระบบจัดการหลักสูตร&รายวิชา"}
                </Title>
                <Title style={{ marginTop: 0, color: "#FDFEFE" }} level={5}>
                  {"ภายในองค์กร"}
                </Title>
              </Col>
            </Row>
          </div>
          <Menu
            theme="dark"
            defaultSelectedKeys={["home"]}
            mode="inline"
            items={[
              {
                key: "home",
                icon: <Icons.House />,
                style: { fontSize: 16, color: "#FDFEFE" },
                label: "หน้าหลัก",
                onClick: () => {
                  router.push(`/private`);
                },
              },
              {
                key: "user",
                icon: <Icons.Users />,
                style: { fontSize: 16, color: "#FDFEFE" },
                label: "ผู้ใช้งาน",
                children: [
                  {
                    key: "all",
                    icon: <Icons.UserRoundCog />,
                    style: { fontSize: 16, color: "#FDFEFE" },
                    label: "ผู้ใช้งานทั้งหมด",
                    onClick: () => {
                      router.push(`/private/user`);
                    },
                  },
                  {
                    key: "pendingApprovalUser",
                    icon: <Icons.UserCog />,
                    style: { fontSize: 16, color: "#FDFEFE" },
                    label: "ผู้ใช้งานรออนุมัติ",
                    onClick: () => {
                      router.push(`/private/user/pendingApprovalUser`);
                    },
                  },
                ],
              },
              {
                key: "system",
                icon: <Icons.LaptopMinimalCheck />,
                style: { fontSize: 16, color: "#FDFEFE" },
                label: "ระบบในองค์กร",
                onClick: () => {
                  router.push(`/private/system`);
                },
              },
              {
                key: "setting",
                icon: <Icons.Settings />,
                style: { fontSize: 16, color: "#FDFEFE" },
                label: "ตั้งค่า",
                onClick: () => {
                  router.push(`/private/setting`);
                },
              },
            ]}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              textAlign: "right",
              color: "#fff",
              height: 70,
              paddingInline: 48,
              lineHeight: "64px",
              backgroundColor: "#22333b",
            }}>
            <div
              style={{
                padding: "5px",
              }}>
              <Flex
                style={{ marginBottom: "10px" }}
                justify={"flex-end"}
                align={"center"}>
                <Avatar size={40} icon={<Icons.UserRound />} />
                <div style={{ marginLeft: "10px" }}>
                  <Dropdown menu={{ items }}>
                    <a onClick={(e) => e.preventDefault()}>
                      <Space>
                        <div
                          style={{
                            color: "white",
                          }}>{`admin`}</div>
                        <DownOutlined
                          style={{
                            color: "white",
                          }}
                        />
                      </Space>
                    </a>
                  </Dropdown>
                </div>
              </Flex>
            </div>
          </Header>
          <Content
            style={{
              paddingTop: 20,
              paddingRight: 25,
              paddingLeft: 20,
              marginBottom: 100,
            }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
      </body>
  </html>
   
  );
}