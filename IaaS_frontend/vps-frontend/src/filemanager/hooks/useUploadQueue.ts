import { useCallback, useRef, useState } from 'react';
import { mockApi } from '../api';
import type { LocalFileItem, UploadTask } from '../types';

let _taskId = 1;
const uid = () => `task-${_taskId++}`;

const CHUNK_SIZE = 512 * 1024; // 512 KB

export interface UseUploadQueueReturn {
  tasks: UploadTask[];
  enqueue: (files: LocalFileItem[], serverId: string, targetPath: string) => Promise<void>;
  cancel: (taskId: string) => void;
  clearCompleted: () => void;
}

export function useUploadQueue(): UseUploadQueueReturn {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const cancelledRef = useRef<Set<string>>(new Set());

  const updateTask = useCallback((id: string, patch: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const enqueue = useCallback(
    async (files: LocalFileItem[], serverId: string, targetPath: string) => {
      const newTasks: UploadTask[] = files.map((f) => ({
        id: uid(),
        name: f.name,
        size: f.rawFile?.size ?? f.size,
        uploaded: 0,
        speed: 0,
        status: 'pending',
      }));

      setTasks((prev) => [...prev, ...newTasks]);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const task = newTasks[i];

        if (cancelledRef.current.has(task.id)) {
          updateTask(task.id, { status: 'cancelled' });
          continue;
        }

        const raw = file.rawFile ?? new Blob([`mock content of ${file.name}`]);
        const manifest = {
          items: [{ relativePath: file.name, size: raw.size }],
          totalSize: raw.size,
        };

        try {
          const uploadId = await mockApi.uploadInit(serverId, targetPath, manifest);
          updateTask(task.id, { status: 'uploading', startedAt: Date.now() });

          const totalChunks = Math.ceil(raw.size / CHUNK_SIZE);
          let uploadedBytes = 0;
          let lastTs = Date.now();
          let lastBytes = 0;

          for (let ci = 0; ci < totalChunks; ci++) {
            if (cancelledRef.current.has(task.id)) {
              updateTask(task.id, { status: 'cancelled' });
              break;
            }

            const chunk = raw.slice(ci * CHUNK_SIZE, (ci + 1) * CHUNK_SIZE);
            await mockApi.uploadChunk(uploadId, chunk, ci);

            uploadedBytes += chunk.size;
            const now = Date.now();
            const dt = (now - lastTs) / 1000;
            const speed = dt > 0 ? (uploadedBytes - lastBytes) / dt : 0;
            lastTs = now;
            lastBytes = uploadedBytes;

            updateTask(task.id, { uploaded: uploadedBytes, speed });
          }

          if (!cancelledRef.current.has(task.id)) {
            await mockApi.uploadCommit(uploadId);
            updateTask(task.id, {
              status: 'done',
              uploaded: raw.size,
              speed: 0,
            });
          }
        } catch (e) {
          updateTask(task.id, { status: 'error', error: String(e) });
        }
      }
    },
    [updateTask]
  );

  const cancel = useCallback(
    (taskId: string) => {
      cancelledRef.current.add(taskId);
      updateTask(taskId, { status: 'cancelled' });
    },
    [updateTask]
  );

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === 'uploading' || t.status === 'pending'));
  }, []);

  return { tasks, enqueue, cancel, clearCompleted };
}
