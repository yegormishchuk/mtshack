import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { InstancesPage } from './pages/InstancesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SnapshotsPage } from './pages/SnapshotsPage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/instances" element={<InstancesPage />} />
        <Route path="/snapshots" element={<SnapshotsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
