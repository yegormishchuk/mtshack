import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { VirtualMachines } from './pages/VirtualMachines';
import { CreateVM } from './pages/CreateVM';
import { Storage } from './pages/Storage';
import { Network } from './pages/Network';
import { Billing } from './pages/Billing';
import { Monitoring } from './pages/Monitoring';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/compute/vms" element={<VirtualMachines />} />
        <Route path="/compute/vms/create" element={<CreateVM />} />
        <Route path="/storage" element={<Storage />} />
        <Route path="/network" element={<Network />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
