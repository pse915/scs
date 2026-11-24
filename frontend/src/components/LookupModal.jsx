import React, { useState } from 'react';
import { X, Search, Trash2 } from 'lucide-react';

export default function LookupModal({
  isOpen,
  onClose,
  onLookup,
  onCancelRequest,
  isSubmitting,
  lastResponse,
  clearResponse,
}) {
  const [studentNumber, setStudentNumber] = useState('');
  const [name, setName] = useState('');
  const [lookupPin, setLookupPin] = useState('');

  if (!isOpen) return null;

  const items = lastResponse?.data?.items || null;

  const handleClose = () => {
    clearResponse?.();
    onClose();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onLookup({ student_number: studentNumber, name, lookup_pin: lookupPin });
  };

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700 }}>내 상담 신청 내역 조회</h3>
            <p style={{ fontSize: '13px', color: '#6E6E73' }}>학번(5자리, 예: 10101), 이름, 조회 비밀번호를 입력하세요.</p>
          </div>
          <button type="button" onClick={handleClose} style={closeBtn}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 18 }}>
          <input type="text" required placeholder="학번 (예: 10101)" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} style={inp} />
          <input type="text" required placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} style={inp} />
          <input type="password" placeholder="조회 비밀번호" value={lookupPin} onChange={(e) => setLookupPin(e.target.value)} style={inp} />
          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ borderRadius: 10, padding: '10px 16px' }}>
            <Search size={15} />
            <span>조회</span>
          </button>
        </form>

        {lastResponse?.status === 'error' && lastResponse.error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '13.5px', fontWeight: 600, marginBottom: 12 }}>
            {lastResponse.error}
          </div>
        )}

        {Array.isArray(items) && (
          <div style={{ display: 'grid', gap: 10 }}>
            {items.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px 0', color: '#86868B', fontSize: '14px' }}>
                일치하는 상담 신청 내역이 없습니다.
              </p>
            ) : (
              items.map((item) => (
                <div key={item.request_uuid} style={{ backgroundColor: '#F5F5F7', borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '14.5px' }}>{item.category}</span>
                      <span style={{ fontSize: '12px', padding: '2px 9px', borderRadius: 980, backgroundColor: '#0071E3', color: '#FFFFFF', fontWeight: 600 }}>
                        {item.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#424245' }}>
                      희망 일시: {item.preferred_date} · {item.preferred_time}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6E6E73', marginTop: 2 }}>{item.reason}</div>
                  </div>

                  {item.status === '접수' && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        if (window.confirm('이 상담 신청을 취소하시겠습니까?')) {
                          onCancelRequest({
                            request_uuid: item.request_uuid,
                            student_number: studentNumber,
                            name,
                            lookup_pin: lookupPin,
                          });
                        }
                      }}
                      style={{ padding: '8px 12px', borderRadius: 10, backgroundColor: '#FEF2F2', color: '#D93025', fontSize: '12.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                    >
                      <Trash2 size={14} />
                      <span>신청 취소</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
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
  maxWidth: '620px',
  backgroundColor: '#FFFFFF',
  borderRadius: '24px',
  padding: '28px',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.2)',
  maxHeight: '90vh',
  overflowY: 'auto',
};
const closeBtn = { width: 34, height: 34, borderRadius: '50%', backgroundColor: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const inp = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #D2D2D7', fontSize: '13.5px', outline: 'none' };
