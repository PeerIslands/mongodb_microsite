import { useState } from 'react';
import '@/styles/pages/AdminDashboardPage.css';
import {
  CaseStudyList,
  CaseStudyForm,
  AcceleratorList,
  AcceleratorForm,
  AnalyticsDashboard,
} from '@/features/admin/components';

type MainView = 'cases' | 'accelerators' | 'analytics';
type SubView = 'list' | 'add' | 'edit';

const AdminDashboard = () => {
  const [mainView, setMainView] = useState<MainView>('cases');
  const [caseView, setCaseView] = useState<SubView>('list');
  const [accView, setAccView] = useState<SubView>('list');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);

  // Case Study handlers
  const handleCaseAddNew = () => {
    setEditingCaseId(null);
    setCaseView('add');
  };

  const handleCaseEdit = (id: string) => {
    setEditingCaseId(id);
    setCaseView('edit');
  };

  const handleCaseBackToList = () => {
    setCaseView('list');
    setEditingCaseId(null);
  };

  // Accelerator handlers
  const handleAccAddNew = () => {
    setEditingAccId(null);
    setAccView('add');
  };

  const handleAccEdit = (id: string) => {
    setEditingAccId(id);
    setAccView('edit');
  };

  const handleAccBackToList = () => {
    setAccView('list');
    setEditingAccId(null);
  };

  // Main view change
  const handleMainViewChange = (view: MainView) => {
    setMainView(view);
    if (view === 'cases') {
      setCaseView('list');
      setEditingCaseId(null);
    } else if (view === 'accelerators') {
      setAccView('list');
      setEditingAccId(null);
    }
  };

  return (
    <div className="admin-dashboard">
        {/* Main Navigation */}
        <div className="main-navigation">
          <button
            className={`main-nav-tab ${mainView === 'cases' ? 'active' : ''}`}
            onClick={() => handleMainViewChange('cases')}
          >
            Case Studies
          </button>
          <button
            className={`main-nav-tab ${mainView === 'accelerators' ? 'active' : ''}`}
            onClick={() => handleMainViewChange('accelerators')}
          >
            Accelerators
          </button>
          <button
            className={`main-nav-tab ${mainView === 'analytics' ? 'active' : ''}`}
            onClick={() => handleMainViewChange('analytics')}
          >
            Analytics
          </button>
        </div>

        {/* Content */}
        {mainView === 'cases' && (
          <>
            {caseView === 'list' && (
              <CaseStudyList onAddNew={handleCaseAddNew} onEdit={handleCaseEdit} />
            )}
            {(caseView === 'add' || caseView === 'edit') && (
              <CaseStudyForm 
                editingId={editingCaseId} 
                onCancel={handleCaseBackToList}
                onSuccess={handleCaseBackToList}
              />
            )}
          </>
        )}
        
        {mainView === 'accelerators' && (
          <>
            {accView === 'list' && (
              <AcceleratorList onAddNew={handleAccAddNew} onEdit={handleAccEdit} />
            )}
            {(accView === 'add' || accView === 'edit') && (
              <AcceleratorForm 
                editingId={editingAccId} 
                onCancel={handleAccBackToList}
                onSuccess={handleAccBackToList}
              />
            )}
          </>
        )}
        
        {mainView === 'analytics' && <AnalyticsDashboard />}
      </div>
  );
};

export default AdminDashboard;

