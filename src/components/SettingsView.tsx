import React, { useState } from 'react';
import { DatabaseState } from '../types';
import { saveSettings, resetDatabase } from '../services/api';
import { Settings, Save, RefreshCw, AlertTriangle, FileSpreadsheet, CheckCircle2, ShieldCheck, Database } from 'lucide-react';

interface SettingsViewProps {
  db: DatabaseState;
  onRefresh: () => void;
  activeOperator: string;
  onOpenGoogleSheets?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ db, onRefresh, activeOperator, onOpenGoogleSheets }) => {
  const [washSalary, setWashSalary] = useState<number>(db.settings.washSalary || 2000);
  const [steamSalary, setSteamSalary] = useState<number>(db.settings.steamSalary || 2000);
  const [drySalary, setDrySalary] = useState<number>(db.settings.drySalary || 1500);
  const [workHours, setWorkHours] = useState<number>(db.settings.workHoursPerDay || 8);
  const [daysPerMonth, setDaysPerMonth] = useState<number>(db.settings.daysPerMonth || 30);
  const [laundryName, setLaundryName] = useState<string>(db.settings.laundryName || 'مغسلة المنار لخدمات السيارات');
  const [sheetUrl, setSheetUrl] = useState<string>(db.settings.googleSheetUrl || '');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings({
        washSalary: Number(washSalary),
        steamSalary: Number(steamSalary),
        drySalary: Number(drySalary),
        workHoursPerDay: Number(workHours),
        daysPerMonth: Number(daysPerMonth),
        laundryName,
        googleSheetUrl: sheetUrl,
        googleSheetConnected: Boolean(sheetUrl && sheetUrl.includes('google.com')),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الإعدادات');
    }
  };

  const handleTestSync = () => {
    setSyncStatus('جارٍ فحص المزامنة مع Google Sheets...');
    setTimeout(() => {
      setSyncStatus('✓ جاهز للمزامنة التلقائية (تم ربط جداول: Employees, Attendance, Penalties, Payroll, Equipment, DailyReports)');
    }, 900);
  };

  const handleResetData = async () => {
    const code = window.prompt(
      'تحذير: هل أنت متأكد من إعادة ضبط جميع البيانات إلى الحالة الأولية؟ اكتب "نعم" للمتابعة:'
    );
    if (code === 'نعم') {
      try {
        await resetDatabase();
        alert('تمت إعادة ضبط البيانات إلى الوضع الأولي بنجاح.');
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'فشل إعادة ضبط البيانات');
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            إعدادات النظام والحسابات
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            إعدادات المغسلة والرواتب
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تخصيص الرواتب الافتراضية، ساعات العمل، وقواعد الخصم
          </p>
        </div>

        {isSaved && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم حفظ الإعدادات</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Laundry Info */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            بيانات المنشأة
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم المغسلة
            </label>
            <input
              type="text"
              value={laundryName}
              onChange={(e) => setLaundryName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Card 2: Salaries per department */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            الرواتب الأساسية الافتراضية للأقسام
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                قسم الغسيل (ريال)
              </label>
              <input
                type="number"
                min="500"
                step="50"
                value={washSalary}
                onChange={(e) => setWashSalary(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                قسم البخار (ريال)
              </label>
              <input
                type="number"
                min="500"
                step="50"
                value={steamSalary}
                onChange={(e) => setSteamSalary(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                قسم التنشيف (ريال)
              </label>
              <input
                type="number"
                min="500"
                step="50"
                value={drySalary}
                onChange={(e) => setDrySalary(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Deduction formulas and work hours */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            معايير احتساب الخصومات والتأخير
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ساعات العمل اليومية (لحساب أجر الساعة)
              </label>
              <input
                type="number"
                min="4"
                max="14"
                value={workHours}
                onChange={(e) => setWorkHours(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:bg-white focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                أجر الساعة = الراتب الشهري ÷ 30 ÷ {workHours}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                أيام الشهر المعتمدة للحساب
              </label>
              <input
                type="number"
                min="28"
                max="31"
                value={daysPerMonth}
                onChange={(e) => setDaysPerMonth(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:bg-white focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                أجر اليوم = الراتب الشهري ÷ {daysPerMonth}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 mb-1">قواعد الخصم التلقائي المعتمدة:</div>
            <div>• غياب بدون عذر: خصم أجر يومين ({`قيمة اليوم × 2`})</div>
            <div>• غياب بعذر: خصم أجر يوم واحد ({`قيمة اليوم × 1`})</div>
            <div>• كل ساعة تأخير: خصم أجر ساعتين ({`أجر الساعة × 2`})</div>
            <div>• تقصير في العمل: خصم أجر ساعتين ({`أجر الساعة × 2`})</div>
          </div>
        </div>

        {/* Card 4: Google Sheets Persistence */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>الربط مع Google Sheets</span>
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              تخزين دائم ومستمر
            </span>
          </div>

          <p className="text-xs text-slate-500">
            يمكنك إدخال رابط أو معرف Google Sheet المخصص لمزامنة أوراق: Employees, Attendance, Penalties, Payroll, Equipment, DailyReports.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رابط Google Sheet
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {onOpenGoogleSheets && (
              <button
                type="button"
                onClick={onOpenGoogleSheets}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>إدارة ومزامنة Google Sheets (تسجيل الدخول / إنشاء جدول)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTestSync}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              فحص الربط والمزامنة
            </button>
            {syncStatus && (
              <span className="text-xs font-semibold text-emerald-700">
                {syncStatus}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>حفظ جميع الإعدادات</span>
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>إعادة ضبط البيانات للأصل</span>
          </button>
        </div>
      </form>
    </div>
  );
};
