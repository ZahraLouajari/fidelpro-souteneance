import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/DashboardLayout';
import ClientDashboard from '@/components/dashboards/ClientDashboard';
import RestaurantDashboard from '@/components/dashboards/RestaurantDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) return null;

  const renderContent = () => {
    switch (user.role) {
      case 'client': return <ClientDashboard tab={activeTab} />;
      case 'restaurant': return <RestaurantDashboard tab={activeTab} />;
      case 'admin': return <AdminDashboard tab={activeTab} />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
