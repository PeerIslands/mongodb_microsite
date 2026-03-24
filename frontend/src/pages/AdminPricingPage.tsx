import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import EstimatorAdminDashboard from '@estimator/app/admin/AdminDashboard';
import { useAuthStore } from '@estimator/store/authStore';

const AdminPricingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    useAuthStore.getState().syncFromMicrosite();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          style={{
            padding: '0.65rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ← Back to Content
        </button>
      </div>

      <EstimatorAdminDashboard embedded />
    </div>
  );
};

export default AdminPricingPage;
