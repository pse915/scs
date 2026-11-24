import React, { useState } from 'react';
import { HeartHandshake, Search, Lock } from 'lucide-react';
import DynamicPageRenderer from '../components/DynamicPageRenderer';
import ApplyModal from '../components/ApplyModal';
import LookupModal from '../components/LookupModal';

export default function StudentHome({
  uiSchema,
  publicConfig,
  onNavigateLogin,
  sendAction,
  isSubmitting,
  lastResponse,
  clearResponse,
}) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);

  const activeSchema = uiSchema?.published || uiSchema?.draft;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: activeSchema?.globalStyles?.backgroundColor || '#F5F5F7' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <div
          style={{
            maxWidth: '1040px',
            margin: '0 auto',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: '#0071E3',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HeartHandshake size={19} />
            </div>
            <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              학생 상담 포털
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                clearResponse?.();
                setLookupOpen(true);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '980px',
                backgroundColor: '#F5F5F7',
                color: '#1D1D1F',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Search size={14} />
              <span>내 신청 내역 조회</span>
            </button>

            <button
              type="button"
              onClick={onNavigateLogin}
              style={{
                padding: '8px 14px',
                borderRadius: '980px',
                backgroundColor: 'transparent',
                color: '#6E6E73',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Lock size={13} />
              <span>관리자</span>
            </button>
          </div>
        </div>
      </header>

      <DynamicPageRenderer
        schema={activeSchema}
        publicConfig={publicConfig}
        mode="view"
        onOpenApplyModal={() => {
          clearResponse?.();
          setApplyOpen(true);
        }}
      />

      <ApplyModal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        categories={publicConfig?.categories || []}
        onSubmitApply={(p) => sendAction('SUBMIT_COUNSELING_REQUEST', p)}
        isSubmitting={isSubmitting}
        lastResponse={lastResponse}
        clearResponse={clearResponse}
      />

      <LookupModal
        isOpen={lookupOpen}
        onClose={() => setLookupOpen(false)}
        onLookup={(p) => sendAction('LOOKUP_STUDENT_REQUESTS', p)}
        onCancelRequest={(p) => sendAction('CANCEL_OWN_REQUEST', p)}
        isSubmitting={isSubmitting}
        lastResponse={lastResponse}
        clearResponse={clearResponse}
      />
    </div>
  );
}
