export const CONTAINER_TYPES = new Set(['container', 'card', 'columns_2', 'columns_3']);

export const COMPONENT_DEFINITIONS = [
  {
    type: 'heading',
    label: '제목',
    group: '기본 UI 요소',
    defaultProps: {
      text: '새 섹션 제목을 입력하세요',
      fontSize: 28,
      fontWeight: '700',
      color: '#1D1D1F',
      alignment: 'left',
      width: '100%',
      padding: '4px 0px',
      marginTop: 0,
      marginBottom: 12,
      visible: true,
    },
  },
  {
    type: 'text',
    label: '일반 텍스트',
    group: '기본 UI 요소',
    defaultProps: {
      text: '학생들에게 전달할 안내 문구나 설명을 자유롭게 작성할 수 있습니다.',
      fontSize: 15,
      fontWeight: '400',
      color: '#424245',
      alignment: 'left',
      width: '100%',
      padding: '4px 0px',
      marginTop: 0,
      marginBottom: 12,
      visible: true,
    },
  },
  {
    type: 'button',
    label: '버튼',
    group: '기본 UI 요소',
    defaultProps: {
      text: '자세히 보기',
      backgroundColor: '#1D1D1F',
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
      borderRadius: 980,
      padding: '12px 24px',
      alignment: 'center',
      actionType: 'OPEN_APPLY_MODAL',
      linkUrl: '',
      marginTop: 8,
      marginBottom: 16,
      visible: true,
    },
  },
  {
    type: 'image',
    label: '이미지',
    group: '기본 UI 요소',
    defaultProps: {
      src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
      alt: '학교 상담실 안내 이미지',
      width: '100%',
      height: '240px',
      borderRadius: 16,
      alignment: 'center',
      marginTop: 0,
      marginBottom: 16,
      visible: true,
    },
  },
  {
    type: 'card',
    label: '카드',
    group: '기본 UI 요소',
    defaultProps: {
      backgroundColor: '#FFFFFF',
      padding: '24px',
      borderRadius: 18,
      border: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
      width: '100%',
      marginTop: 0,
      marginBottom: 16,
      visible: true,
    },
    children: [
      {
        type: 'heading',
        defaultProps: {
          text: '안내 카드 제목',
          fontSize: 18,
          fontWeight: '700',
          color: '#1D1D1F',
          alignment: 'left',
          marginBottom: 8,
          visible: true,
        },
      },
      {
        type: 'text',
        defaultProps: {
          text: '카드 내부에 원하는 텍스트나 버튼을 드래그하여 배치하세요.',
          fontSize: 14,
          color: '#6E6E73',
          alignment: 'left',
          marginBottom: 0,
          visible: true,
        },
      },
    ],
  },
  {
    type: 'divider',
    label: '구분선',
    group: '기본 UI 요소',
    defaultProps: {
      borderColor: '#E5E5EA',
      marginTop: 16,
      marginBottom: 16,
      visible: true,
    },
  },
  {
    type: 'input_field',
    label: '입력창',
    group: '기본 UI 요소',
    defaultProps: {
      label: '빠른 상담 신청 바로가기',
      placeholder: '이름을 입력하고 상담 신청을 시작하세요',
      buttonText: '신청 시작',
      backgroundColor: '#FFFFFF',
      borderColor: '#D2D2D7',
      borderRadius: 12,
      padding: '16px',
      marginTop: 0,
      marginBottom: 16,
      visible: true,
    },
  },
  {
    type: 'notice',
    label: '공지사항',
    group: '상담 전용 위젯',
    defaultProps: {
      title: '학교 상담실 공지사항',
      customText: '',
      backgroundColor: '#FFFFFF',
      borderColor: '#D2D2D7',
      accentColor: '#0071E3',
      borderRadius: 16,
      padding: '18px 24px',
      marginTop: 0,
      marginBottom: 20,
      visible: true,
    },
  },
  {
    type: 'stat_card',
    label: '통계 카드',
    group: '상담 전용 위젯',
    defaultProps: {
      title: '비밀 보장 원칙',
      statValue: '100%',
      description: '모든 상담 내용과 신청 사유는 철저히 보호됩니다.',
      backgroundColor: '#FFFFFF',
      accentColor: '#0071E3',
      borderRadius: 18,
      padding: '22px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
      marginTop: 0,
      marginBottom: 16,
      visible: true,
    },
  },
  {
    type: 'apply_button',
    label: '상담 신청 버튼',
    group: '상담 전용 위젯',
    defaultProps: {
      text: '지금 상담 신청하기',
      backgroundColor: '#0071E3',
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '600',
      borderRadius: 980,
      padding: '15px 34px',
      alignment: 'center',
      actionType: 'OPEN_APPLY_MODAL',
      marginTop: 8,
      marginBottom: 16,
      visible: true,
    },
  },
  {
    type: 'counseling_guide',
    label: '상담 신청 안내',
    group: '상담 전용 위젯',
    defaultProps: {
      guideType: 'operating_hours',
      title: '상담 가능 시간 및 운영 안내',
      customText: '',
      backgroundColor: '#FFFFFF',
      color: '#1D1D1F',
      borderRadius: 20,
      padding: '26px',
      boxShadow: '0 2px 14px rgba(0,0,0,0.03)',
      marginTop: 0,
      marginBottom: 20,
      visible: true,
    },
  },
  {
    type: 'container',
    label: '빈 컨테이너',
    group: '레이아웃 구조',
    defaultProps: {
      backgroundColor: '#FFFFFF',
      padding: '32px 24px',
      borderRadius: 20,
      border: '1px dashed #D2D2D7',
      width: '100%',
      minHeight: '120px',
      marginTop: 0,
      marginBottom: 20,
      visible: true,
    },
    children: [],
  },
  {
    type: 'columns_2',
    label: '2단 레이아웃',
    group: '레이아웃 구조',
    defaultProps: {
      gap: 20,
      padding: '0px',
      marginTop: 0,
      marginBottom: 20,
      visible: true,
    },
    children: [
      {
        type: 'card',
        defaultProps: {
          backgroundColor: '#FFFFFF',
          padding: '22px',
          borderRadius: 18,
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          visible: true,
        },
        children: [
          {
            type: 'heading',
            defaultProps: { text: '왼쪽 영역 제목', fontSize: 18, fontWeight: '700', marginBottom: 8, visible: true },
          },
          {
            type: 'text',
            defaultProps: { text: '이 영역에 요소를 드래그하거나 텍스트를 수정하세요.', fontSize: 14, color: '#6E6E73', visible: true },
          },
        ],
      },
      {
        type: 'card',
        defaultProps: {
          backgroundColor: '#FFFFFF',
          padding: '22px',
          borderRadius: 18,
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          visible: true,
        },
        children: [
          {
            type: 'heading',
            defaultProps: { text: '오른쪽 영역 제목', fontSize: 18, fontWeight: '700', marginBottom: 8, visible: true },
          },
          {
            type: 'text',
            defaultProps: { text: '이 영역에 요소를 드래그하거나 텍스트를 수정하세요.', fontSize: 14, color: '#6E6E73', visible: true },
          },
        ],
      },
    ],
  },
  {
    type: 'columns_3',
    label: '3단 레이아웃',
    group: '레이아웃 구조',
    defaultProps: {
      gap: 16,
      padding: '0px',
      marginTop: 0,
      marginBottom: 20,
      visible: true,
    },
    children: [0, 1, 2].map((idx) => ({
      type: 'stat_card',
      defaultProps: {
        title: `핵심 안내 ${idx + 1}`,
        statValue: `0${idx + 1}`,
        description: '세부 안내 문구를 입력하세요.',
        backgroundColor: '#FFFFFF',
        accentColor: '#0071E3',
        borderRadius: 18,
        padding: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        visible: true,
      },
    })),
  },
];

export function createNodeId(prefix = 'comp') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function instantiateComponent(type) {
  const def = COMPONENT_DEFINITIONS.find((d) => d.type === type);
  if (!def) {
    return {
      id: createNodeId(),
      type: 'text',
      props: { text: '새 요소', visible: true },
    };
  }

  const buildNode = (spec) => {
    const node = {
      id: createNodeId(spec.type),
      type: spec.type,
      props: JSON.parse(JSON.stringify(spec.defaultProps || {})),
    };
    if (Array.isArray(spec.children)) {
      node.children = spec.children.map((ch) => buildNode(ch));
    }
    return node;
  };

  return buildNode(def);
}

export function cloneNodeDeep(node) {
  const copy = {
    ...node,
    id: createNodeId(node.type),
    props: JSON.parse(JSON.stringify(node.props || {})),
  };
  if (Array.isArray(node.children)) {
    copy.children = node.children.map((ch) => cloneNodeDeep(ch));
  }
  return copy;
}

export function findNodeById(nodes, targetId) {
  if (!Array.isArray(nodes) || !targetId) return null;
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (Array.isArray(node.children)) {
      const found = findNodeById(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

export function updateNodePropsById(nodes, targetId, patchProps) {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return {
        ...node,
        props: { ...(node.props || {}), ...patchProps },
      };
    }
    if (Array.isArray(node.children)) {
      return {
        ...node,
        children: updateNodePropsById(node.children, targetId, patchProps),
      };
    }
    return node;
  });
}

export function deleteNodeById(nodes, targetId) {
  const next = [];
  for (const node of nodes) {
    if (node.id === targetId) continue;
    if (Array.isArray(node.children)) {
      next.push({
        ...node,
        children: deleteNodeById(node.children, targetId),
      });
    } else {
      next.push(node);
    }
  }
  return next;
}

export function duplicateNodeById(nodes, targetId) {
  const next = [];
  for (const node of nodes) {
    if (node.id === targetId) {
      next.push(node);
      next.push(cloneNodeDeep(node));
    } else if (Array.isArray(node.children)) {
      next.push({
        ...node,
        children: duplicateNodeById(node.children, targetId),
      });
    } else {
      next.push(node);
    }
  }
  return next;
}

export function moveNodeStepById(nodes, targetId, direction) {
  const idx = nodes.findIndex((n) => n.id === targetId);
  if (idx !== -1) {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= nodes.length) return nodes;
    const copy = [...nodes];
    [copy[idx], copy[swapIdx]] = [copy[swapIdx], copy[idx]];
    return copy;
  }
  return nodes.map((node) => {
    if (Array.isArray(node.children)) {
      return {
        ...node,
        children: moveNodeStepById(node.children, targetId, direction),
      };
    }
    return node;
  });
}

export function extractNodeById(nodes, targetId) {
  let extracted = null;
  const walk = (list) => {
    const res = [];
    for (const item of list) {
      if (item.id === targetId) {
        extracted = item;
        continue;
      }
      if (Array.isArray(item.children)) {
        res.push({ ...item, children: walk(item.children) });
      } else {
        res.push(item);
      }
    }
    return res;
  };
  const remaining = walk(nodes);
  return { remaining, extracted };
}

export function insertNodeRelative(nodes, newNode, targetId, position = 'after') {
  if (!targetId) {
    return [...nodes, newNode];
  }

  if (position === 'inside') {
    return nodes.map((node) => {
      if (node.id === targetId && CONTAINER_TYPES.has(node.type)) {
        return {
          ...node,
          children: [...(node.children || []), newNode],
        };
      }
      if (Array.isArray(node.children)) {
        return {
          ...node,
          children: insertNodeRelative(node.children, newNode, targetId, position),
        };
      }
      return node;
    });
  }

  const idx = nodes.findIndex((n) => n.id === targetId);
  if (idx !== -1) {
    const copy = [...nodes];
    const insertAt = position === 'before' ? idx : idx + 1;
    copy.splice(insertAt, 0, newNode);
    return copy;
  }

  return nodes.map((node) => {
    if (Array.isArray(node.children)) {
      return {
        ...node,
        children: insertNodeRelative(node.children, newNode, targetId, position),
      };
    }
    return node;
  });
}

function flattenIds(nodes, map = new Map()) {
  for (const n of nodes || []) {
    map.set(n.id, n);
    if (Array.isArray(n.children)) {
      flattenIds(n.children, map);
    }
  }
  return map;
}

export function computeSchemaDiff(publishedSchema, draftSchema) {
  const pubNodes = publishedSchema?.pages?.home?.components || [];
  const drfNodes = draftSchema?.pages?.home?.components || [];

  const pubMap = flattenIds(pubNodes);
  const drfMap = flattenIds(drfNodes);

  const added = [];
  const removed = [];
  const modified = [];

  for (const [id, node] of drfMap.entries()) {
    if (!pubMap.has(id)) {
      added.push(node);
    } else {
      const oldNode = pubMap.get(id);
      if (JSON.stringify(oldNode.props) !== JSON.stringify(node.props)) {
        modified.push(node);
      }
    }
  }

  for (const [id, node] of pubMap.entries()) {
    if (!drfMap.has(id)) {
      removed.push(node);
    }
  }

  const orderChanged =
    JSON.stringify(pubNodes.map((n) => n.id)) !== JSON.stringify(drfNodes.map((n) => n.id));

  return {
    added,
    removed,
    modified,
    orderChanged,
    hasChanges: added.length > 0 || removed.length > 0 || modified.length > 0 || orderChanged,
  };
}
