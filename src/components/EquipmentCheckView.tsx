import React, { useState } from 'react';
import { DatabaseState, Equipment, EquipmentStatus } from '../types';
import { saveEquipmentCheck, addEquipment } from '../services/api';
import { formatDateToArabic } from '../utils/dateUtils';
import { Wrench, CheckCircle2, XCircle, AlertTriangle, Plus, Sun, Moon, Check, Printer } from 'lucide-react';

interface EquipmentCheckViewProps {
  db: DatabaseState;
  currentDate: string;
  onRefresh: () => void;
  activeOperator: string;
  onPrintA4: () => void;
}

export const EquipmentCheckView: React.FC<EquipmentCheckViewProps> = ({
  db,
  currentDate,
  onRefresh,
  activeOperator,
  onPrintA4,
}) => {
  const [period, setPeriod] = useState<'morning' | 'evening'>('morning');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newEqName, setNewEqName] = useState<string>('');
  const [newEqCode, setNewEqCode] = useState<string>('');
  const [newEqLocation, setNewEqLocation] = useState<string>('');
  const [newEqNotes, setNewEqNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Find check for today & period
  const getCheckForEquipment = (eqId: string) => {
    return db.equipmentChecks.find(
      (c) => c.equipmentId === eqId && c.date === currentDate && c.period === period
    );
  };

  const handleStatusChange = async (eq: Equipment, status: EquipmentStatus, notes?: string) => {
    try {
      await saveEquipmentCheck({
        equipmentId: eq.id,
        date: currentDate,
        period,
        status,
        notes: notes || '',
        operatorName: activeOperator,
      });
      showToast(`✓ تم تحديث فحص ${eq.name}`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل فحص الجهاز');
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqName.trim()) {
      alert('الرجاء إدخال اسم الجهاز');
      return;
    }
    try {
      await addEquipment({
        name: newEqName,
        code: newEqCode,
        location: newEqLocation,
        notes: newEqNotes,
        operatorName: activeOperator,
      });
      showToast('✓ تمت إضافة الجهاز بنجاح');
      setIsAddModalOpen(false);
      setNewEqName('');
      setNewEqCode('');
      setNewEqLocation('');
      setNewEqNotes('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الجهاز');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
            فحص معدات وماكينات المغسلة
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            فحص اليوم: {formatDateToArabic(currentDate)}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تأكد من تشغيل المعدات ومستوى الضغط والصرف
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Shift selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setPeriod('morning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                period === 'morning'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>☀ صباحي</span>
            </button>
            <button
              onClick={() => setPeriod('evening')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                period === 'evening'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>🌙 مسائي</span>
            </button>
          </div>

          {/* Add equipment button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة جهاز</span>
          </button>

          {/* Print */}
          <button
            onClick={onPrintA4}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[40px]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة A4</span>
          </button>
        </div>
      </div>

      {/* Equipment checklist items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {db.equipment.map((eq) => {
          const check = getCheckForEquipment(eq.id);
          const currentStatus: EquipmentStatus = check ? check.status : eq.status;

          return (
            <div
              key={eq.id}
              className={`bg-white rounded-2xl p-5 border shadow-xs transition-all ${
                currentStatus === 'broken'
                  ? 'border-rose-300 bg-rose-50/20'
                  : currentStatus === 'maintenance'
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{eq.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    {eq.code && <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">{eq.code}</span>}
                    {eq.location && <span>الموقع: {eq.location}</span>}
                  </div>
                </div>

                <div className="shrink-0">
                  {currentStatus === 'working' && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      ✓ تعمل
                    </span>
                  )}
                  {currentStatus === 'broken' && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      ✕ عطل
                    </span>
                  )}
                  {currentStatus === 'maintenance' && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      ⚠ تحتاج صيانة
                    </span>
                  )}
                </div>
              </div>

              {/* Status Action Buttons for iPad */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => handleStatusChange(eq, 'working', check?.notes)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[42px] ${
                    currentStatus === 'working'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تعمل</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(eq, 'broken', check?.notes)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[42px] ${
                    currentStatus === 'broken'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/70'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>عطل</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(eq, 'maintenance', check?.notes)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[42px] ${
                    currentStatus === 'maintenance'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/70'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>صيانة</span>
                </button>
              </div>

              {/* Notes Input */}
              <input
                type="text"
                defaultValue={check?.notes || ''}
                onBlur={(e) => {
                  if (e.target.value !== (check?.notes || '')) {
                    handleStatusChange(eq, currentStatus, e.target.value);
                  }
                }}
                placeholder="ملاحظة حول الجهاز أو سبب العطل..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
              />
            </div>
          );
        })}
      </div>

      {/* Modal: Add Equipment */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-4">
              إضافة جهاز / معدة جديدة
            </h4>

            <form onSubmit={handleAddEquipment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الجهاز *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مضخة الضغط العالي 2"
                  value={newEqName}
                  onChange={(e) => setNewEqName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم / كود الجهاز (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: PUMP-02"
                  value={newEqCode}
                  onChange={(e) => setNewEqCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الموقع داخل المغسلة (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: المسار الخلفي"
                  value={newEqLocation}
                  onChange={(e) => setNewEqLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات إضافية
                </label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات تشغيلية..."
                  value={newEqNotes}
                  onChange={(e) => setNewEqNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                >
                  حفظ الجهاز
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
