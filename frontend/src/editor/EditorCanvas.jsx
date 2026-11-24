import React, { useState, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import DynamicPageRenderer from '../components/DynamicPageRenderer';
import { CONTAINER_TYPES } from '../utils/uiTreeHelpers';

const VIEWPORT_WIDTHS = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

export default function EditorCanvas({
  draftSchema,
  publicConfig,
  viewport,
  isPreviewOnly,
  selectedId,
  onSelectNode,
  dragSessionRef,
  onDropAction,
  onMoveStep,
  onDuplicateNode,
  onDeleteNode,
  onResizeNode,
}) {
  const [dropIndicator, setDropIndicator] = useState(null);
  const resizeStateRef = useRef(null);

  const parseDragPayload = (e) => {
    if (dragSessionRef?.current) {
      return dragSessionRef.current;
    }
    try {
      const raw = e.dataTransfer.getData('text/plain');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const startResize = (e, node, axis) => {
    e.stopPropagation();
    e.preventDefault();
    const wrapperEl = e.currentTarget.parentElement;
    if (!wrapperEl) return;

    const rect = wrapperEl.getBoundingClientRect();
    const parentRect = wrapperEl.parentElement?.getBoundingClientRect() || rect;

    resizeStateRef.current = {
      nodeId: node.id,
      axis,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      parentWidth: Math.max(1, parentRect.width),
    };

    const onMouseMove = (moveEvt) => {
      const st = resizeStateRef.current;
      if (!st) return;
      if (st.axis === 'width') {
        const deltaX = moveEvt.clientX - st.startX;
        const newPx = Math.max(120, Math.min(st.parentWidth, st.startWidth + deltaX));
        const pct = Math.round((newPx / st.parentWidth) * 100);
        onResizeNode(st.nodeId, { width: pct >= 98 ? '100%' : `${pct}%` });
      } else if (st.axis === 'height') {
        const deltaY = moveEvt.clientY - st.startY;
        const newHeight = Math.max(40, Math.round(st.startHeight + deltaY));
        onResizeNode(st.nodeId, { height: `${newHeight}px` });
      }
    };

    const onMouseUp = () => {
      resizeStateRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const renderEditWrapper = (node, innerContent) => {
    const isSelected = selectedId === node.id;
    const isContainer = CONTAINER_TYPES.has(node.type);
    const isDropTarget = dropIndicator?.targetId === node.id;

    return (
      <div
        key={node.id}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          const payload = { kind: 'MOVE_NODE', nodeId: node.id };
          if (dragSessionRef) dragSessionRef.current = payload;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', JSON.stringify(payload));
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const relY = e.clientY - rect.top;
          let pos = 'after';
          if (isContainer && relY > rect.height * 0.25 && relY < rect.height * 0.75) {
            pos = 'inside';
          } else if (relY < rect.height * 0.5) {
            pos = 'before';
          }
          setDropIndicator({ targetId: node.id, position: pos });
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const dragData = parseDragPayload(e);
          const pos = dropIndicator?.targetId === node.id ? dropIndicator.position : 'after';
          setDropIndicator(null);
          if (dragSessionRef) dragSessionRef.current = null;
          if (dragData) {
            onDropAction(dragData, node.id, pos);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectNode(node.id);
        }}
        style={{
          position: 'relative',
          outline: isSelected
            ? '2px solid #0071E3'
            : isDropTarget && dropIndicator.position === 'inside'
            ? '2px dashed #0071E3'
            : '1px dashed transparent',
          outlineOffset: '2px',
          borderRadius: '8px',
          transition: 'outline 120ms ease',
          cursor: 'pointer',
        }}
      >
        {isDropTarget && dropIndicator.position === 'before' && (
          <div
            style={{
              height: '4px',
              backgroundColor: '#0071E3',
              borderRadius: '4px',
              marginBottom: '6px',
            }}
          />
        )}

        {isSelected && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '-30px',
              right: '4px',
              zIndex: 30,
              backgroundColor: '#0071E3',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 4px 12px rgba(0, 113, 227, 0.35)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <span style={{ padding: '0 6px' }}>{node.type}</span>
            <button type="button" title="위로 이동" onClick={() => onMoveStep(node.id, 'up')} style={miniToolBtn}>
              <ArrowUp size={13} />
            </button>
            <button type="button" title="아래로 이동" onClick={() => onMoveStep(node.id, 'down')} style={miniToolBtn}>
              <ArrowDown size={13} />
            </button>
            <button type="button" title="컴포넌트 복제" onClick={() => onDuplicateNode(node.id)} style={miniToolBtn}>
              <Copy size={13} />
            </button>
            <button type="button" title="컴포넌트 삭제" onClick={() => onDeleteNode(node.id)} style={{ ...miniToolBtn, backgroundColor: 'rgba(255,59,48,0.85)' }}>
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {innerContent}

        {isSelected && (
          <div
            onMouseDown={(e) => startResize(e, node, 'width')}
            title="드래그하여 너비 조절"
            style={{
              position: 'absolute',
              right: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '10px',
              height: '28px',
              backgroundColor: '#FFFFFF',
              border: '2px solid #0071E3',
              borderRadius: '6px',
              cursor: 'ew-resize',
              zIndex: 25,
            }}
          />
        )}

        {isSelected && (
          <div
            onMouseDown={(e) => startResize(e, node, 'height')}
            title="드래그하여 높이 조절"
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '28px',
              height: '10px',
              backgroundColor: '#FFFFFF',
              border: '2px solid #0071E3',
              borderRadius: '6px',
              cursor: 'ns-resize',
              zIndex: 25,
            }}
          />
        )}

        {isDropTarget && dropIndicator.position === 'after' && (
          <div
            style={{
              height: '4px',
              backgroundColor: '#0071E3',
              borderRadius: '4px',
              marginTop: '6px',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      onClick={() => onSelectNode(null)}
      style={{
        flex: 1,
        backgroundColor: '#E8E8ED',
        padding: '28px 20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dragData = parseDragPayload(e);
          setDropIndicator(null);
          if (dragSessionRef) dragSessionRef.current = null;
          if (dragData) {
            onDropAction(dragData, null, 'after');
          }
        }}
        style={{
          width: VIEWPORT_WIDTHS[viewport] || '100%',
          maxWidth: '100%',
          minHeight: '720px',
          backgroundColor: draftSchema?.globalStyles?.backgroundColor || '#F5F5F7',
          borderRadius: viewport === 'desktop' ? '14px' : '28px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
          border: viewport === 'desktop' ? '1px solid rgba(0,0,0,0.08)' : '6px solid #1D1D1F',
          transition: 'width 240ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          overflow: 'hidden',
        }}
      >
        <DynamicPageRenderer
          schema={draftSchema}
          publicConfig={publicConfig}
          mode={isPreviewOnly ? 'view' : 'edit'}
          renderEditWrapper={isPreviewOnly ? undefined : renderEditWrapper}
        />

        {!isPreviewOnly && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const dragData = parseDragPayload(e);
              setDropIndicator(null);
              if (dragSessionRef) dragSessionRef.current = null;
              if (dragData) {
                onDropAction(dragData, null, 'after');
              }
            }}
            style={{
              maxWidth: '1000px',
              margin: '0 auto 36px',
              padding: '22px',
              border: '2px dashed #C7C7CC',
              borderRadius: '16px',
              textAlign: 'center',
              color: '#6E6E73',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <PlusCircle size={17} color="#0071E3" />
            <span>좌측 컴포넌트 패널에서 요소를 끌어다 놓으면 이 위치에 추가됩니다</span>
          </div>
        )}
      </div>
    </div>
  );
}

const miniToolBtn = {
  backgroundColor: 'rgba(255,255,255,0.18)',
  color: '#FFFFFF',
  borderRadius: '5px',
  padding: '3px 5px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};
