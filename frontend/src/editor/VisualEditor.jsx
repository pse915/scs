import React, { useState, useEffect, useRef } from 'react';
import {
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Save,
  Rocket,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import ComponentPalette from './ComponentPalette';
import EditorCanvas from './EditorCanvas';
import PropertyPanel from './PropertyPanel';
import PublishDiffModal from './PublishDiffModal';
import {
  instantiateComponent,
  findNodeById,
  updateNodePropsById,
  deleteNodeById,
  duplicateNodeById,
  moveNodeStepById,
  extractNodeById,
  insertNodeRelative,
} from '../utils/uiTreeHelpers';

export default function VisualEditor({
  initialDraftSchema,
  publishedSchema,
  publicConfig,
  onSaveDraft,
  onPublishConfig,
  onResetDefault,
  onExitEditor,
  isSubmitting,
}) {
  const [draftSchema, setDraftSchema] = useState(() =>
    JSON.parse(JSON.stringify(initialDraftSchema || publishedSchema || { version: 1, globalStyles: {}, pages: { home: { components: [] } } }))
  );
  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [viewport, setViewport] = useState('desktop');
  const [isPreviewOnly, setIsPreviewOnly] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const dragSessionRef = useRef(null);

  useEffect(() => {
    if (initialDraftSchema) {
      setDraftSchema(JSON.parse(JSON.stringify(initialDraftSchema)));
    }
  }, [initialDraftSchema]);

  const commitSchemaChange = (updaterFn) => {
    setDraftSchema((prev) => {
      const next = updaterFn(prev);
      setHistoryPast((p) => [...p.slice(-29), prev]);
      setHistoryFuture([]);
      return next;
    });
  };

  const handleUndo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((p) => p.slice(0, -1));
    setHistoryFuture((f) => [draftSchema, ...f]);
    setDraftSchema(previous);
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((f) => f.slice(1));
    setHistoryPast((p) => [...p, draftSchema]);
    setDraftSchema(next);
  };

  const handleDropAction = (dragData, targetId, position) => {
    if (!dragData) return;

    if (dragData.kind === 'NEW_COMPONENT') {
      const newNode = instantiateComponent(dragData.type);
      commitSchemaChange((prev) => ({
        ...prev,
        pages: {
          ...prev.pages,
          home: {
            ...prev.pages.home,
            components: insertNodeRelative(
              prev.pages.home.components || [],
              newNode,
              targetId,
              position
            ),
          },
        },
      }));
      setSelectedId(newNode.id);
    } else if (dragData.kind === 'MOVE_NODE' && dragData.nodeId) {
      if (dragData.nodeId === targetId) return;
      commitSchemaChange((prev) => {
        const currentList = prev.pages.home.components || [];
        const { remaining, extracted } = extractNodeById(currentList, dragData.nodeId);
        if (!extracted) return prev;
        const nextList = insertNodeRelative(remaining, extracted, targetId, position);
        return {
          ...prev,
          pages: {
            ...prev.pages,
            home: {
              ...prev.pages.home,
              components: nextList,
            },
          },
        };
      });
    }
  };

  const handleQuickAddComponent = (type) => {
    const newNode = instantiateComponent(type);
    commitSchemaChange((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          components: [...(prev.pages.home.components || []), newNode],
        },
      },
    }));
    setSelectedId(newNode.id);
  };

  const handleUpdateNodeProps = (nodeId, patchProps) => {
    commitSchemaChange((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          components: updateNodePropsById(prev.pages.home.components || [], nodeId, patchProps),
        },
      },
    }));
  };

  const handleUpdateGlobalStyles = (patchStyles) => {
    commitSchemaChange((prev) => ({
      ...prev,
      globalStyles: { ...(prev.globalStyles || {}), ...patchStyles },
    }));
  };

  const handleMoveStep = (nodeId, direction) => {
    commitSchemaChange((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          components: moveNodeStepById(prev.pages.home.components || [], nodeId, direction),
        },
      },
    }));
  };

  const handleDuplicateNode = (nodeId) => {
    commitSchemaChange((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          components: duplicateNodeById(prev.pages.home.components || [], nodeId),
        },
      },
    }));
  };

  const handleDeleteNode = (nodeId) => {
    commitSchemaChange((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          components: deleteNodeById(prev.pages.home.components || [], nodeId),
        },
      },
    }));
    if (selectedId === nodeId) setSelectedId(null);
  };

  const selectedNode = findNodeById(draftSchema?.pages?.home?.components || [], selectedId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#F5F5F7' }}>
      <header
        style={{
          height: '62px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={onExitEditor}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: '#F5F5F7',
              color: '#1D1D1F',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeft size={15} />
            <span>관리자 메뉴</span>
          </button>

          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1D1D1F' }}>
              시각적 홈페이지 빌더
            </div>
            <div style={{ fontSize: '11.5px', color: '#6E6E73' }}>
              드래그·크기 조절·속성 편집 후 '게시'를 누르면 학생 화면에 즉시 반영됩니다
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            disabled={historyPast.length === 0}
            onClick={handleUndo}
            title="실행 취소 (Undo)"
            style={toolbarIconBtn}
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            disabled={historyFuture.length === 0}
            onClick={handleRedo}
            title="다시 실행 (Redo)"
            style={toolbarIconBtn}
          >
            <Redo2 size={16} />
          </button>

          <div style={{ width: '1px', height: '20px', backgroundColor: '#E5E5EA', margin: '0 6px' }} />

          {[
            { id: 'desktop', label: '데스크톱', icon: Monitor },
            { id: 'tablet', label: '태블릿', icon: Tablet },
            { id: 'mobile', label: '모바일', icon: Smartphone },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewport(id)}
              style={{
                padding: '7px 11px',
                borderRadius: '8px',
                backgroundColor: viewport === id ? 'rgba(0, 113, 227, 0.1)' : 'transparent',
                color: viewport === id ? '#0071E3' : '#6E6E73',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}

          <div style={{ width: '1px', height: '20px', backgroundColor: '#E5E5EA', margin: '0 6px' }} />

          <button
            type="button"
            onClick={() => setIsPreviewOnly((v) => !v)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              backgroundColor: isPreviewOnly ? '#1D1D1F' : '#F5F5F7',
              color: isPreviewOnly ? '#FFFFFF' : '#1D1D1F',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Eye size={14} />
            <span>{isPreviewOnly ? '편집 모드로 복귀' : '미리보기'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (window.confirm('기본 템플릿 레이아웃으로 초기화하시겠습니까?')) {
                onResetDefault();
              }
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: '#F5F5F7',
              color: '#424245',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <RotateCcw size={14} />
            <span>기본값 초기화</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onSaveDraft(draftSchema)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: '#F5F5F7',
              color: '#0071E3',
              border: '1px solid rgba(0, 113, 227, 0.25)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Save size={14} />
            <span>임시 저장</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            disabled={isSubmitting}
            onClick={() => setIsPublishModalOpen(true)}
            style={{ borderRadius: '10px', padding: '8px 16px', fontSize: '13.5px' }}
          >
            <Rocket size={15} />
            <span>학생 화면에 게시</span>
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!isPreviewOnly && (
          <ComponentPalette
            onDragStartNew={(type) => {
              dragSessionRef.current = { kind: 'NEW_COMPONENT', type };
            }}
            onQuickAddComponent={handleQuickAddComponent}
          />
        )}

        <EditorCanvas
          draftSchema={draftSchema}
          publicConfig={publicConfig}
          viewport={viewport}
          isPreviewOnly={isPreviewOnly}
          selectedId={selectedId}
          onSelectNode={setSelectedId}
          dragSessionRef={dragSessionRef}
          onDropAction={handleDropAction}
          onMoveStep={handleMoveStep}
          onDuplicateNode={handleDuplicateNode}
          onDeleteNode={handleDeleteNode}
          onResizeNode={handleUpdateNodeProps}
        />

        {!isPreviewOnly && (
          <PropertyPanel
            selectedNode={selectedNode}
            globalStyles={draftSchema?.globalStyles}
            onUpdateNodeProps={handleUpdateNodeProps}
            onUpdateGlobalStyles={handleUpdateGlobalStyles}
            onDuplicateNode={handleDuplicateNode}
            onDeleteNode={handleDeleteNode}
          />
        )}
      </div>

      <PublishDiffModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        publishedSchema={publishedSchema}
        draftSchema={draftSchema}
        isSubmitting={isSubmitting}
        onConfirmPublish={() => {
          onPublishConfig(draftSchema);
          setIsPublishModalOpen(false);
        }}
      />
    </div>
  );
}

const toolbarIconBtn = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  backgroundColor: '#F5F5F7',
  color: '#1D1D1F',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};
