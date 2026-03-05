import { MarkerType } from 'reactflow';
import type { GraphEdge } from './types';

export function styleEdge(edge: GraphEdge): GraphEdge {
  const kind = edge.data?.kind;

  const base: GraphEdge = {
    ...edge,
    style: { strokeWidth: 1.8, stroke: 'rgba(20,30,50,0.30)' },
    labelBgStyle: { fill: 'white', fillOpacity: 0.92, borderRadius: 6 },
    labelStyle: { fontSize: 11, fill: 'rgba(0,0,0,0.60)', fontWeight: 500 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: 'rgba(20,30,50,0.30)',
    },
  };

  if (kind === 'public_http') {
    base.style = { strokeWidth: 2.5, stroke: 'rgba(248,113,113,0.90)' };
    base.markerEnd = {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: 'rgba(248,113,113,0.90)',
    };
    base.animated = true;
  }

  if (kind === 'internal_api') {
    base.style = { strokeWidth: 2, stroke: 'rgba(59,130,246,0.65)' };
    base.markerEnd = {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: 'rgba(59,130,246,0.65)',
    };
  }

  if (kind === 'db') {
    base.style = { strokeWidth: 2.5, stroke: 'rgba(34,197,94,0.75)' };
    base.markerEnd = {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: 'rgba(34,197,94,0.75)',
    };
  }

  if (kind === 'attached') {
    base.style = {
      strokeWidth: 1.5,
      stroke: 'rgba(0,0,0,0.18)',
      strokeDasharray: '5 4',
    };
    base.markerEnd = undefined;
  }

  if (kind === 'ssh') {
    base.style = {
      strokeWidth: 2,
      stroke: 'rgba(0,0,0,0.35)',
      strokeDasharray: '6 6',
    };
  }

  if (kind === 'volume_attached') {
    base.style = { strokeWidth: 1.5, stroke: 'rgba(139,92,246,0.55)' };
    base.markerEnd = {
      type: MarkerType.ArrowClosed,
      width: 12,
      height: 12,
      color: 'rgba(139,92,246,0.55)',
    };
  }

  return base;
}
