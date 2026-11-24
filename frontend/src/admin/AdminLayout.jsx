import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Inbox,
  Users,
  Paintbrush,
  Settings,
  Download,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Dashboard from './Dashboard';
import RequestManager from './RequestManager';
import StudentRecords from './StudentRecords';
import SettingsManager from './SettingsManager';
import ExportManager from './ExportManager';
import VisualEditor from '../editor/VisualEditor';

const NAV_ITEMS = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'requests', label: '상담 신청 관리', icon: Inbox },
  { id: 'records', label: '학생별 상담 기록', icon: Users },
  { id: 'editor', label: '디자인 편집 (UI 빌더)', icon: Paintbrush },
  { id: 'settings', label: '운영 및 분야 설정', icon: Settings },
  { id: 'export', label: '데이터 내보내기', icon: Download },
];

export default function AdminLayout({
  sheetsStatus,
  adminData,
  uiSchema,
  publicConfig,
  sendAction,
  isSubmitting,
  lastResponse,
  clearResponse,
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prefillStudentContext, setPrefillStudentContext] = useState(null);
  const [bannerNotice, setBannerNotice] = useState(null);

  useEffect(() => {
    if (!lastResponse) return;
    if (lastResponse.status === 'success' && lastResponse.data?.message) {
      setBannerNotice({ type: 'success', text: lastResponse.data.message });
      const timer = setTimeout(() => setBannerNotice(null), 3500);
      return () => clearTimeout(timer);
    } else if (lastResponse.status === 'error' && lastResponse.error) {
      setBannerNotice({ type: 'error', text: lastResponse.error });
    }
  }, [lastResponse]);

  const handleStartRecordFromRequest = (req) => {
    setPrefillStudentContext({
      student_uuid: req.student_uuid,
      request_uuid: req.request_uuid,
      category: req.category,
      reason: req.reason,
    });
    setActiveTab('records');
  };

  if (activeTab === 'editor') {
    return (
      <>
        <VisualEditor
          initialDraftSchema={uiSchema?.draft || uiSchema?.published}
          publishedSchema={uiSchema?.published}
          publicConfig={publicConfig}
          onSaveDraft={(schema) => sendAction('SAVE_UI_DRAFT', { ui_schema: schema })}
          onPublishConfig={(schema) => sendAction('PUBLISH_UI_CONFIG', { ui_schema: schema })}
          onResetDefault={() => sendAction('RESET_UI_DEFAULT')}
          onExitEditor={() => setActiveTab('dashboard')}
          isSubmitting={isSubmitting}
        />
        {bannerNotice && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 200,
              padding: '12px 22px',
              borderRadius: '980px',
              backgroundColor: bannerNotice.type === 'success' ? '#1D1D1F' : '#B91C1C',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            {bannerNotice.text}
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F5F7' }}>
      <aside
        style={{
          width: '245px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ padding: '0 12px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0071E3', letterSpacing: '0.04em' }}>
              ADMIN CONSOLE
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1D1D1F', marginTop: 2 }}>
              학생 상담 통합 관리
            </div>
          </div>

          <nav style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    clearResponse?.();
                    setActiveTab(item.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    backgroundColor: isActive ? 'rgba(0, 113, 227, 0.1)' : 'transparent',
                    color: isActive ? '#0071E3' : '#424245',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '14px',
                    textAlign: 'left',
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => sendAction('REFRESH_DATA')}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#F5F5F7',
              color: '#1D1D1F',
              fontSize: '13.5px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '8px',
            }}
          >
            <RefreshCw size={15} />
            <span>시트 데이터 동기화</span>
          </button>

          <button
            type="button"
            onClick={() => sendAction('ADMIN_LOGOUT')}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'transparent',
              color: '#D93025',
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <LogOut size={15} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '28px 32px', maxWidth: '1440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: '23px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
          </h2>

          {sheetsStatus?.connected ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 13px',
                borderRadius: 980,
                backgroundColor: '#ECFDF5',
                color: '#065F46',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={14} />
              Google Sheets 실시간 연동됨
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 13px',
                borderRadius: 980,
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={14} />
              Sheets 연결 점검 필요
            </span>
          )}
        </div>

        {bannerNotice && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              marginBottom: '18px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: bannerNotice.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${bannerNotice.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              color: bannerNotice.type === 'success' ? '#065F46' : '#B91C1C',
            }}
          >
            {bannerNotice.text}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard adminData={adminData} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'requests' && (
          <RequestManager
            requests={adminData?.requests || []}
            categories={adminData?.categories || []}
            onUpdateStatus={(p) => sendAction('UPDATE_REQUEST_STATUS', p)}
            onStartRecordFromRequest={handleStartRecordFromRequest}
            isSubmitting={isSubmitting}
          />
        )}

        {activeTab === 'records' && (
          <StudentRecords
            students={adminData?.students || []}
            records={adminData?.records || []}
            categories={adminData?.categories || []}
            prefillStudentContext={prefillStudentContext}
            onClearPrefill={() => setPrefillStudentContext(null)}
            onUpsertStudent={(p) => sendAction('UPSERT_STUDENT', p)}
            onCreateRecord={(p) => sendAction('CREATE_COUNSELING_RECORD', p)}
            onUpdateRecord={(p) => sendAction('UPDATE_COUNSELING_RECORD', p)}
            onDeleteRecord={(p) => sendAction('DELETE_COUNSELING_RECORD', p)}
            isSubmitting={isSubmitting}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsManager
            categories={adminData?.categories || []}
            settings={adminData?.settings || {}}
            onSaveCategories={(p) => sendAction('SAVE_CATEGORIES', p)}
            onSaveSettings={(p) => sendAction('SAVE_SYSTEM_SETTINGS', p)}
            isSubmitting={isSubmitting}
          />
        )}

        {activeTab === 'export' && (
          <ExportManager
            students={adminData?.students || []}
            onRequestExport={(p) => sendAction('EXPORT_DATA', p)}
            isSubmitting={isSubmitting}
            lastResponse={lastResponse}
          />
        )}
      </main>
    </div>
  );
}
