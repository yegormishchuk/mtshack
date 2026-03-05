import { FileManagerPage } from '../filemanager/FileManagerPage';

interface ServerFileManagerProps {
  serverName: string;
  basePath: string;
}

export function ServerFileManager({ serverName, basePath }: ServerFileManagerProps) {
  return (
    <FileManagerPage
      serverId={serverName}
      initialRemotePath={basePath}
    />
  );
}
