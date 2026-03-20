import { useEffect } from 'react';

import HomeClient from '@estimator/app/HomeClient';
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

  return <HomeClient />;
};

export default EstimatorPage;
