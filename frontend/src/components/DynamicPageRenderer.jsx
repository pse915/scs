import React, { useState } from 'react';
import {
  Bell,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function DynamicPageRenderer({
  schema,
  publicConfig = {},
  onOpenApplyModal,
  mode = 'view',
  renderEditWrapper,
}) {
  const [quickInputVal, setQuickInputVal] = useState('');

  if (!schema || !schema.pages || !schema.pages.home) {
    return null;
  }

  const globalStyles = schema.globalStyles || {};
  const rootComponents = schema.pages.home.components || [];

  const renderNode = (node, depth = 0) => {
    if (!node || !node.props) return null;
    if (node.props.visible === false && mode === 'view') {
      return null;
    }

    const p = node.props;
    const baseStyle = {
      width: p.width || '100%',
      height: p.height || 'auto',
      minHeight: p.minHeight || undefined,
      backgroundColor: p.backgroundColor || 'transparent',
      color: p.color || 'inherit',
      fontSize: p.fontSize ? `${p.fontSize}px` : undefined,
      fontWeight: p.fontWeight || undefined,
      textAlign: p.alignment || undefined,
      padding: p.padding || undefined,
      marginTop: p.marginTop !== undefined ? `${p.marginTop}px` : undefined,
      marginBottom: p.marginBottom !== undefined ? `${p.marginBottom}px` : undefined,
      borderRadius: p.borderRadius !== undefined ? `${p.borderRadius}px` : undefined,
      border: p.border || (p.borderColor ? `1px solid ${p.borderColor}` : undefined),
      boxShadow: p.boxShadow || undefined,
      opacity: p.visible === false ? 0.45 : 1,
      display: p.verticalAlign ? 'flex' : undefined,
      flexDirection: p.verticalAlign ? 'column' : undefined,
      justifyContent:
        p.verticalAlign === 'middle'
          ? 'center'
          : p.verticalAlign === 'bottom'
          ? 'flex-end'
          : undefined,
    };

    let content = null;

    switch (node.type) {
      case 'heading':
        content = (
          <h1
            style={{
              ...baseStyle,
              letterSpacing: '-0.025em',
              lineHeight: 1.25,
            }}
          >
            {p.text || '제목 텍스트'}
          </h1>
        );
        break;

      case 'text':
        content = (
          <p
            style={{
              ...baseStyle,
              whiteSpace: 'pre-line',
              lineHeight: 1.65,
            }}
          >
            {p.text || ''}
          </p>
        );
        break;

      case 'divider':
        content = (
          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${p.borderColor || '#E5E5EA'}`,
              marginTop: `${p.marginTop ?? 16}px`,
              marginBottom: `${p.marginBottom ?? 16}px`,
              width: p.width || '100%',
            }}
          />
        );
        break;

      case 'image':
        content = p.src ? (
          <div
            style={{
              textAlign: p.alignment || 'center',
              marginTop: `${p.marginTop ?? 0}px`,
              marginBottom: `${p.marginBottom ?? 16}px`,
            }}
          >
            <img
              src={p.src}
              alt={p.alt || '안내 이미지'}
              style={{
                maxWidth: '100%',
                width: p.width || 'auto',
                height: p.height || 'auto',
                objectFit: 'cover',
                borderRadius: `${p.borderRadius ?? 12}px`,
                border: p.border || undefined,
                boxShadow: p.boxShadow || undefined,
              }}
            />
          </div>
        ) : null;
        break;

      case 'input_field':
        content = (
          <div
            style={{
              ...baseStyle,
              backgroundColor: p.backgroundColor || '#FFFFFF',
            }}
          >
            {p.label && (
              <div style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: 8, color: '#1D1D1F' }}>
                {p.label}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                readOnly={mode === 'edit'}
                value={quickInputVal}
                onChange={(e) => setQuickInputVal(e.target.value)}
                placeholder={p.placeholder || '내용을 입력하세요'}
                style={{
                  flex: 1,
                  minWidth: '180px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${p.borderColor || '#D2D2D7'}`,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (mode === 'view') onOpenApplyModal?.();
                }}
                style={{
                  backgroundColor: '#0071E3',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {p.buttonText || '신청하기'}
              </button>
            </div>
          </div>
        );
        break;

      case 'apply_button':
      case 'button': {
        const handleClick = () => {
          if (mode === 'edit') return;
          if (p.actionType === 'OPEN_APPLY_MODAL' || node.type === 'apply_button') {
            onOpenApplyModal?.();
          } else if (p.linkUrl) {
            window.open(p.linkUrl, '_blank', 'noopener,noreferrer');
          }
        };

        content = (
          <div
            style={{
              display: 'flex',
              justifyContent:
                p.alignment === 'left'
                  ? 'flex-start'
                  : p.alignment === 'right'
                  ? 'flex-end'
                  : 'center',
              marginTop: p.marginTop !== undefined ? `${p.marginTop}px` : undefined,
              marginBottom: p.marginBottom !== undefined ? `${p.marginBottom}px` : undefined,
            }}
          >
            <button
              type="button"
              onClick={handleClick}
              style={{
                width: p.width && p.width !== '100%' ? p.width : undefined,
                height: p.height && p.height !== 'auto' ? p.height : undefined,
                backgroundColor: p.backgroundColor || '#0071E3',
                color: p.color || '#FFFFFF',
                fontSize: `${p.fontSize || 16}px`,
                fontWeight: p.fontWeight || '600',
                padding: p.padding || '14px 30px',
                borderRadius: `${p.borderRadius ?? 980}px`,
                border: p.border || 'none',
                boxShadow: p.boxShadow || '0 4px 14px rgba(0, 113, 227, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>{p.text || '상담 신청하기'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        );
        break;
      }

      case 'notice':
        content = (
          <div
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(0, 113, 227, 0.1)',
                color: p.accentColor || '#0071E3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: 4, color: p.color || '#1D1D1F' }}>
                {p.title || '공지사항'}
              </div>
              <div style={{ fontSize: '14.5px', color: p.color || '#424245', whiteSpace: 'pre-line' }}>
                {p.customText || publicConfig.notice_banner || '등록된 공지사항이 없습니다.'}
              </div>
            </div>
          </div>
        );
        break;

      case 'stat_card':
        content = (
          <div style={baseStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#6E6E73' }}>
                {p.title || '주요 안내'}
              </span>
              <Sparkles size={16} color={p.accentColor || '#0071E3'} />
            </div>
            <div
              style={{
                fontSize: `${p.fontSize || 28}px`,
                fontWeight: 700,
                color: p.accentColor || '#0071E3',
                letterSpacing: '-0.02em',
                marginBottom: 6,
              }}
            >
              {p.statValue || '100%'}
            </div>
            <div style={{ fontSize: '13.5px', color: p.color || '#424245', lineHeight: 1.5 }}>
              {p.description || ''}
            </div>
          </div>
        );
        break;

      case 'counseling_guide': {
        const guideMap = {
          operating_hours: {
            icon: <Clock size={20} color="#0071E3" />,
            content: p.customText || publicConfig.operating_hours,
          },
          precautions: {
            icon: <ShieldAlert size={20} color="#FF9500" />,
            content: p.customText || publicConfig.precautions,
          },
          completion_guide: {
            icon: <CheckCircle2 size={20} color="#34C759" />,
            content: p.customText || publicConfig.completion_guide,
          },
        };
        const selected = guideMap[p.guideType] || guideMap.operating_hours;

        content = (
          <div style={baseStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {selected.icon}
              <h3 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                {p.title || '상담 안내'}
              </h3>
            </div>
            <p style={{ fontSize: '14.5px', color: p.color || '#424245', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
              {selected.content}
            </p>
          </div>
        );
        break;
      }

      case 'container':
      case 'card':
        content = (
          <div style={baseStyle}>
            {(node.children || []).length === 0 && mode === 'edit' ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#86868B',
                  fontSize: '13px',
                }}
              >
                빈 컨테이너 — 좌측 패널에서 요소를 이 안으로 드래그하세요
              </div>
            ) : (
              (node.children || []).map((child) => renderNode(child, depth + 1))
            )}
          </div>
        );
        break;

      case 'columns_2':
        content = (
          <div
            style={{
              ...baseStyle,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: `${p.gap ?? 20}px`,
            }}
          >
            {(node.children || []).map((child) => renderNode(child, depth + 1))}
          </div>
        );
        break;

      case 'columns_3':
        content = (
          <div
            style={{
              ...baseStyle,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: `${p.gap ?? 16}px`,
            }}
          >
            {(node.children || []).map((child) => renderNode(child, depth + 1))}
          </div>
        );
        break;

      default:
        return null;
    }

    if (!content) return null;

    if (mode === 'edit' && typeof renderEditWrapper === 'function') {
      return renderEditWrapper(node, content, depth);
    }

    return <React.Fragment key={node.id}>{content}</React.Fragment>;
  };

  return (
    <div
      style={{
        maxWidth: globalStyles.maxWidth || '1040px',
        margin: '0 auto',
        padding: '28px 20px 64px',
      }}
    >
      {rootComponents.map((comp) => renderNode(comp, 0))}
    </div>
  );
}
