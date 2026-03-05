// ── File kinds ───────────────────────────────────────────────────
export type FileKind =
  | 'folder'
  | 'text'
  | 'image'
  | 'json'
  | 'log'
  | 'env'
  | 'code'
  | 'archive'
  | 'binary';

// ── Core file item ───────────────────────────────────────────────
export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number; // bytes; -1 for directories
  modified: string; // ISO date string
  isDirectory: boolean;
  kind: FileKind;
  permissions?: string;
  owner?: string;
}

export interface LocalFileItem extends FileItem {
  rawFile?: File; // present for real local files
}

export interface RemoteItem extends FileItem {
  serverId: string;
}

// ── Directory tree node ──────────────────────────────────────────
export interface TreeNode {
  label: string;
  path: string;
  children: TreeNode[];
  isOpen?: boolean;
}

// ── Upload ───────────────────────────────────────────────────────
export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error' | 'cancelled';

export interface UploadTask {
  id: string;
  name: string;
  size: number;
  uploaded: number;
  speed: number; // bytes/sec
  status: UploadStatus;
  error?: string;
  startedAt?: number;
}

export interface UploadManifestItem {
  relativePath: string;
  size: number;
}

export interface UploadManifest {
  items: UploadManifestItem[];
  totalSize: number;
}

// ── Policy ───────────────────────────────────────────────────────
export type PolicyDecisionType = 'ALLOW' | 'WARN' | 'DENY';

export interface PolicyDecision {
  file: LocalFileItem;
  decision: PolicyDecisionType;
  reason: string;
  riskScore: number; // 0–100
  excluded: boolean; // user manually excluded
}

// ── Sort / View ──────────────────────────────────────────────────
export type SortField = 'name' | 'size' | 'modified';
export type SortDir = 'asc' | 'desc';
export type ViewMode = 'list' | 'grid';

// ── Remote API contract ──────────────────────────────────────────
export interface RemoteApiInterface {
  listRemote(serverId: string, path: string): Promise<RemoteItem[]>;
  previewRemote(serverId: string, path: string, offset: number, limit: number): Promise<string>;
  mkdirRemote(serverId: string, path: string): Promise<void>;
  renameRemote(serverId: string, oldPath: string, newPath: string): Promise<void>;
  deleteRemote(serverId: string, paths: string[]): Promise<void>;
  downloadRemote(serverId: string, path: string): Promise<Blob>;
  uploadInit(serverId: string, targetPath: string, manifest: UploadManifest): Promise<string>;
  uploadChunk(uploadId: string, data: Blob, chunkIndex: number): Promise<void>;
  uploadCommit(uploadId: string): Promise<void>;
}
