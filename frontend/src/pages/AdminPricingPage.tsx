import { useEffect } from 'react';

import EstimatorAdminDashboard from '@estimator/app/admin/AdminDashboard';
import { useAuthStore } from '@estimator/store/authStore';

const AdminPricingPage = () => {
  useEffect(() => {
    useAuthStore.getState().syncFromMicrosite();
  }, []);

  return <EstimatorAdminDashboard embedded />;
};

export default AdminPricingPage;
