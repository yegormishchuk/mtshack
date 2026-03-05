import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { IaaSPage } from './pages/IaaSPage';
import { BuildPage } from './pages/BuildPage';
import { ServersPage } from './pages/ServersPage';
import { ServerDetailPage } from './pages/ServerDetailPage';
import { BillingPage } from './pages/BillingPage';
import { AccountPage } from './pages/AccountPage';
import { SshKeysPage } from './pages/SshKeysPage';
import { ProjectWizardPage } from './pages/projects/ProjectWizardPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { AssistantWidget } from './assistant/components/AssistantWidget';

export default function App() {
  return (
    <>
    <Layout>
      <Routes>
        <Route path="/" element={<IaaSPage />} />
        <Route path="/build" element={<BuildPage />} />
        <Route path="/projects" element={<Navigate to="/servers?view=projects" replace />} />
        <Route path="/projects/new" element={<ProjectWizardPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/servers" element={<ServersPage />} />
        <Route path="/servers/:vmId" element={<ServerDetailPage />} />
        <Route path="/billing/*" element={<BillingPage />} />
        <Route path="/ssh-keys" element={<SshKeysPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/servers" replace />} />
      </Routes>
    </Layout>
    <AssistantWidget />
    </>
  );
}

