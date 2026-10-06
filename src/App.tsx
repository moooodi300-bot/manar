import React, { useState, useEffect, useCallback } from 'react';
import { DatabaseState } from './types';
import { getInitialDatabase } from './data/initialData';
import { fetchDatabase } from './services/api';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeOverview } from './components/HomeOverview';
import { TodayNotebook } from './components/TodayNotebook';
import { DailyReportView } from './components/DailyReportView';
import { EquipmentCheckView } from './components/EquipmentCheckView';
import { PayrollView } from './components/PayrollView';
import { EmployeesView } from './components/EmployeesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PrintModal } from './components/PrintModals';
import { ActivityLogModal } from './components/ActivityLogModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Financial year starts at 2026-10-03
  const [currentDate, setCurrentDate] = useState<string>('2026-10-03');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeOperator, setActiveOperator] = useState<string>('محمد');
  const [db, setDb] = useState<DatabaseState>(getInitialDatabase());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);
  const [isAllActivitiesOpen, setIsAllActivitiesOpen] = useState<boolean>(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState<boolean>(false);
  const [isDailyReportModalOpen, setIsDailyReportModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDatabase();
      setDb(data);
      if (data.settings?.activeOperator) {
        setActiveOperator(data.settings.activeOperator);
      }
    } catch (err: any) {
      console.warn('API error, using active database state:', err);
      // If server api temporarily unreached, preserve db state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOperatorChange = (newOp: string) => {
    setActiveOperator(newOp);
    setDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, activeOperator: newOp },
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        activeOperator={activeOperator}
        onOperatorChange={handleOperatorChange}
        onRefresh={loadData}
        onOpenPrint={() => setIsPrintOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Tab 1: Home */}
        {activeTab === 'home' && (
          <HomeOverview
            db={db}
            currentDate={currentDate}
            onNavigateTab={setActiveTab}
            onOpenDailyReportModal={() => setActiveTab('reports')}
            onOpenAllActivitiesModal={() => setIsAllActivitiesOpen(true)}
          />
        )}

        {/* Tab 2: Today Notebook (دفتر اليوم) */}
        {activeTab === 'notebook' && (
          <TodayNotebook
            db={db}
            currentDate={currentDate}
            onRefresh={loadData}
            activeOperator={activeOperator}
          />
        )}

        {/* Tab 3: Employees */}
        {activeTab === 'employees' && (
          <EmployeesView
            db={db}
            onRefresh={loadData}
            activeOperator={activeOperator}
          />
        )}

        {/* Tab 4: Equipment */}
        {activeTab === 'equipment' && (
          <EquipmentCheckView
            db={db}
            currentDate={currentDate}
            onRefresh={loadData}
            activeOperator={activeOperator}
            onPrintA4={() => setIsPrintOpen(true)}
          />
        )}

        {/* Tab 5: Payroll */}
        {activeTab === 'payroll' && (
          <PayrollView
            db={db}
            onPrintA4={() => setIsPrintOpen(true)}
          />
        )}

        {/* Tab 6: Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <DailyReportView
              db={db}
              currentDate={currentDate}
              onRefresh={loadData}
              activeOperator={activeOperator}
              onPrintA4={() => setIsPrintOpen(true)}
            />
            <ReportsView
              db={db}
              currentDate={currentDate}
              onPrintA4={() => setIsPrintOpen(true)}
            />
          </div>
        )}

        {/* Tab 7: Settings */}
        {activeTab === 'settings' && (
          <SettingsView
            db={db}
            onRefresh={loadData}
            activeOperator={activeOperator}
            onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
          />
        )}
      </main>

      {/* iPad-Optimized Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Google Sheets Sync Modal */}
      {isGoogleSheetsOpen && (
        <GoogleSheetsSyncModal
          db={db}
          onClose={() => setIsGoogleSheetsOpen(false)}
          onRefresh={loadData}
        />
      )}

      {/* A4 Print Modal */}
      {isPrintOpen && (
        <PrintModal
          db={db}
          currentDate={currentDate}
          activeOperator={activeOperator}
          onClose={() => setIsPrintOpen(false)}
        />
      )}

      {/* Full Activity Log Modal */}
      {isAllActivitiesOpen && (
        <ActivityLogModal
          logs={db.activityLogs || []}
          onClose={() => setIsAllActivitiesOpen(false)}
        />
      )}
    </div>
  );
}
