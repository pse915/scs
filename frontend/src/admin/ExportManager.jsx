import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileCode2,
  ShieldAlert,
  Inbox,
  Users,
  CalendarRange,
  PieChart,
  FolderArchive,
  LayoutTemplate,
} from 'lucide-react';

const EXPORT_TARGETS = [
  {
    id: 'all_requests',
    title: '전체 상담 신청 내역',
    description: '학생들이 접수한 모든 상담 신청 목록, 희망 일시, 상태, 사유를 내보냅니다.',
    icon: Inbox,
  },
  {
    id: 'all_records',
    title: '전체 상담 기록',
    description: '작성된 모든 학생의 상담 일지, 주요 호소 내용, 지도 계획, 내부 메모를 내보냅니다.',
    icon: FolderArchive,
  },
  {
    id: 'student_records',
    title: '특정 학생의 상담 기록',
    description: '선택한 학생 한 명의 전체 상담 이력을 시간순으로 정리하여 내보냅니다.',
    icon: Users,
  },
  {
    id: 'period_records',
    title: '특정 기간의 상담 기록',
    description: '지정한 시작일과 종료일 사이에 진행된 상담 기록만 추출하여 내보냅니다.',
    icon: CalendarRange,
  },
  {
    id: 'category_stats',
    title: '상담 분야별 통계',
    description: '상담 분야별 신청 건수, 비율, 완료 건수, 실제 상담 기록 수를 집계해 내보냅니다.',
    icon: PieChart,
  },
];

const FORMAT_OPTIONS = [
  { id: 'xlsx', label: 'Excel (.xlsx)', sub: '표 서식 및 열 너비 자동 정렬', icon: FileSpreadsheet },
  { id: 'csv', label: 'CSV (.csv)', sub: 'UTF-8 엑셀 호환 표준 텍스트', icon: FileText },
  { id: 'json', label: 'JSON (.json)', sub: '구조화된 백업 및 시스템 연동용', icon: FileCode2 },
];

export default function ExportManager({
  students = [],
  onRequestExport,
  isSubmitting,
  lastResponse,
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const monthStartStr = `${todayStr.slice(0, 7)}-01`;

  const [exportType, setExportType] = useState('all_requests');
  const [fileFormat, setFileFormat] = useState('xlsx');
  const [selectedStudentUuid, setSelectedStudentUuid] = useState(students[0]?.student_uuid || '');
  const [startDate, setStartDate] = useState(monthStartStr);
  const [endDate, setEndDate] = useState(todayStr);

  const downloadedRequestIdsRef = useRef(new Set());

  useEffect(() => {
    if (!selectedStudentUuid && students.length > 0) {
      setSelectedStudentUuid(students[0].student_uuid);
    }
  }, [students, selectedStudentUuid]);

  useEffect(() => {
    if (
      !lastResponse ||
      lastResponse.status !== 'success' ||
      !lastResponse.data?.base64_data ||
      !lastResponse.data?.filename
    ) {
      return;
    }

    if (downloadedRequestIdsRef.current.has(lastResponse.request_id)) {
      return;
    }
    downloadedRequestIdsRef.current.add(lastResponse.request_id);

    try {
      const byteChars = atob(lastResponse.data.base64_data);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i += 1) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: lastResponse.data.mime_type || 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = lastResponse.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('파일 다운로드 변환 오류:', err);
    }
  }, [lastResponse]);

  const handleDownload = () => {
    onRequestExport({
      export_type: exportType,
      file_format: fileFormat,
      student_uuid: exportType === 'student_records' ? selectedStudentUuid : '',
      start_date: exportType === 'period_records' ? startDate : '',
      end_date: exportType === 'period_records' ? endDate : '',
    });
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div
        style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#92400E',
          fontSize: '13.5px',
        }}
      >
        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>학생 개인정보 및 상담 기록 보안 주의사항</strong>
          <p style={{ marginTop: 4, lineHeight: 1.55 }}>
            내보내기 파일에는 학생의 학적 정보와 민감한 상담 기록이 포함되어 있습니다. 다운로드한 파일은
            교내 보안 저장매체에만 보관하시고, <strong>GitHub 공개 저장소나 외부 클라우드에 절대 업로드하지 마세요.</strong>
          </p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px' }}>
          1. 내보낼 데이터 항목 선택
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '22px',
          }}
        >
          {EXPORT_TARGETS.map((item) => {
            const Icon = item.icon;
            const selected = exportType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setExportType(item.id)}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  textAlign: 'left',
                  backgroundColor: selected ? 'rgba(0, 113, 227, 0.07)' : '#F9F9FB',
                  border: selected ? '2px solid #0071E3' : '1px solid rgba(0, 0, 0, 0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      backgroundColor: selected ? '#0071E3' : '#FFFFFF',
                      color: selected ? '#FFFFFF' : '#1D1D1F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <strong style={{ fontSize: '14.5px', color: '#1D1D1F' }}>{item.title}</strong>
                </div>
                <span style={{ fontSize: '12.5px', color: '#6E6E73', lineHeight: 1.45 }}>
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>

        {exportType === 'student_records' && (
          <div
            style={{
              backgroundColor: '#F5F5F7',
              padding: '16px 20px',
              borderRadius: '14px',
              marginBottom: '22px',
            }}
          >
            <label style={lbl}>대상 학생 선택 *</label>
            {students.length === 0 ? (
              <p style={{ fontSize: '13.5px', color: '#86868B' }}>등록된 학생 정보가 없습니다.</p>
            ) : (
              <select
                value={selectedStudentUuid}
                onChange={(e) => setSelectedStudentUuid(e.target.value)}
                style={{ ...inp, maxWidth: '420px' }}
              >
                {students.map((s) => (
                  <option key={s.student_uuid} value={s.student_uuid}>
                    {s.student_number} · {s.name} ({s.grade}학년 {s.class_num}반 {s.number}번 / 상담 {s.total_counseling_count || 0}회)
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {exportType === 'period_records' && (
          <div
            style={{
              backgroundColor: '#F5F5F7',
              padding: '16px 20px',
              borderRadius: '14px',
              marginBottom: '22px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <label style={lbl}>조회 시작일 *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>조회 종료일 *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inp}
              />
            </div>
          </div>
        )}

        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px' }}>
          2. 파일 형식 선택
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          {FORMAT_OPTIONS.map((fmt) => {
            const Icon = fmt.icon;
            const active = fileFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setFileFormat(fmt.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  textAlign: 'left',
                  backgroundColor: active ? '#1D1D1F' : '#F9F9FB',
                  color: active ? '#FFFFFF' : '#1D1D1F',
                  border: active ? '2px solid #1D1D1F' : '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Icon size={22} color={active ? '#60A5FA' : '#0071E3'} />
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700 }}>{fmt.label}</div>
                  <div style={{ fontSize: '12px', opacity: 0.78 }}>{fmt.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="btn-primary"
          disabled={isSubmitting || (exportType === 'student_records' && !selectedStudentUuid)}
          onClick={handleDownload}
          style={{ padding: '14px 28px', borderRadius: '14px', fontSize: '15px' }}
        >
          <Download size={17} />
          <span>{isSubmitting ? '파일 생성 중...' : '선택한 데이터 다운로드'}</span>
        </button>
      </div>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px 28px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: 'rgba(0, 113, 227, 0.1)',
              color: '#0071E3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LayoutTemplate size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '15.5px', fontWeight: 700 }}>
              홈페이지 UI 레이아웃 설정 백업 (JSON)
            </h4>
            <p style={{ fontSize: '13px', color: '#6E6E73', marginTop: 2 }}>
              학생 개인정보가 전혀 포함되지 않은 순수 화면 디자인 설정만 백업합니다. GitHub 저장소 백업용으로 안전하게 사용할 수 있습니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() =>
            onRequestExport({ export_type: 'ui_config_backup', file_format: 'json' })
          }
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            backgroundColor: '#F5F5F7',
            color: '#1D1D1F',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Download size={15} />
          <span>UI 설정 JSON 백업</span>
        </button>
      </div>
    </div>
  );
}

const lbl = {
  display: 'block',
  fontSize: '12.5px',
  fontWeight: 700,
  color: '#424245',
  marginBottom: '6px',
};

const inp = {
  padding: '9px 12px',
  borderRadius: '10px',
  border: '1px solid #D2D2D7',
  fontSize: '14px',
  backgroundColor: '#FFFFFF',
  outline: 'none',
};
