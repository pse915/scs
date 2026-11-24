import React, { useState, useEffect } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';

export default function StudentRecords({
  students = [],
  records = [],
  categories = [],
  prefillStudentContext,
  onClearPrefill,
  onUpsertStudent,
  onCreateRecord,
  onDeleteRecord,
  isSubmitting,
}) {
  const [selectedStudentUuid, setSelectedStudentUuid] = useState(students[0]?.student_uuid || '');
  const [showNewStudent, setShowNewStudent] = useState(false);
  const [showNewRecord, setShowNewRecord] = useState(false);

  const [stuForm, setStuForm] = useState({ grade: '1', class_num: '1', number: '1', name: '', note: '' });
  const [recForm, setRecForm] = useState({
    counseling_date: new Date().toISOString().split('T')[0],
    counseling_time: '13:00',
    counseling_type: '대면 상담',
    category: categories[0]?.name || '진로·진학',
    topic: '',
    presenting_issue: '',
    progress_content: '',
    counseling_result: '',
    followup_plan: '',
    next_counseling_date: '',
    admin_memo: '',
    request_uuid: '',
  });

  useEffect(() => {
    if (prefillStudentContext) {
      setSelectedStudentUuid(prefillStudentContext.student_uuid);
      setRecForm((prev) => ({
        ...prev,
        category: prefillStudentContext.category || prev.category,
        presenting_issue: prefillStudentContext.reason || '',
        request_uuid: prefillStudentContext.request_uuid || '',
      }));
      setShowNewRecord(true);
      onClearPrefill?.();
    }
  }, [prefillStudentContext, onClearPrefill]);

  const currentStudent = students.find((s) => s.student_uuid === selectedStudentUuid);
  const studentRecords = records.filter((r) => r.student_uuid === selectedStudentUuid);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
      {/* 좌측 학생 목록 */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, border: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: '15px' }}>학생 명단 ({students.length}명)</strong>
          <button type="button" onClick={() => setShowNewStudent((v) => !v)} style={{ padding: '6px 10px', borderRadius: 8, backgroundColor: '#F5F5F7', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <UserPlus size={13} />
            <span>학생 추가</span>
          </button>
        </div>

        {showNewStudent && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpsertStudent(stuForm);
              setShowNewStudent(false);
            }}
            style={{ backgroundColor: '#F5F5F7', padding: 12, borderRadius: 12, marginBottom: 12, display: 'grid', gap: 8 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              <input type="number" placeholder="학년" required value={stuForm.grade} onChange={(e) => setStuForm({ ...stuForm, grade: e.target.value })} style={inp} />
              <input type="number" placeholder="반" required value={stuForm.class_num} onChange={(e) => setStuForm({ ...stuForm, class_num: e.target.value })} style={inp} />
              <input type="number" placeholder="번호" required value={stuForm.number} onChange={(e) => setStuForm({ ...stuForm, number: e.target.value })} style={inp} />
            </div>
            <input type="text" placeholder="이름" required value={stuForm.name} onChange={(e) => setStuForm({ ...stuForm, name: e.target.value })} style={inp} />
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ borderRadius: 8, padding: '8px', fontSize: '12.5px' }}>
              등록 저장
            </button>
          </form>
        )}

        <div style={{ display: 'grid', gap: 6 }}>
          {students.map((s) => (
            <button
              key={s.student_uuid}
              type="button"
              onClick={() => setSelectedStudentUuid(s.student_uuid)}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                textAlign: 'left',
                backgroundColor: selectedStudentUuid === s.student_uuid ? 'rgba(0, 113, 227, 0.1)' : '#F9F9FB',
                color: selectedStudentUuid === s.student_uuid ? '#0071E3' : '#1D1D1F',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{s.student_number} {s.name}</span>
              <span style={{ fontSize: '12px', color: '#6E6E73' }}>{s.total_counseling_count || 0}회</span>
            </button>
          ))}
        </div>
      </div>

      {/* 우측 선택 학생 상담 일지 */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, border: '1px solid rgba(0,0,0,0.05)' }}>
        {!currentStudent ? (
          <p style={{ color: '#86868B' }}>좌측에서 상담 기록을 조회할 학생을 선택하세요.</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: '19px', fontWeight: 700 }}>
                  {currentStudent.student_number} {currentStudent.name}
                </h3>
                <p style={{ fontSize: '13px', color: '#6E6E73' }}>
                  누적 상담 {currentStudent.total_counseling_count || 0}회 · 최근 상담일: {currentStudent.last_counseling_date || '없음'}
                </p>
              </div>
              <button type="button" className="btn-primary" onClick={() => setShowNewRecord((v) => !v)} style={{ borderRadius: 12, padding: '10px 16px', fontSize: '13.5px' }}>
                <Plus size={15} />
                <span>새 상담 일지 작성</span>
              </button>
            </div>

            {showNewRecord && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onCreateRecord({ ...recForm, student_uuid: currentStudent.student_uuid });
                  setShowNewRecord(false);
                }}
                style={{ backgroundColor: '#F5F5F7', padding: 18, borderRadius: 16, marginBottom: 20, display: 'grid', gap: 10 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <input type="date" required value={recForm.counseling_date} onChange={(e) => setRecForm({ ...recForm, counseling_date: e.target.value })} style={inp} />
                  <input type="text" placeholder="상담 시간 (예: 13:00)" value={recForm.counseling_time} onChange={(e) => setRecForm({ ...recForm, counseling_time: e.target.value })} style={inp} />
                  <select value={recForm.category} onChange={(e) => setRecForm({ ...recForm, category: e.target.value })} style={inp}>
                    {categories.map((c) => (
                      <option key={c.category_uuid || c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <input type="text" required placeholder="상담 주제 *" value={recForm.topic} onChange={(e) => setRecForm({ ...recForm, topic: e.target.value })} style={inp} />
                <textarea rows={2} placeholder="주요 호소 내용" value={recForm.presenting_issue} onChange={(e) => setRecForm({ ...recForm, presenting_issue: e.target.value })} style={inp} />
                <textarea rows={3} placeholder="상담 진행 내용" value={recForm.progress_content} onChange={(e) => setRecForm({ ...recForm, progress_content: e.target.value })} style={inp} />
                <input type="text" placeholder="상담 결과 및 추후 지도 계획" value={recForm.counseling_result} onChange={(e) => setRecForm({ ...recForm, counseling_result: e.target.value })} style={inp} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" onClick={() => setShowNewRecord(false)} style={{ padding: '8px 14px', borderRadius: 10, backgroundColor: '#FFFFFF' }}>취소</button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ borderRadius: 10, padding: '8px 18px' }}>일지 저장</button>
                </div>
              </form>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
              {studentRecords.length === 0 ? (
                <p style={{ color: '#86868B', padding: '24px 0' }}>작성된 상담 일지가 없습니다.</p>
              ) : (
                studentRecords.map((rec) => (
                  <div key={rec.record_uuid} style={{ padding: '16px 18px', borderRadius: 16, backgroundColor: '#F9F9FB', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <strong style={{ fontSize: '15px' }}>{rec.topic}</strong>
                        <span style={{ marginLeft: 8, fontSize: '12.5px', color: '#0071E3', fontWeight: 600 }}>{rec.category}</span>
                        <span style={{ marginLeft: 8, fontSize: '12.5px', color: '#6E6E73' }}>{rec.counseling_date} {rec.counseling_time}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('이 상담 기록을 삭제하시겠습니까?')) {
                            onDeleteRecord({ record_uuid: rec.record_uuid });
                          }
                        }}
                        style={{ padding: '6px 10px', borderRadius: 8, backgroundColor: '#FEF2F2', color: '#D93025', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Trash2 size={13} />
                        <span>삭제</span>
                      </button>
                    </div>
                    {rec.presenting_issue && <p style={{ fontSize: '13.5px', color: '#424245', marginBottom: 4 }}><strong>호소 내용:</strong> {rec.presenting_issue}</p>}
                    {rec.progress_content && <p style={{ fontSize: '13.5px', color: '#1D1D1F', marginBottom: 4 }}><strong>진행 내용:</strong> {rec.progress_content}</p>}
                    {rec.counseling_result && <p style={{ fontSize: '13.5px', color: '#065F46' }}><strong>결과/계획:</strong> {rec.counseling_result}</p>}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const inp = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D2D2D7', fontSize: '13px', backgroundColor: '#FFFFFF' };
