"use client";
import { useEffect, useMemo, useState } from 'react';

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
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [options1, setOptions1] = useState<SubjectItem[]>([]);
  const [options2, setOptions2] = useState<SubjectItem[]>([]);
  const [selected1, setSelected1] = useState<number | null>(null);
  const [selected2, setSelected2] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!q1) { setOptions1([]); return; }
      const items = await searchSubjects(q1);
      if (active) setOptions1(items);
    })();
    return () => { active = false; };
  }, [q1]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!q2) { setOptions2([]); return; }
      const items = await searchSubjects(q2);
      if (active) setOptions2(items);
    })();
    return () => { active = false; };
  }, [q2]);

  const canSave = useMemo(() => selected1 && selected2 && selected1 !== selected2, [selected1, selected2]);

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      setMessage(null);
      await createPreSubject(selected1 as number, selected2 as number);
      setMessage('บันทึกสำเร็จ');
    } catch (e: any) {
      setMessage(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h2>เชื่อมรายวิชาที่เกี่ยวข้องกัน (preSubject)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div>
          <label>รายวิชาหลัก (subjectId)</label>
          <input value={q1} onChange={e => setQ1(e.target.value)} placeholder="ค้นหาด้วยรหัส/ชื่อวิชา" style={{ width: '100%', marginTop: 8 }} />
          <select value={selected1 ?? ''} onChange={e => setSelected1(e.target.value ? Number(e.target.value) : null)} style={{ width: '100%', marginTop: 8 }}>
            <option value="">-- เลือกรายวิชา --</option>
            {options1.map(item => (
              <option key={item.subjectId} value={item.subjectId}>
                {item.subjectCode} — {item.nameSubjectThai}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>รายวิชาที่ต้องเรียนมาก่อน (previousSubjectId)</label>
          <input value={q2} onChange={e => setQ2(e.target.value)} placeholder="ค้นหาด้วยรหัส/ชื่อวิชา" style={{ width: '100%', marginTop: 8 }} />
          <select value={selected2 ?? ''} onChange={e => setSelected2(e.target.value ? Number(e.target.value) : null)} style={{ width: '100%', marginTop: 8 }}>
            <option value="">-- เลือกรายวิชา --</option>
            {options2.map(item => (
              <option key={item.subjectId} value={item.subjectId}>
                {item.subjectCode} — {item.nameSubjectThai}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={handleSave} disabled={!canSave || saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกความสัมพันธ์'}</button>
      </div>

      {message && (
        <p style={{ marginTop: 12 }}>{message}</p>
      )}
    </div>
  );
}


