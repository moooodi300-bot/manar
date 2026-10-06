import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, logout, getAccessToken, initAuth } from '../services/googleAuth';
import {
  extractSpreadsheetId,
  listUserSpreadsheets,
  createLaundrySpreadsheet,
  syncDatabaseToGoogleSheet,
  SheetFile,
} from '../services/googleSheets';
import { DatabaseState } from '../types';
import { saveSettings } from '../services/api';
import {
  FileSpreadsheet,
  X,
  ExternalLink,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  LogOut,
  FolderOpen,
  ArrowRight,
  Database,
  CloudCheck,
} from 'lucide-react';

interface GoogleSheetsSyncModalProps {
  db: DatabaseState;
  onClose: () => void;
  onRefresh: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  db,
  onClose,
  onRefresh,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState<boolean>(false);
  const [isLoadingSheets, setIsLoadingSheets] = useState<boolean>(false);
  const [availableSheets, setAvailableSheets] = useState<SheetFile[]>([]);
  const [currentSheetUrl, setCurrentSheetUrl] = useState<string>(
    db.settings.googleSheetUrl || ''
  );
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAuthToken(token);
      },
      () => {
        setCurrentUser(null);
        setAuthToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch available spreadsheets from Google Drive when authenticated
  const handleLoadUserSheets = async () => {
    setIsLoadingSheets(true);
    try {
      const sheets = await listUserSpreadsheets();
      setAvailableSheets(sheets);
    } catch (err: any) {
      console.warn('Error fetching spreadsheets:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      handleLoadUserSheets();
    }
  }, [currentUser]);

  const handleLogin = async () => {
    setIsSigningIn(true);
    setSyncResult(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAuthToken(result.accessToken);
        setSyncResult({
          success: true,
          message: `مرحباً بك ${result.user.displayName || result.user.email}، تم الاتصال بحسابك بنجاح!`,
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'فشل تسجيل الدخول بحساب Google',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setAuthToken(null);
    setAvailableSheets([]);
    setSyncResult({ success: true, message: 'تم تسجيل الخروج من حساب Google' });
  };

  // Create brand new sheet with all tabs
  const handleCreateNewSheet = async () => {
    setIsCreatingSheet(true);
    setSyncResult(null);
    try {
      const { spreadsheetId, spreadsheetUrl } = await createLaundrySpreadsheet();
      setCurrentSheetUrl(spreadsheetUrl);

      // Save to settings
      await saveSettings({
        googleSheetUrl: spreadsheetUrl,
        googleSheetConnected: true,
      });

      // Synchronize initial data
      await syncDatabaseToGoogleSheet(spreadsheetId, db);

      setSyncResult({
        success: true,
        message: '✓ تم إنشاء جدول Google Sheet جديد ومزامنة جميع البيانات بنجاح!',
      });
      onRefresh();
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'فشل إنشاء الجدول الجديد',
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Synchronize to selected or saved sheet with explicit confirmation
  const handleStartSyncWithConfirmation = () => {
    const sheetId = extractSpreadsheetId(currentSheetUrl);
    if (!sheetId) {
      alert('الرجاء إدخال رابط أو اختيار جدول Google Sheet أولاً');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteSync = async () => {
    setShowConfirmModal(false);
    const sheetId = extractSpreadsheetId(currentSheetUrl);
    if (!sheetId) return;

    setIsSyncing(true);
    setSyncResult(null);
    try {
      // Save sheet URL in settings
      await saveSettings({
        googleSheetUrl: currentSheetUrl,
        googleSheetConnected: true,
        lastSyncedAt: new Date().toISOString(),
      });

      const res = await syncDatabaseToGoogleSheet(sheetId, db);
      setSyncResult({
        success: true,
        message: '✓ ' + res.message,
      });
      onRefresh();
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'فشل مزامنة البيانات مع Google Sheets',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const spreadsheetId = extractSpreadsheetId(currentSheetUrl);
  const webViewUrl = currentSheetUrl.startsWith('http')
    ? currentSheetUrl
    : spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                الربط والمزامنة مع Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                تخزين سحابي مباشر لدفتر المغسلة والعمال والرواتب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Status Banner */}
          {syncResult && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                syncResult.success
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{syncResult.message}</span>
            </div>
          )}

          {/* Section 1: Google Authentication */}
          <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. حساب Google
              </h4>
              {currentUser && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  متصل ومصرح ✓
                </span>
              )}
            </div>

            {!currentUser ? (
              <div>
                <p className="text-xs text-slate-600 mb-4">
                  قم بتسجيل الدخول باستخدام حساب Google الخاص بك لمنح التطبيق صلاحية قراءة وتحديث ملف Google Sheets المخصص للمغسلة.
                </p>

                {/* Official Google Sign-In Button */}
                <button
                  onClick={handleLogin}
                  disabled={isSigningIn}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs flex items-center justify-center gap-3 transition-colors cursor-pointer min-h-[44px]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>
                    {isSigningIn ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول بحساب Google (Sign in with Google)'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="avatar"
                      className="w-9 h-9 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                      {currentUser.displayName ? currentUser.displayName[0] : 'G'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {currentUser.displayName || 'مستخدم Google'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Choose / Create Sheet */}
          <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/80 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. جدول Google Sheets المخصص
            </h4>

            {currentUser && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCreateNewSheet}
                  disabled={isCreatingSheet}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isCreatingSheet ? 'جارٍ إنشاء الجدول وتنسيقه...' : 'إنشاء جدول مغسلة جديد تلقائياً'}
                  </span>
                </button>

                <button
                  onClick={handleLoadUserSheets}
                  disabled={isLoadingSheets}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} />
                  <span>تحديث قائمة الجداول</span>
                </button>
              </div>
            )}

            {/* List of user sheets */}
            {availableSheets.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  اختر من جداول Drive الموجودة بحسابك:
                </label>
                <select
                  value={currentSheetUrl}
                  onChange={(e) => setCurrentSheetUrl(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden cursor-pointer"
                >
                  <option value="">-- اختر جدولاً من قائمتك --</option>
                  {availableSheets.map((sh) => (
                    <option key={sh.id} value={sh.webViewLink || sh.id}>
                      {sh.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manual URL / ID input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                أو أدخل رابط Google Sheet مباشرة:
              </label>
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                value={currentSheetUrl}
                onChange={(e) => setCurrentSheetUrl(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden"
              />
            </div>

            {/* Direct Open Link */}
            {webViewUrl && (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">معرف الجدول النشط:</span>
                <a
                  href={webViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                >
                  <span>فتح الجدول في Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Section 3: Tabs Overview */}
          <div className="bg-emerald-50/50 rounded-2xl p-4.5 border border-emerald-200/70">
            <h4 className="text-xs font-bold text-emerald-900 mb-2">
              الأوراق والتبويبات المربوطة تلقائياً:
            </h4>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-emerald-800">
              <div className="bg-white p-2 rounded-lg border border-emerald-100 font-semibold text-center">
                📄 Employees (العمال)
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 font-semibold text-center">
                📄 Departments (الأقسام)
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 font-semibold text-center">
                📄 Attendance (الحضور)
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 font-semibold text-center">
                📄 Penalties (الخصومات)
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 font-semibold text-center">
                📄 Equipment (المعدات)
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 font-semibold text-center">
                📄 EquipmentChecks (الفحص)
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 font-semibold text-center">
                📄 DailyReports (التقارير)
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 font-semibold text-center">
                📄 ActivityLogs (العمليات)
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 font-semibold text-center">
                📄 Payroll (الرواتب)
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>

          <button
            onClick={handleStartSyncWithConfirmation}
            disabled={isSyncing || !currentUser || !currentSheetUrl}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer min-h-[44px] ${
              currentUser && currentSheetUrl
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جارٍ المزامنة السحابية...' : 'مزامنة جميع البيانات الآن'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Overwrite/Update */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-2">
              تأكيد مزامنة البيانات مع Google Sheets
            </h4>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              سيتم تحديث وكتابة جميع سجلات العمال والحضور والخصومات وتقارير المعدات الحالية داخل تبويبات جدول Google Sheets المحدد:
              <br />
              <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                {currentSheetUrl}
              </span>
              <br />
              هل تريد المتابعة؟
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExecuteSync}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                تأكيد المزامنة
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
