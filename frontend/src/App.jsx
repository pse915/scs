import React, { useState, useEffect } from 'react';
import { useStreamlitBridge } from './hooks/useStreamlitBridge';
import StudentHome from './pages/StudentHome';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './admin/AdminLayout';

export default function App() {
  const {
    serverPayload,
    sendAction,
    isSubmitting,
    lastResponse,
    clearResponse,
  } = useStreamlitBridge();

  const [viewMode, setViewMode] = useState('student');

  const isAuthenticated = Boolean(serverPayload?.auth_state?.is_authenticated);

  useEffect(() => {
    if (isAuthenticated && viewMode === 'login') {
      setViewMode('student');
    }
  }, [isAuthenticated, viewMode]);

  if (!serverPayload) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6E6E73',
          fontSize: '15px',
        }}
      >
        상담 관리 시스템을 불러오는 중입니다...
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <AdminLayout
        sheetsStatus={serverPayload.sheets_status}
        adminData={serverPayload.admin_data}
        uiSchema={serverPayload.ui_schema}
        publicConfig={serverPayload.public_config}
        sendAction={sendAction}
        isSubmitting={isSubmitting}
        lastResponse={lastResponse}
        clearResponse={clearResponse}
      />
    );
  }

  if (viewMode === 'login') {
    return (
      <AdminLogin
        onBack={() => {
          clearResponse();
          setViewMode('student');
        }}
        onSubmitLogin={(password) => sendAction('ADMIN_LOGIN', { password })}
        isSubmitting={isSubmitting}
        lastResponse={lastResponse}
        clearResponse={clearResponse}
      />
    );
  }

  return (
    <StudentHome
      uiSchema={serverPayload.ui_schema}
      publicConfig={serverPayload.public_config}
      sheetsStatus={serverPayload.sheets_status}
      onNavigateLogin={() => {
        clearResponse();
        setViewMode('login');
      }}
      sendAction={sendAction}
      isSubmitting={isSubmitting}
      lastResponse={lastResponse}
      clearResponse={clearResponse}
    />
  );
}
