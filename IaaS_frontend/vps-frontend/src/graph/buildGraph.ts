import type { ProjectResources, VM } from '../domain/iaasTypes';
import type { GraphNode, GraphEdge } from './types';

export function buildGraph(resources: ProjectResources): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const { vms, networks, volumes } = resources;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  nodes.push({
    id: 'internet',
    type: 'internet',
    position: { x: 80, y: 200 },
    data: { label: 'Internet' },
  });

  for (const net of networks) {
    nodes.push({
      id: net.id,
      type: 'network',
      position: { x: 520, y: 420 },
      data: { network: net },
    });
  }

  for (const vm of vms) {
    nodes.push({
      id: vm.id,
      type: 'vm',
      position: { x: 520, y: 200 },
      data: { vm },
    });

    if (vm.networkId) {
      edges.push({
        id: `e-${vm.id}-net-${vm.networkId}`,
        source: vm.id,
        target: vm.networkId,
        type: 'smoothstep',
        data: { kind: 'attached', label: 'private' },
        animated: false,
      });
    }

    if (vm.publicIp) {
      const port = guessPublicPort(vm);
      edges.push({
        id: `e-internet-${vm.id}`,
        source: 'internet',
        target: vm.id,
        type: 'smoothstep',
        data: {
          kind: 'public_http',
          port,
          protocol: 'tcp',
          label:
            port === 443
              ? 'HTTPS :443'
              : port
                ? `PORT :${port}`
                : 'Public',
        },
        animated: true,
      });
    }
  }

  for (const vol of volumes) {
    if (!vol.attachedToVmId) continue;

    nodes.push({
      id: vol.id,
      type: 'volume',
      position: { x: 860, y: 420 },
      data: { volume: vol },
    });
    edges.push({
      id: `e-${vol.id}-${vol.attachedToVmId}`,
      source: vol.attachedToVmId,
      target: vol.id,
      type: 'smoothstep',
      data: { kind: 'volume_attached', label: `${vol.sizeGB}GB` },
    });
  }

  const frontend = vms.find((x) => x.role === 'frontend');
  const backend = vms.find((x) => x.role === 'backend');
  const db = vms.find((x) => x.role === 'db');

  if (frontend && backend) {
    edges.push({
      id: `e-${frontend.id}-${backend.id}-api`,
      source: frontend.id,
      target: backend.id,
      type: 'smoothstep',
      data: { kind: 'internal_api', port: 8000, protocol: 'tcp', label: 'API :8000' },
    });
  }

  if (backend && db) {
    edges.push({
      id: `e-${backend.id}-${db.id}-db`,
      source: backend.id,
      target: db.id,
      type: 'smoothstep',
      data: { kind: 'db', port: 5432, protocol: 'tcp', label: 'Postgres :5432' },
    });
  }

  applyLayout(nodes, vms, networks);

  return { nodes, edges };
}

function guessPublicPort(vm: VM): number | undefined {
  if (vm.portsOpen.includes(443)) return 443;
  if (vm.portsOpen.includes(80)) return 80;
  const cand = vm.portsOpen.find((p) => p === 22 || p === 8000 || p === 3000);
  return cand ?? undefined;
}

function applyLayout(
  nodes: { id: string; type: string; position: { x: number; y: number } }[],
  vms: VM[],
  networks: { id: string }[]
) {
  const internetNode = nodes.find((n) => n.id === 'internet');
  if (internetNode) internetNode.position = { x: 60, y: 240 };

  const publicVms = vms.filter((v) => v.publicIp);
  const privateVms = vms.filter((v) => !v.publicIp);

  let py = 80;
  for (const vm of publicVms) {
    const n = nodes.find((x) => x.id === vm.id);
    if (n) {
      n.position = { x: 320, y: py };
      py += 160;
    }
  }

  let vy = 80;
  for (const vm of privateVms) {
    const n = nodes.find((x) => x.id === vm.id);
    if (n) {
      n.position = { x: 600, y: vy };
      vy += 160;
    }
  }

  const maxVmY = Math.max(py, vy);

  let ny = maxVmY + 40;
  for (const net of networks) {
    const n = nodes.find((x) => x.id === net.id);
    if (n) {
      n.position = { x: 440, y: ny };
      ny += 120;
    }
  }

  let volY = 80;
  for (const n of nodes.filter((x) => x.type === 'volume')) {
    n.position = { x: 880, y: volY };
    volY += 120;
  }
}
