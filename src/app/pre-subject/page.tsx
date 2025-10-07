"use client";
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Col, Row, Typography, Space, Form, AutoComplete, Button, message as antdMessage, Tag } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';

type SubjectItem = {
  subjectId: number;
  subjectCode: string;
  nameSubjectThai: string;
  nameSubjectEng: string;
};

async function searchSubjects(q: string): Promise<SubjectItem[]> {
  const res = await fetch(`/api/subjects/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  return data.items || [];
}

async function createPreSubject(subjectId: number, previousSubjectId: number) {
  const res = await fetch('/api/pre-subject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subjectId, previousSubjectId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด');
  return data;
}

export default function PreSubjectPage() {
  const { Title, Text } = Typography;
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [options1, setOptions1] = useState<SubjectItem[]>([]);
  const [options2, setOptions2] = useState<SubjectItem[]>([]);
  const [selected1, setSelected1] = useState<number | null>(null);
  const [selected2, setSelected2] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!q1) { setOptions1([]); return; }
      const items = await searchSubjects(q1);
      if (active) setOptions1(items);
    };
    run();
    return () => { active = false; };
  }, [q1]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!q2) { setOptions2([]); return; }
      const items = await searchSubjects(q2);
      if (active) setOptions2(items);
    };
    run();
    return () => { active = false; };
  }, [q2]);

  const canSave = useMemo(() => !!(selected1 && selected2 && selected1 !== selected2), [selected1, selected2]);

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      await createPreSubject(selected1 as number, selected2 as number);
      antdMessage.success('บันทึกสำเร็จ');
    } catch (e: any) {
      antdMessage.error(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }, [canSave, selected1, selected2]);

  const reset = useCallback(() => {
    setQ1('');
    setQ2('');
    setOptions1([]);
    setOptions2([]);
    setSelected1(null);
    setSelected2(null);
  }, []);

  const toOptions = (items: SubjectItem[]) =>
    items.map((it) => ({
      value: String(it.subjectId),
      label: `${it.subjectCode} — ${it.nameSubjectThai}`,
    }));

  return (
    <div style={{ padding: 10 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        <Row>
          <Col span={12}>
            <Title style={{ marginTop: 0, marginBottom: 0, fontSize: 18 }}>เชื่อมวิชาที่เกี่ยวข้อง</Title>
          </Col>
        </Row>

        <Card className="chemds-container">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form layout="vertical">
                <Form.Item label="รายวิชาหลัก (subjectId)">
                  <AutoComplete
                    options={toOptions(options1)}
                    value={q1}
                    onChange={(v) => setQ1(v)}
                    onSelect={(val) => {
                      setSelected1(Number(val));
                    }}
                    placeholder="ค้นหาด้วยรหัส/ชื่อวิชา"
                    style={{ width: '100%' }}
                    filterOption={false}
                  />
                </Form.Item>
              </Form>
            </Col>

            <Col xs={24} md={12}>
              <Form layout="vertical">
                <Form.Item label="รายวิชาที่ต้องเรียนมาก่อน (previousSubjectId)">
                  <AutoComplete
                    options={toOptions(options2)}
                    value={q2}
                    onChange={(v) => setQ2(v)}
                    onSelect={(val) => {
                      setSelected2(Number(val));
                    }}
                    placeholder="ค้นหาด้วยรหัส/ชื่อวิชา"
                    style={{ width: '100%' }}
                    filterOption={false}
                  />
                </Form.Item>
              </Form>
            </Col>
          </Row>

          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Tag color={selected1 ? 'blue' : 'default'}>{selected1 ? `เลือก subjectId: ${selected1}` : 'ยังไม่ได้เลือกรายวิชาหลัก'}</Tag>
                <Tag color={selected2 ? 'blue' : 'default'}>{selected2 ? `เลือก previousSubjectId: ${selected2}` : 'ยังไม่ได้เลือกวิชาที่ต้องเรียนก่อน'}</Tag>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={reset} disabled={saving}>ล้างค่า</Button>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!canSave}>บันทึกความสัมพันธ์</Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
}


