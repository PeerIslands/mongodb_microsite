import { useEffect } from 'react';

import MigrationTypeWrapper from '@estimator/components/migration-wrapper/MigrationTypeWrapper';
import { useAuthStore } from '@estimator/store/authStore';

const EstimatorPage = () => {
  useEffect(() => {
    const sync = () => {
      useAuthStore.getState().syncFromMicrosite();
    };

    sync();
    window.addEventListener('token-expired', sync);

    return () => {
      window.removeEventListener('token-expired', sync);
    };
  }, []);

  return <MigrationTypeWrapper />;
};

export default EstimatorPage;
