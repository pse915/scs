import React from 'react';
import { Inbox, Clock, CheckCircle2, FileText, Users } from 'lucide-react';

export default function Dashboard({ adminData, onNavigateTab }) {
  const summary = adminData?.summary || {};
  const breakdown = adminData?.category_breakdown || [];
  const recentRequests = (adminData?.requests || []).slice(0, 5);

  const cards = [
    { label: '신규 접수 대기', value: summary.pending_requests ?? 0, color: '#0071E3', icon: Inbox },
    { label: '상담 확정 일정', value: summary.confirmed_requests ?? 0, color: '#FF9500', icon: Clock },
    { label: '상담 완료 건수', value: summary.completed_requests ?? 0, color: '#34C759', icon: CheckCircle2 },
    { label: '누적 상담 일지', value: summary.total_records ?? 0, color: '#5856D6', icon: FileText },
    { label: '등록 학생 수', value: summary.total_students ?? 0, color: '#1D1D1F', icon: Users },
  ];

  const maxCatCount = Math.max(1, ...breakdown.map((b) => b.count));

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 14 }}>
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#6E6E73' }}>{c.label}</span>
                <Icon size={17} color={c.color} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: '24px', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 16 }}>상담 분야별 신청 현황</h3>
          {breakdown.length === 0 ? (
            <p style={{ color: '#86868B', fontSize: '14px' }}>아직 접수된 상담 신청 데이터가 없습니다.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {breakdown.map((b) => (
                <div key={b.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: 600, marginBottom: 4 }}>
                    <span>{b.category}</span>
                    <span>{b.count}건</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: '#F5F5F7', borderRadius: 980, overflow: 'hidden' }}>
                    <div style={{ width: `${(b.count / maxCatCount) * 100}%`, height: '100%', backgroundColor: '#0071E3', borderRadius: 980 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: '24px', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>최근 접수된 상담 신청</h3>
            <button type="button" onClick={() => onNavigateTab('requests')} style={{ backgroundColor: 'transparent', color: '#0071E3', fontSize: '13px', fontWeight: 600 }}>
              전체 보기 →
            </button>
          </div>
          {recentRequests.length === 0 ? (
            <p style={{ color: '#86868B', fontSize: '14px' }}>최근 접수 내역이 없습니다.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {recentRequests.map((r) => (
                <div key={r.request_uuid} style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: '#F5F5F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>
                      {r.student_number} {r.name} · <span style={{ color: '#0071E3' }}>{r.category}</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#6E6E73' }}>{r.preferred_date} ({r.preferred_time})</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: 980, backgroundColor: '#FFFFFF' }}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
