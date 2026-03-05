import { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { ProjectResources } from '../domain/iaasTypes';
import { buildGraph } from './buildGraph';
import { styleEdge } from './styleEdge';
import { InternetNode } from './nodes/InternetNode';
import { VmNode } from './nodes/VmNode';
import { NetworkNode } from './nodes/NetworkNode';
import { VolumeNode } from './nodes/VolumeNode';

const NODE_TYPES = {
  internet: InternetNode,
  vm: VmNode,
  network: NetworkNode,
  volume: VolumeNode,
} as const;

interface ProjectGraphProps {
  resources: ProjectResources;
  onVmClick?: (vmId: string) => void;
  showStorage?: boolean;
}

export function ProjectGraph({
  resources,
  onVmClick,
  showStorage = false,
}: ProjectGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const filtered: ProjectResources = showStorage
      ? resources
      : { ...resources, volumes: [] };
    const g = buildGraph(filtered);
    return { nodes: g.nodes, edges: g.edges.map(styleEdge) };
  }, [resources, showStorage]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'vm' && onVmClick) {
        onVmClick(node.id);
      }
    },
    [onVmClick]
  );

  return (
    <div
      style={{
        position: 'relative',
        height: 560,
        borderRadius: 28,
        overflow: 'hidden',
        background: '#F6F7FB',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.08)',
      }}
    >
      {/* Zone labels overlay */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            bottom: 12,
            width: '46%',
            borderRadius: 22,
            background: 'rgba(248,113,113,0.04)',
            border: '1px dashed rgba(248,113,113,0.25)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            bottom: 12,
            width: '46%',
            borderRadius: 22,
            background: 'rgba(0,0,0,0.025)',
            border: '1px dashed rgba(0,0,0,0.08)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 26,
            top: 22,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.10em',
            color: 'rgba(248,113,113,0.75)',
            textTransform: 'uppercase',
          }}
        >
          Public Zone
        </span>
        <span
          style={{
            position: 'absolute',
            right: 26,
            top: 22,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.10em',
            color: 'rgba(0,0,0,0.35)',
            textTransform: 'uppercase',
          }}
        >
          Private Zone
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        panOnScroll
        zoomOnScroll
        panOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} size={1} color="rgba(0,0,0,0.045)" />
        <Controls
          style={{
            bottom: 16,
            left: 16,
            top: 'auto',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          }}
        />
        <MiniMap
          nodeStrokeColor={() => 'rgba(0,0,0,0.10)'}
          nodeColor={() => '#ffffff'}
          nodeBorderRadius={6}
          style={{
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          }}
        />
      </ReactFlow>
    </div>
  );
}
