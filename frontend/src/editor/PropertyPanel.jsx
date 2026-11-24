import React from 'react';
import {
  Sliders,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';

export default function PropertyPanel({
  selectedNode,
  globalStyles,
  onUpdateNodeProps,
  onUpdateGlobalStyles,
  onDuplicateNode,
  onDeleteNode,
}) {
  if (!selectedNode) {
    return (
      <aside style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Sliders size={16} color="#0071E3" />
          <h3 style={{ fontSize: '14.5px', fontWeight: 700 }}>전체 페이지 스타일</h3>
        </div>
        <p style={{ fontSize: '12.5px', color: '#6E6E73', marginBottom: 18 }}>
          캔버스에서 요소를 클릭하면 해당 요소의 세부 속성을 편집할 수 있습니다.
        </p>

        <div style={secBox}>
          <label style={lbl}>페이지 전체 배경색</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="color"
              value={globalStyles?.backgroundColor || '#F5F5F7'}
              onChange={(e) => onUpdateGlobalStyles({ backgroundColor: e.target.value })}
              style={colorPicker}
            />
            <input
              type="text"
              value={globalStyles?.backgroundColor || '#F5F5F7'}
              onChange={(e) => onUpdateGlobalStyles({ backgroundColor: e.target.value })}
              style={inp}
            />
          </div>
        </div>

        <div style={secBox}>
          <label style={lbl}>콘텐츠 최대 너비 (예: 1040px)</label>
          <input
            type="text"
            value={globalStyles?.maxWidth || '1040px'}
            onChange={(e) => onUpdateGlobalStyles({ maxWidth: e.target.value })}
            style={inp}
          />
        </div>
      </aside>
    );
  }

  const p = selectedNode.props || {};
  const setProp = (patch) => onUpdateNodeProps(selectedNode.id, patch);

  return (
    <aside style={panelStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          marginBottom: '14px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0071E3' }}>SELECTED ELEMENT</div>
          <div style={{ fontSize: '14.5px', fontWeight: 700 }}>{selectedNode.type}</div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            title={p.visible === false ? '요소 표시하기' : '요소 숨기기'}
            onClick={() => setProp({ visible: p.visible === false })}
            style={iconBtn}
          >
            {p.visible === false ? <EyeOff size={15} color="#D93025" /> : <Eye size={15} />}
          </button>
          <button
            type="button"
            title="복제"
            onClick={() => onDuplicateNode(selectedNode.id)}
            style={iconBtn}
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            title="삭제"
            onClick={() => onDeleteNode(selectedNode.id)}
            style={{ ...iconBtn, color: '#D93025' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {'text' in p && (
        <div style={secBox}>
          <label style={lbl}>표시 텍스트</label>
          <textarea
            rows={3}
            value={p.text || ''}
            onChange={(e) => setProp({ text: e.target.value })}
            style={inp}
          />
        </div>
      )}

      {'title' in p && (
        <div style={secBox}>
          <label style={lbl}>제목 (Title)</label>
          <input
            type="text"
            value={p.title || ''}
            onChange={(e) => setProp({ title: e.target.value })}
            style={inp}
          />
        </div>
      )}

      {'statValue' in p && (
        <div style={secBox}>
          <label style={lbl}>강조 수치 / 키워드</label>
          <input
            type="text"
            value={p.statValue || ''}
            onChange={(e) => setProp({ statValue: e.target.value })}
            style={inp}
          />
        </div>
      )}

      {'description' in p && (
        <div style={secBox}>
          <label style={lbl}>설명 문구</label>
          <textarea
            rows={2}
            value={p.description || ''}
            onChange={(e) => setProp({ description: e.target.value })}
            style={inp}
          />
        </div>
      )}

      {'customText' in p && (
        <div style={secBox}>
          <label style={lbl}>직접 내용 입력 (비워두면 학교 설정 자동 연동)</label>
          <textarea
            rows={3}
            placeholder="비워두면 '운영 및 분야 설정'의 문구가 자동 표시됩니다."
            value={p.customText || ''}
            onChange={(e) => setProp({ customText: e.target.value })}
            style={inp}
          />
        </div>
      )}

      {selectedNode.type === 'counseling_guide' && (
        <div style={secBox}>
          <label style={lbl}>연동할 안내 유형</label>
          <select
            value={p.guideType || 'operating_hours'}
            onChange={(e) => setProp({ guideType: e.target.value })}
            style={inp}
          >
            <option value="operating_hours">상담 가능 시간 및 운영 안내</option>
            <option value="precautions">상담 신청 시 주의사항</option>
            <option value="completion_guide">상담 신청 완료 후 절차</option>
          </select>
        </div>
      )}

      {selectedNode.type === 'image' && (
        <>
          <div style={secBox}>
            <label style={lbl}>이미지 URL</label>
            <input
              type="text"
              value={p.src || ''}
              onChange={(e) => setProp({ src: e.target.value })}
              style={inp}
            />
          </div>
          <div style={secBox}>
            <label style={lbl}>대체 텍스트 (웹 접근성 Alt)</label>
            <input
              type="text"
              value={p.alt || ''}
              onChange={(e) => setProp({ alt: e.target.value })}
              style={inp}
            />
          </div>
        </>
      )}

      {(selectedNode.type === 'button' || selectedNode.type === 'apply_button') && (
        <div style={secBox}>
          <label style={lbl}>버튼 클릭 동작</label>
          <select
            value={p.actionType || 'OPEN_APPLY_MODAL'}
            onChange={(e) => setProp({ actionType: e.target.value })}
            style={{ ...inp, marginBottom: 8 }}
          >
            <option value="OPEN_APPLY_MODAL">학생 상담 신청서 열기</option>
            <option value="EXTERNAL_LINK">외부 링크 이동</option>
          </select>
          {p.actionType === 'EXTERNAL_LINK' && (
            <input
              type="url"
              placeholder="https://..."
              value={p.linkUrl || ''}
              onChange={(e) => setProp({ linkUrl: e.target.value })}
              style={inp}
            />
          )}
        </div>
      )}

      <div style={secBox}>
        <label style={lbl}>크기 (너비 / 높이)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <span style={subLbl}>너비 (Width)</span>
            <input
              type="text"
              placeholder="100% 또는 320px"
              value={p.width || '100%'}
              onChange={(e) => setProp({ width: e.target.value })}
              style={inp}
            />
          </div>
          <div>
            <span style={subLbl}>높이 (Height)</span>
            <input
              type="text"
              placeholder="auto 또는 180px"
              value={p.height || 'auto'}
              onChange={(e) => setProp({ height: e.target.value })}
              style={inp}
            />
          </div>
        </div>
      </div>

      <div style={secBox}>
        <label style={lbl}>정렬 (가로 / 세로)</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {[
            { val: 'left', icon: AlignLeft },
            { val: 'center', icon: AlignCenter },
            { val: 'right', icon: AlignRight },
          ].map(({ val, icon: Icon }) => (
            <button
              key={val}
              type="button"
              onClick={() => setProp({ alignment: val })}
              style={{
                flex: 1,
                padding: '7px',
                borderRadius: '8px',
                backgroundColor: p.alignment === val ? '#0071E3' : '#F5F5F7',
                color: p.alignment === val ? '#FFFFFF' : '#1D1D1F',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>

        <select
          value={p.verticalAlign || 'top'}
          onChange={(e) => setProp({ verticalAlign: e.target.value })}
          style={inp}
        >
          <option value="top">세로 정렬: 상단 (Top)</option>
          <option value="middle">세로 정렬: 중앙 (Middle)</option>
          <option value="bottom">세로 정렬: 하단 (Bottom)</option>
        </select>
      </div>

      <div style={secBox}>
        <label style={lbl}>글자 크기 및 굵기</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <span style={subLbl}>크기 (px)</span>
            <input
              type="number"
              min="10"
              max="72"
              value={p.fontSize || 16}
              onChange={(e) => setProp({ fontSize: Number(e.target.value) })}
              style={inp}
            />
          </div>
          <div>
            <span style={subLbl}>굵기</span>
            <select
              value={String(p.fontWeight || '400')}
              onChange={(e) => setProp({ fontWeight: e.target.value })}
              style={inp}
            >
              <option value="400">보통 (400)</option>
              <option value="500">중간 (500)</option>
              <option value="600">세미볼드 (600)</option>
              <option value="700">굵게 (700)</option>
            </select>
          </div>
        </div>
      </div>

      <div style={secBox}>
        <label style={lbl}>색상 (배경색 / 글자색)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <span style={subLbl}>배경색</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="color"
                value={p.backgroundColor && p.backgroundColor.startsWith('#') ? p.backgroundColor : '#FFFFFF'}
                onChange={(e) => setProp({ backgroundColor: e.target.value })}
                style={colorPicker}
              />
              <input
                type="text"
                value={p.backgroundColor || 'transparent'}
                onChange={(e) => setProp({ backgroundColor: e.target.value })}
                style={{ ...inp, fontSize: '12px', padding: '6px' }}
              />
            </div>
          </div>
          <div>
            <span style={subLbl}>글자색</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="color"
                value={p.color && p.color.startsWith('#') ? p.color : '#1D1D1F'}
                onChange={(e) => setProp({ color: e.target.value })}
                style={colorPicker}
              />
              <input
                type="text"
                value={p.color || '#1D1D1F'}
                onChange={(e) => setProp({ color: e.target.value })}
                style={{ ...inp, fontSize: '12px', padding: '6px' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={secBox}>
        <label style={lbl}>테두리 및 외곽 스타일</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div>
            <span style={subLbl}>모서리 둥글기 (px)</span>
            <input
              type="number"
              min="0"
              max="980"
              value={p.borderRadius ?? 12}
              onChange={(e) => setProp({ borderRadius: Number(e.target.value) })}
              style={inp}
            />
          </div>
          <div>
            <span style={subLbl}>그림자</span>
            <select
              value={p.boxShadow || ''}
              onChange={(e) => setProp({ boxShadow: e.target.value })}
              style={inp}
            >
              <option value="">없음</option>
              <option value="0 2px 12px rgba(0, 0, 0, 0.04)">은은한 그림자</option>
              <option value="0 8px 24px rgba(0, 0, 0, 0.08)">중간 그림자</option>
              <option value="0 16px 40px rgba(0, 0, 0, 0.14)">강한 그림자</option>
            </select>
          </div>
        </div>
        <span style={subLbl}>테두리 CSS (예: 1px solid #D2D2D7)</span>
        <input
          type="text"
          placeholder="없음"
          value={p.border || ''}
          onChange={(e) => setProp({ border: e.target.value })}
          style={inp}
        />
      </div>

      <div style={secBox}>
        <label style={lbl}>여백 (안쪽 패딩 / 위아래 마진)</label>
        <div style={{ marginBottom: 8 }}>
          <span style={subLbl}>안쪽 여백 (Padding, 예: 24px 또는 16px 24px)</span>
          <input
            type="text"
            value={p.padding || '0px'}
            onChange={(e) => setProp({ padding: e.target.value })}
            style={inp}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <span style={subLbl}>위 여백 (px)</span>
            <input
              type="number"
              value={p.marginTop ?? 0}
              onChange={(e) => setProp({ marginTop: Number(e.target.value) })}
              style={inp}
            />
          </div>
          <div>
            <span style={subLbl}>아래 여백 (px)</span>
            <input
              type="number"
              value={p.marginBottom ?? 16}
              onChange={(e) => setProp({ marginBottom: Number(e.target.value) })}
              style={inp}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

const panelStyle = {
  width: '300px',
  backgroundColor: '#FFFFFF',
  borderLeft: '1px solid rgba(0, 0, 0, 0.08)',
  padding: '18px 16px',
  overflowY: 'auto',
  flexShrink: 0,
};

const secBox = {
  marginBottom: '14px',
  paddingBottom: '12px',
  borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
};

const lbl = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  color: '#1D1D1F',
  marginBottom: '6px',
};

const subLbl = {
  display: 'block',
  fontSize: '11px',
  color: '#6E6E73',
  marginBottom: '3px',
};

const inp = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: '8px',
  border: '1px solid #D2D2D7',
  fontSize: '13px',
  color: '#1D1D1F',
  backgroundColor: '#FFFFFF',
  outline: 'none',
};

const colorPicker = {
  width: '32px',
  height: '32px',
  border: '1px solid #D2D2D7',
  borderRadius: '6px',
  padding: 0,
  cursor: 'pointer',
  flexShrink: 0,
};

const iconBtn = {
  width: '30px',
  height: '30px',
  borderRadius: '8px',
  backgroundColor: '#F5F5F7',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#1D1D1F',
};
