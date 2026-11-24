import React, { useState } from 'react';
import { FilePlus2, Search } from 'lucide-react';

export default function RequestManager({
  requests = [],
  onUpdateStatus,
  onStartRecordFromRequest,
  isSubmitting,
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      return (
        String(r.name || '').toLowerCase().includes(q) ||
        String(r.student_number || '').includes(q) ||
        String(r.reason || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: '24px', border: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', '접수', '상담 확정', '상담 완료', '취소'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '7px 14px',
                borderRadius: 980,
                backgroundColor: statusFilter === st ? '#1D1D1F' : '#F5F5F7',
                color: statusFilter === st ? '#FFFFFF' : '#424245',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {st === 'ALL' ? '전체' : st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={15} color="#86868B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="학번, 이름, 사유 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 10, border: '1px solid #D2D2D7', fontSize: '13.5px' }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: '#86868B' }}>조건에 해당하는 상담 신청이 없습니다.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((req) => (
            <div key={req.request_uuid} style={{ padding: '16px 18px', borderRadius: 16, backgroundColor: '#F9F9FB', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <strong style={{ fontSize: '15.5px' }}>{req.student_number} {req.name}</strong>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0071E3', backgroundColor: 'rgba(0,113,227,0.1)', padding: '2px 10px', borderRadius: 980 }}>
                    {req.category}
                  </span>
                  <span style={{ fontSize: '12.5px', color: '#6E6E73' }}>
                    희망: {req.preferred_date} ({req.preferred_time})
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#1D1D1F', marginBottom: 4 }}>{req.reason}</p>
                {req.additional_note && (
                  <p style={{ fontSize: '12.5px', color: '#6E6E73' }}>추가 전달사항: {req.additional_note}</p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  disabled={isSubmitting}
                  value={req.status}
                  onChange={(e) => onUpdateStatus({ request_uuid: req.request_uuid, status: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #D2D2D7', fontSize: '13px', fontWeight: 600, backgroundColor: '#FFFFFF' }}
                >
                  <option value="접수">접수</option>
                  <option value="상담 확정">상담 확정</option>
                  <option value="상담 완료">상담 완료</option>
                  <option value="취소">취소</option>
                </select>

                <button
                  type="button"
                  onClick={() => onStartRecordFromRequest(req)}
                  style={{ padding: '8px 13px', borderRadius: 10, backgroundColor: '#0071E3', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <FilePlus2 size={14} />
                  <span>상담 일지 작성</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
