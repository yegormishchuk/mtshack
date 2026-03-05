import { useLocalFs } from './hooks/useLocalFs';
import { useRemoteFs } from './hooks/useRemoteFs';
import { useUploadQueue } from './hooks/useUploadQueue';
import { LocalPanel, RemotePanel, useUploadTrigger } from './components/Panel';
import { OperationsBar } from './components/OperationsBar';
import type { LocalFileItem } from './types';
import './FileManager.css';

interface FileManagerPageProps {
  serverId: string;
  initialRemotePath?: string;
}

export function FileManagerPage({
  serverId,
  initialRemotePath = '/home/ubuntu',
}: FileManagerPageProps) {
  const localFs = useLocalFs();
  const remoteFs = useRemoteFs(serverId, initialRemotePath);
  const queue = useUploadQueue();
  const drag = useUploadTrigger();

  const handleUploadFiles = async (files: LocalFileItem[], targetPath: string) => {
    await queue.enqueue(files, serverId, targetPath);
    void remoteFs.refresh();
  };

  return (
    <div className="fm-root">
      <div className="fm-panels">
        <LocalPanel
          fs={localFs}
          onDragStart={drag.setDraggedFiles}
        />
        <div className="fm-panels-divider" />
        <RemotePanel
          fs={remoteFs}
          serverId={serverId}
          onUploadFiles={handleUploadFiles}
          draggedFiles={drag.draggedFiles}
          onClearDrag={drag.clearDrag}
        />
      </div>
      <OperationsBar
        tasks={queue.tasks}
        onCancel={queue.cancel}
        onClearCompleted={queue.clearCompleted}
      />
    </div>
  );
}
