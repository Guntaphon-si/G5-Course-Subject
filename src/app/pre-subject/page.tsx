"use client";
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Col, Row, Typography, Space, Form, AutoComplete, Button, message as antdMessage, Tag, Table, Input, Modal, Popconfirm } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';

type SubjectItem = {
  subjectId: number;
  subjectCode: string;
  nameSubjectThai: string;
  nameSubjectEng: string;
  courseNameTh?: string;
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
  const [selected1Label, setSelected1Label] = useState<string>('');
  const [selected2Label, setSelected2Label] = useState<string>('');
  const [saving, setSaving] = useState(false);

  type PreRow = {
    preSubjectId: number;
    subjectId: number;
    subjectCode: string;
    subjectNameTh: string;
    subjectCourseNameTh?: string;
    previousSubjectId: number;
    previousSubjectCode: string;
    previousSubjectNameTh: string;
    previousSubjectCourseNameTh?: string;
  };
  const [listLoading, setListLoading] = useState(false);
  const [rows, setRows] = useState<PreRow[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PreRow | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editOptions, setEditOptions] = useState<SubjectItem[]>([]);
  const [editSelectedId, setEditSelectedId] = useState<number | null>(null);
  const [editSelectedLabel, setEditSelectedLabel] = useState<string>('');
  const [editMainQ, setEditMainQ] = useState('');
  const [editMainOptions, setEditMainOptions] = useState<SubjectItem[]>([]);
  const [editMainSelectedId, setEditMainSelectedId] = useState<number | null>(null);
  const [editMainSelectedLabel, setEditMainSelectedLabel] = useState<string>('');

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
    setSelected1Label('');
    setSelected2Label('');
  }, []);

  const toOptions = (items: SubjectItem[]) =>
    items.map((it) => ({
      value: String(it.subjectId),
      label: `${it.subjectCode} — ${it.nameSubjectThai}${it.courseNameTh ? ` -${it.courseNameTh}` : ''}`,
    }));

  const fetchRows = useCallback(async (q: string) => {
    try {
      setListLoading(true);
      const res = await fetch(`/api/pre-subject${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      const data = await res.json();
      setRows(data.items || []);
    } catch (e) {
      antdMessage.error('ดึงข้อมูลความสัมพันธ์ไม่สำเร็จ');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows('');
  }, [fetchRows]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!editQ) { setEditOptions([]); return; }
      const items = await searchSubjects(editQ);
      if (active) setEditOptions(items);
    };
    run();
    return () => { active = false; };
  }, [editQ]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!editMainQ) { setEditMainOptions([]); return; }
      const items = await searchSubjects(editMainQ);
      if (active) setEditMainOptions(items);
    };
    run();
    return () => { active = false; };
  }, [editMainQ]);

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
                    onSelect={(val, option) => {
                      setSelected1(Number(val));
                      const label = typeof option?.label === 'string' ? option.label : String(option?.label ?? '');
                      setSelected1Label(label);
                      setQ1(label);
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
                    onSelect={(val, option) => {
                      setSelected2(Number(val));
                      const label = typeof option?.label === 'string' ? option.label : String(option?.label ?? '');
                      setSelected2Label(label);
                      setQ2(label);
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
                <Tag color={selected1 ? 'blue' : 'default'}>
                  {selected1 ? `${selected1Label || `subjectId: ${selected1}`}` : 'ยังไม่ได้เลือกรายวิชาหลัก'}
                </Tag>
                <Tag color={selected2 ? 'blue' : 'default'}>
                  {selected2 ? `${selected2Label || `previousSubjectId: ${selected2}`}` : 'ยังไม่ได้เลือกวิชาที่ต้องเรียนก่อน'}
                </Tag>
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

        <Card className="chemds-container">
          <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
            <Col>
              <Title level={4} style={{ margin: 0, fontSize: 16 }}>ความสัมพันธ์วิชาที่ต้องเรียนมาก่อน</Title>
            </Col>
            <Col>
              <Space>
                <Input.Search allowClear placeholder="ค้นหา รหัส/ชื่อวิชา" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onSearch={() => fetchRows(searchQ)} />
                <Button onClick={() => { setSearchQ(''); fetchRows(''); }}>ล้าง</Button>
              </Space>
            </Col>
          </Row>

          <Table
            rowKey="preSubjectId"
            loading={listLoading}
            dataSource={rows}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: 'รหัสวิชา', dataIndex: 'subjectCode', key: 'subjectCode', width: 140 },
              { title: 'ชื่อวิชา', key: 'subjectNameTh', render: (_: any, r: PreRow) => `${r.subjectNameTh}${r.subjectCourseNameTh ? ` -${r.subjectCourseNameTh}` : ''}` },
              { title: 'รหัสวิชาที่ต้องเรียนก่อน', dataIndex: 'previousSubjectCode', key: 'previousSubjectCode', width: 180 },
              { title: 'ชื่อวิชาที่ต้องเรียนก่อน', key: 'previousSubjectNameTh', render: (_: any, r: PreRow) => `${r.previousSubjectNameTh}${r.previousSubjectCourseNameTh ? ` -${r.previousSubjectCourseNameTh}` : ''}` },
              {
                title: 'การทำงาน', key: 'actions', width: 220,
                render: (_: any, record: PreRow) => (
                  <Space>
                    <Button onClick={() => {
                      setEditingRow(record);
                      setEditQ('');
                      setEditSelectedId(record.previousSubjectId);
                      setEditSelectedLabel(`${record.previousSubjectCode} — ${record.previousSubjectNameTh}`);
                      setEditMainQ('');
                      setEditMainSelectedId(record.subjectId);
                      setEditMainSelectedLabel(`${record.subjectCode} — ${record.subjectNameTh}`);
                      setEditOpen(true);
                    }}>แก้ไข</Button>
                    <Popconfirm title="ยืนยันการลบความสัมพันธ์นี้?" okText="ลบ" cancelText="ยกเลิก" onConfirm={async () => {
                      try {
                        const res = await fetch(`/api/pre-subject?subjectId=${record.subjectId}&previousSubjectId=${record.previousSubjectId}`, { method: 'DELETE' });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || 'ลบไม่สำเร็จ');
                        antdMessage.success('ลบสำเร็จ');
                        fetchRows(searchQ);
                      } catch (e: any) {
                        antdMessage.error(e.message || 'เกิดข้อผิดพลาด');
                      }
                    }}>
                      <Button danger>ลบ</Button>
                    </Popconfirm>
                  </Space>
                )
              }
            ]}
          />
        </Card>

        <Modal
          title="แก้ไขวิชาที่ต้องเรียนก่อน"
          open={editOpen}
          onCancel={() => setEditOpen(false)}
          onOk={async () => {
            if (!editingRow || !editSelectedId || !editMainSelectedId) return;
            try {
              const res = await fetch('/api/pre-subject', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  originalSubjectId: editingRow.subjectId,
                  originalPreviousSubjectId: editingRow.previousSubjectId,
                  subjectId: editMainSelectedId,
                  previousSubjectId: editSelectedId,
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.message || 'อัปเดตไม่สำเร็จ');
              antdMessage.success('อัปเดตสำเร็จ');
              setEditOpen(false);
              fetchRows(searchQ);
            } catch (e: any) {
              antdMessage.error(e.message || 'เกิดข้อผิดพลาด');
            }
          }}
          okButtonProps={{ disabled: !editSelectedId || !editMainSelectedId }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>เลือกวิชาหลัก (subject)</div>
            <AutoComplete
              options={toOptions(editMainOptions)}
              value={editMainQ || editMainSelectedLabel}
              onChange={(v) => { setEditMainQ(v); }}
              onSelect={(val, option) => {
                setEditMainSelectedId(Number(val));
                const label = typeof option?.label === 'string' ? option.label : String(option?.label ?? '');
                setEditMainSelectedLabel(label);
                setEditMainQ(label);
              }}
              placeholder="ค้นหาด้วยรหัส/ชื่อวิชา"
              style={{ width: '100%' }}
              filterOption={false}
            />

            <div>เลือกวิชาที่ต้องเรียนก่อนใหม่</div>
            <AutoComplete
              options={toOptions(editOptions)}
              value={editQ || editSelectedLabel}
              onChange={(v) => { setEditQ(v); }}
              onSelect={(val, option) => {
                setEditSelectedId(Number(val));
                const label = typeof option?.label === 'string' ? option.label : String(option?.label ?? '');
                setEditSelectedLabel(label);
                setEditQ(label);
              }}
              placeholder="ค้นหาด้วยรหัส/ชื่อวิชา"
              style={{ width: '100%' }}
              filterOption={false}
            />
          </Space>
        </Modal>
      </Space>
    </div>
  );
}


