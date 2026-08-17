import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { LeadsPage } from './pages/LeadsPage';
import { PipelinePage } from './pages/PipelinePage';
import { ScoringRulesPage } from './pages/ScoringRulesPage';
import { FilterStudioPage } from './pages/FilterStudioPage';
import { DuplicatesPage } from './pages/DuplicatesPage';
import { ImportPage } from './pages/ImportPage';
import { TasksPage } from './pages/TasksPage';
import { SettingsPage } from './pages/SettingsPage';
import { AnalyticsSummary } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const fetchAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDuplicateCount = async () => {
    try {
      const dups = await api.getDuplicates();
      setDuplicateCount(dups.length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshAll = () => {
    fetchAnalytics();
    fetchDuplicateCount();
  };

  useEffect(() => {
    fetchAnalytics();
    fetchDuplicateCount();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onSearchChange={(q) => {
          if (q.trim() && activeTab !== 'leads') {
            setActiveTab('leads');
          }
        }}
        onRefreshAll={handleRefreshAll}
        activeTab={activeTab}
      />

      <div className="flex-1 flex">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hotLeadsCount={analytics?.kpis.hot_leads}
          duplicateCount={duplicateCount}
        />

        <main className="flex-1 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <Dashboard
              analytics={analytics}
              onNavigateToLeads={(statusFilter) => {
                setActiveTab('leads');
              }}
            />
          )}
          {activeTab === 'leads' && <LeadsPage />}
          {activeTab === 'pipeline' && <PipelinePage />}
          {activeTab === 'scoring-rules' && <ScoringRulesPage />}
          {activeTab === 'filter-studio' && <FilterStudioPage />}
          {activeTab === 'duplicates' && <DuplicatesPage />}
          {activeTab === 'import' && <ImportPage />}
          {activeTab === 'tasks' && <TasksPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
