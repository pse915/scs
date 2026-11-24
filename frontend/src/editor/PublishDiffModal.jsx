import React from 'react';
import { Rocket, X, PlusCircle, MinusCircle, Edit3, ArrowUpDown } from 'lucide-react';
import { computeSchemaDiff } from '../utils/uiTreeHelpers';

export default function PublishDiffModal({
  isOpen,
  onClose,
  publishedSchema,
  draftSchema,
  onConfirmPublish,
  isSubmitting,
}) {
  if (!isOpen) return null;

  const diff = computeSchemaDiff(publishedSchema, draftSchema);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '22px',
          padding: '28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: 'rgba(0, 113, 227, 0.1)',
                color: '#0071E3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Rocket size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>학생용 홈페이지 디자인 게시</h3>
              <p style={{ fontSize: '13px', color: '#6E6E73' }}>
                게시 즉시 모든 학생이 접속하는 메인 화면에 반영됩니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#F5F5F7' }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            backgroundColor: '#F5F5F7',
            borderRadius: '14px',
            padding: '16px 18px',
            marginBottom: '20px',
            fontSize: '13.5px',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 10, color: '#1D1D1F' }}>
            현재 게시 버전 대비 변경 사항 요약
          </div>

          {!diff.hasChanges ? (
            <p style={{ color: '#6E6E73' }}>감지된 변경 사항이 없습니다. 현재 상태 그대로 다시 게시합니다.</p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {diff.added.length > 0 && (
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065F46' }}>
                  <PlusCircle size={15} />
                  <span>새로 추가된 요소: <strong>{diff.added.length}개</strong></span>
                </li>
              )}
              {diff.modified.length > 0 && (
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0071E3' }}>
                  <Edit3 size={15} />
                  <span>속성/스타일이 수정된 요소: <strong>{diff.modified.length}개</strong></span>
                </li>
              )}
              {diff.removed.length > 0 && (
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B91C1C' }}>
                  <MinusCircle size={15} />
                  <span>삭제된 요소: <strong>{diff.removed.length}개</strong></span>
                </li>
              )}
              {diff.orderChanged && (
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#424245' }}>
                  <ArrowUpDown size={15} />
                  <span>컴포넌트 배치 순서가 변경되었습니다.</span>
                </li>
              )}
            </ul>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '11px 18px',
              borderRadius: '12px',
              backgroundColor: '#F5F5F7',
              color: '#1D1D1F',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            취소
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={isSubmitting}
            onClick={onConfirmPublish}
            style={{ borderRadius: '12px', padding: '11px 22px' }}
          >
            {isSubmitting ? '게시 중...' : '지금 학생 화면에 게시하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
