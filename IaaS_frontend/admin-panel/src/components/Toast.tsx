import { useEffect } from 'react';
import { useAdminStore } from '../store/adminStore';
import './Toast.css';

export function Toast() {
  const toast = useAdminStore((s) => s.toast);
  const clearToast = useAdminStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => clearToast(), 2400);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="admin-toast" key={toast.id}>
      {toast.message}
    </div>
  );
}
