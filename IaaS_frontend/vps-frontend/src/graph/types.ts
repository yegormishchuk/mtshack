import type { Node, Edge } from 'reactflow';
import type { VM, Network, Volume } from '../domain/iaasTypes';

export type GraphNodeType = 'internet' | 'vm' | 'network' | 'volume' | 'publicIp';

export interface InternetNodeData {
  label: 'Internet';
}

export interface VmNodeData {
  vm: VM;
}

export interface NetworkNodeData {
  network: Network;
}

export interface VolumeNodeData {
  volume: Volume;
}

export interface PublicIpNodeData {
  ip: string;
  attachedVmId: string;
}

export type GraphNodeData =
  | InternetNodeData
  | VmNodeData
  | NetworkNodeData
  | VolumeNodeData
  | PublicIpNodeData;

export type GraphNode = Node<GraphNodeData> & {
  type: GraphNodeType;
};

export type EdgeKind =
  | 'public_http'
  | 'internal_api'
  | 'db'
  | 'ssh'
  | 'attached'
  | 'volume_attached';

export interface GraphEdgeData {
  kind: EdgeKind;
  label?: string;
  port?: number;
  protocol?: 'tcp' | 'udp';
}

export type GraphEdge = Edge<GraphEdgeData>;
