import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';

export default function AdminLogin({
  onBack,
  onSubmitLogin,
  isSubmitting,
  lastResponse,
}) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitLogin(password);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, backgroundColor: 'transparent', color: '#6E6E73', fontSize: '13.5px', fontWeight: 600, marginBottom: 20 }}
        >
          <ArrowLeft size={15} />
          <span>학생 홈으로 돌아가기</span>
        </button>

        <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0, 113, 227, 0.1)', color: '#0071E3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Lock size={22} />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 6 }}>상담 관리자 로그인</h2>
        <p style={{ fontSize: '13.5px', color: '#6E6E73', marginBottom: 20 }}>
          학생 상담 신청 관리 및 상담 일지 열람을 위해 관리자 비밀번호를 입력하세요.
        </p>

        {lastResponse?.status === 'error' && lastResponse.error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '13px', fontWeight: 600, marginBottom: 14 }}>
            {lastResponse.error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <input
            type="password"
            required
            autoFocus
            placeholder="관리자 비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #D2D2D7', fontSize: '15px', outline: 'none' }}
          />
          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: '100%', borderRadius: 12, padding: '13px' }}>
            {isSubmitting ? '인증 확인 중...' : '관리자 콘솔 접속'}
          </button>
        </form>
      </div>
    </div>
  );
}
