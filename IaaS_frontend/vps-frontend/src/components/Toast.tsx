import { useEffect } from 'react';
import { useProjectsStore } from '../store/projectsStore';
import './Toast.css';

export function Toast() {
  const toast = useProjectsStore((state) => state.toast);
  const clearToast = useProjectsStore((state) => state.clearToast);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => clearToast(), 2200);
    return () => window.clearTimeout(id);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="toast-root" role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}

