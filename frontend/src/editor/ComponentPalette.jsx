import React from 'react';
import {
  Type,
  AlignLeft,
  MousePointerClick,
  Image as ImageIcon,
  Square,
  Minus,
  TextCursorInput,
  Bell,
  BarChart2,
  Send,
  Info,
  Box,
  Columns2,
  Columns3,
  GripVertical,
} from 'lucide-react';
import { COMPONENT_DEFINITIONS } from '../utils/uiTreeHelpers';

const ICONS_BY_TYPE = {
  heading: Type,
  text: AlignLeft,
  button: MousePointerClick,
  image: ImageIcon,
  card: Square,
  divider: Minus,
  input_field: TextCursorInput,
  notice: Bell,
  stat_card: BarChart2,
  apply_button: Send,
  counseling_guide: Info,
  container: Box,
  columns_2: Columns2,
  columns_3: Columns3,
};

export default function ComponentPalette({ onDragStartNew, onQuickAddComponent }) {
  const groups = ['기본 UI 요소', '상담 전용 위젯', '레이아웃 구조'];

  return (
    <aside
      style={{
        width: '250px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        padding: '18px 14px',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <div style={{ marginBottom: '14px', padding: '0 4px' }}>
        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1D1D1F' }}>컴포넌트 패널</div>
        <div style={{ fontSize: '12px', color: '#6E6E73', marginTop: 2 }}>
          캔버스로 드래그하거나 클릭하여 추가
        </div>
      </div>

      {groups.map((groupName) => {
        const items = COMPONENT_DEFINITIONS.filter((d) => d.group === groupName);
        return (
          <div key={groupName} style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#86868B',
                padding: '0 4px',
                marginBottom: '8px',
                letterSpacing: '0.02em',
              }}
            >
              {groupName}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {items.map((item) => {
                const Icon = ICONS_BY_TYPE[item.type] || Box;
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'copy';
                      e.dataTransfer.setData(
                        'text/plain',
                        JSON.stringify({ kind: 'NEW_COMPONENT', type: item.type })
                      );
                      onDragStartNew?.(item.type);
                    }}
                    onClick={() => onQuickAddComponent?.(item.type)}
                    title="드래그하여 배치 또는 클릭하여 하단 추가"
                    style={{
                      backgroundColor: '#F9F9FB',
                      border: '1px solid rgba(0, 0, 0, 0.07)',
                      borderRadius: '12px',
                      padding: '10px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'grab',
                      userSelect: 'none',
                      transition: 'all 150ms ease',
                      position: 'relative',
                    }}
                  >
                    <GripVertical
                      size={12}
                      color="#AEAEB2"
                      style={{ position: 'absolute', top: 6, right: 6 }}
                    />
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: '#FFFFFF',
                        color: '#0071E3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#1D1D1F',
                        textAlign: 'center',
                        lineHeight: 1.25,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
