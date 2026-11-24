import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Send } from 'lucide-react';

export default function ApplyModal({
  isOpen,
  onClose,
  categories = [],
  onSubmitApply,
  isSubmitting,
  lastResponse,
  clearResponse,
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    grade: '1',
    class_num: '1',
    number: '1',
    name: '',
    category: categories[0]?.name || '진로·진학',
    preferred_date: todayStr,
    preferred_time: '점심시간 (12:40~13:20)',
    reason: '',
    additional_note: '',
    lookup_pin: '',
  });
  const [submittedResult, setSubmittedResult] = useState(null);

  useEffect(() => {
    if (categories.length > 0 && !form.category) {
      setForm((prev) => ({ ...prev, category: categories[0].name }));
    }
  }, [categories, form.category]);

  useEffect(() => {
    if (lastResponse?.status === 'success' && lastResponse.data?.request_uuid) {
      setSubmittedResult(lastResponse.data);
    }
  }, [lastResponse]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSubmittedResult(null);
    clearResponse?.();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitApply(form);
  };

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700 }}>온라인 상담 신청</h3>
            <p style={{ fontSize: '13px', color: '#6E6E73' }}>작성하신 내용은 상담 선생님에게만 안전하게 전달됩니다.</p>
          </div>
          <button type="button" onClick={handleClose} style={closeBtn}>
            <X size={18} />
          </button>
        </div>

        {submittedResult ? (
          <div style={{ textAlign: 'center', padding: '24px 12px' }}>
            <CheckCircle2 size={48} color="#34C759" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '19px', fontWeight: 700, marginBottom: 8 }}>상담 신청이 접수되었습니다</h4>
            <p style={{ fontSize: '14px', color: '#424245', marginBottom: 20 }}>
              학번 <strong>{submittedResult.student_number}</strong>으로 접수되었습니다.<br />
              '내 신청 내역 조회' 메뉴에서 진행 상태를 언제든 확인하실 수 있습니다.
            </p>
            <button type="button" className="btn-primary" onClick={handleClose}>
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            {lastResponse?.status === 'error' && lastResponse.error && (
              <div style={errBox}>{lastResponse.error}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.4fr', gap: '8px' }}>
              <div>
                <label style={lbl}>학년 *</label>
                <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} style={inp}>
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                </select>
              </div>
              <div>
                <label style={lbl}>반 *</label>
                <input type="number" min="1" max="20" required value={form.class_num} onChange={(e) => setForm({ ...form, class_num: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>번호 *</label>
                <input type="number" min="1" max="50" required value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>이름 *</label>
                <input type="text" required placeholder="홍길동" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={lbl}>상담 희망 분야 *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inp}>
                  {categories.map((c) => (
                    <option key={c.category_uuid || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>신청 조회용 비밀번호 (4~6자리)</label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="예: 1234"
                  value={form.lookup_pin}
                  onChange={(e) => setForm({ ...form, lookup_pin: e.target.value })}
                  style={inp}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={lbl}>상담 희망 날짜 *</label>
                <input type="date" required value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>상담 희망 시간대 *</label>
                <select value={form.preferred_time} onChange={(e) => setForm({ ...form, preferred_time: e.target.value })} style={inp}>
                  <option value="아침 시간 (08:30~09:00)">아침 시간 (08:30~09:00)</option>
                  <option value="쉬는 시간">쉬는 시간</option>
                  <option value="점심시간 (12:40~13:20)">점심시간 (12:40~13:20)</option>
                  <option value="방과 후 (16:30~17:30)">방과 후 (16:30~17:30)</option>
                  <option value="선생님과 시간 조율 희망">선생님과 시간 조율 희망</option>
                </select>
              </div>
            </div>

            <div>
              <label style={lbl}>상담 신청 사유 (5자 이상) *</label>
              <textarea
                rows={3}
                required
                placeholder="어떤 주제로 이야기 나누고 싶은지 편하게 적어주세요."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                style={inp}
              />
            </div>

            <div>
              <label style={lbl}>추가 전달사항 (선택)</label>
              <input
                type="text"
                placeholder="예: 친구와 함께 방문 희망 / 조용한 시간 희망 등"
                value={form.additional_note}
                onChange={(e) => setForm({ ...form, additional_note: e.target.value })}
                style={inp}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button type="button" onClick={handleClose} style={{ padding: '11px 18px', borderRadius: 12, backgroundColor: '#F5F5F7', fontWeight: 600 }}>
                취소
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                <Send size={15} />
                <span>{isSubmitting ? '접수 중...' : '상담 신청 제출'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 120,
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};
const modalStyle = {
  width: '100%',
  maxWidth: '540px',
  backgroundColor: '#FFFFFF',
  borderRadius: '24px',
  padding: '28px',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.2)',
  maxHeight: '92vh',
  overflowY: 'auto',
};
const closeBtn = { width: 34, height: 34, borderRadius: '50%', backgroundColor: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const lbl = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#424245', marginBottom: 4 };
const inp = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #D2D2D7', fontSize: '14px', outline: 'none' };
const errBox = { padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '13.5px', fontWeight: 600 };
