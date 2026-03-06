import { useState } from 'react';
import type { Project } from '../../domain/iaasTypes';
import { useProjectsStore } from '../../store/projectsStore';

interface Props {
  project: Project;
}

function generateS3Link(projectId: string): string {
  const timestamp = Date.now();
  const hash = Math.random().toString(36).slice(2, 10);
  return `https://s3.mtshack.by/terraform-configs/${projectId}/${timestamp}-${hash}/main.tf`;
}

export function ProjectTerraformTab({ project }: Props) {
  const addToast = useProjectsStore((s) => s.addToast);

  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const [shareLink, setShareLink] = useState('');
  const [sharing, setSharing] = useState(false);

  const handleImport = () => {
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setImportUrl('');
      addToast('Terraform-конфигурация успешно загружена в проект');
    }, 1200);
  };

  const handleShare = () => {
    setSharing(true);
    setTimeout(() => {
      setSharing(false);
      setShareLink(generateS3Link(project.id));
    }, 900);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, padding: '4px 0' }}>

      {/* Import section */}
      <div style={{
        background: '#fff',
        border: '1.5px solid #e5e7eb',
        borderRadius: 18,
        padding: '24px 24px 20px',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Загрузить конфигурацию</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 18 }}>
          Вставьте ссылку на Terraform-конфигурацию другого пользователя, чтобы импортировать её в этот проект.
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://s3.mtshack.by/terraform-configs/..."
            disabled={importing}
            onKeyDown={(e) => { if (e.key === 'Enter') handleImport(); }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 12,
              border: '1.5px solid #e5e7eb',
              fontSize: 13,
              fontFamily: 'monospace',
              outline: 'none',
              background: importing ? '#f9f9f9' : '#fff',
              color: '#111',
            }}
          />
          <button
            type="button"
            disabled={importing || !importUrl.trim()}
            onClick={handleImport}
            style={{
              padding: '0 22px',
              height: 42,
              borderRadius: 12,
              border: 'none',
              background: importing || !importUrl.trim() ? '#e5e7eb' : '#FF0023',
              color: importing || !importUrl.trim() ? '#9ca3af' : '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: importing || !importUrl.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {importing ? 'Загрузка…' : 'Загрузить'}
          </button>
        </div>
      </div>

      {/* Share section */}
      <div style={{
        background: '#fff',
        border: '1.5px solid #e5e7eb',
        borderRadius: 18,
        padding: '24px 24px 20px',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Поделиться конфигурацией</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 18 }}>
          Опубликуйте текущую Terraform-конфигурацию проекта в S3-хранилище и получите ссылку для передачи другому пользователю.
        </div>

        <button
          type="button"
          disabled={sharing}
          onClick={handleShare}
          style={{
            padding: '0 22px',
            height: 42,
            borderRadius: 12,
            border: 'none',
            background: sharing ? '#e5e7eb' : '#111',
            color: sharing ? '#9ca3af' : '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: sharing ? 'wait' : 'pointer',
            transition: 'all 0.15s',
            marginBottom: shareLink ? 16 : 0,
          }}
        >
          {sharing ? 'Публикация…' : 'Сгенерировать ссылку'}
        </button>

        {shareLink && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={shareLink}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 12,
                border: '1.5px solid #e5e7eb',
                fontSize: 12,
                fontFamily: 'monospace',
                background: '#f9fafb',
                color: '#374151',
                outline: 'none',
              }}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(shareLink);
                addToast('Ссылка скопирована в буфер обмена');
              }}
              style={{
                padding: '0 16px',
                height: 42,
                borderRadius: 12,
                border: '1.5px solid #e5e7eb',
                background: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: '#374151',
              }}
            >
              Копировать
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
