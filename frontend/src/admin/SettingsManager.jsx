import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function SettingsManager({
  categories = [],
  settings = {},
  onSaveCategories,
  onSaveSettings,
  isSubmitting,
}) {
  const [catList, setCatList] = useState(categories);
  const [sysForm, setSysForm] = useState({
    notice_banner: settings.notice_banner || '',
    operating_hours: settings.operating_hours || '',
    precautions: settings.precautions || '',
    completion_guide: settings.completion_guide || '',
  });

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, border: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>상담 분야 관리</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setCatList([...catList, { name: '새 상담 분야', description: '', display_order: catList.length + 1, is_active: true }])}
              style={{ padding: '8px 14px', borderRadius: 10, backgroundColor: '#F5F5F7', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={14} />
              <span>분야 추가</span>
            </button>
            <button type="button" className="btn-primary" disabled={isSubmitting} onClick={() => onSaveCategories({ categories: catList })} style={{ borderRadius: 10, padding: '8px 16px', fontSize: '13px' }}>
              <Save size={14} />
              <span>분야 저장</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {catList.map((cat, idx) => (
            <div key={cat.category_uuid || idx} style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={cat.name}
                onChange={(e) => {
                  const next = [...catList];
                  next[idx] = { ...next[idx], name: e.target.value };
                  setCatList(next);
                }}
                style={inp}
              />
              <input
                type="text"
                placeholder="분야 설명"
                value={cat.description || ''}
                onChange={(e) => {
                  const next = [...catList];
                  next[idx] = { ...next[idx], description: e.target.value };
                  setCatList(next);
                }}
                style={inp}
              />
              <button
                type="button"
                onClick={() => setCatList(catList.filter((_, i) => i !== idx))}
                style={{ padding: '8px', borderRadius: 8, backgroundColor: '#FEF2F2', color: '#D93025' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, border: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>공지사항 및 운영 안내 문구</h3>
          <button type="button" className="btn-primary" disabled={isSubmitting} onClick={() => onSaveSettings({ settings: sysForm })} style={{ borderRadius: 10, padding: '8px 16px', fontSize: '13px' }}>
            <Save size={14} />
            <span>안내 문구 저장</span>
          </button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={lbl}>상단 공지사항 배너</label>
            <textarea rows={2} value={sysForm.notice_banner} onChange={(e) => setSysForm({ ...sysForm, notice_banner: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={lbl}>상담 가능 시간 및 운영 안내</label>
            <textarea rows={3} value={sysForm.operating_hours} onChange={(e) => setSysForm({ ...sysForm, operating_hours: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={lbl}>상담 신청 시 주의사항</label>
            <textarea rows={3} value={sysForm.precautions} onChange={(e) => setSysForm({ ...sysForm, precautions: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={lbl}>상담 신청 완료 후 절차 안내</label>
            <textarea rows={3} value={sysForm.completion_guide} onChange={(e) => setSysForm({ ...sysForm, completion_guide: e.target.value })} style={inp} />
          </div>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#424245', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #D2D2D7', fontSize: '13.5px' };
