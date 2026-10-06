import React, { useState } from 'react';
import { DatabaseState } from '../types';
import { formatDateToArabic } from '../utils/dateUtils';
import { saveDailyReport } from '../services/api';
import { Printer, Sun, Moon, CheckCircle2, FileText, Check, Shield } from 'lucide-react';

interface DailyReportViewProps {
  db: DatabaseState;
  currentDate: string;
  onRefresh: () => void;
  activeOperator: string;
  onPrintA4: () => void;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  db,
  currentDate,
  onRefresh,
  activeOperator,
  onPrintA4,
}) => {
  const [period, setPeriod] = useState<'morning' | 'evening'>('morning');
  const [notes, setNotes] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Look for existing saved report for this date & period
  const existingReport = db.dailyReports.find(
    (r) => r.date === currentDate && r.period === period
  );

  // Calculate department stats for today
  const departmentStats = db.departments.map((dept) => {
    const deptEmployees = db.employees.filter(
      (e) => e.status === 'active' && e.departmentId === dept.id
    );
    const totalWorkers = deptEmployees.length;

    let absentCount = 0;
    let leaveCount = 0;
    let lateCount = 0;
    let penaltyCount = 0;

    deptEmployees.forEach((emp) => {
      const att = db.attendance.find((a) => a.employeeId === emp.id && a.date === currentDate);
      if (att) {
        if (att.status === 'absent_unexcused' || att.status === 'absent_excused') {
          absentCount += 1;
        } else if (att.status === 'leave_paid' || att.status === 'leave_unpaid') {
          leaveCount += 1;
        } else if (att.status === 'late') {
          lateCount += 1;
        }
      }
      const pens = db.penalties.filter((p) => p.employeeId === emp.id && p.date === currentDate);
      if (pens.length > 0) {
        penaltyCount += pens.length;
      }
    });

    const presentCount = Math.max(0, totalWorkers - absentCount - leaveCount);

    return {
      departmentName: dept.name,
      totalWorkers,
      presentCount,
      absentCount,
      leaveCount,
      lateCount,
      penaltyCount,
    };
  });

  // Equipment stats
  const totalEquipment = db.equipment.length;
  const workingEquipment = db.equipment.filter((e) => e.status === 'working').length;
  const brokenEquipment = db.equipment.filter((e) => e.status === 'broken').length;
  const maintenanceEquipment = db.equipment.filter((e) => e.status === 'maintenance').length;

  const handleSave = async () => {
    try {
      await saveDailyReport({
        date: currentDate,
        period,
        supervisorName: activeOperator,
        notes,
        departmentSummaries: departmentStats,
        equipmentSummary: {
          total: totalEquipment,
          working: workingEquipment,
          broken: brokenEquipment,
          maintenance: maintenanceEquipment,
        },
        operatorName: activeOperator,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ التقرير');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
            التقرير اليومي الشامل
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            تقرير يوم {formatDateToArabic(currentDate)}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تجميع تلقائي لبيانات الحضور والغياب والمعدات
          </p>
        </div>

        {/* Shift switcher & Print */}
        <div className="flex items-center gap-2">
          {/* Shift Toggle */}
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

          <button
            onClick={onPrintA4}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة A4</span>
          </button>
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {departmentStats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                📄 {stat.departmentName}
              </h3>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                {stat.totalWorkers} عمال
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900">
                <div className="text-[11px] text-emerald-700 font-medium">الحاضر</div>
                <div className="text-lg font-bold tabular-nums">{stat.presentCount}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-900">
                <div className="text-[11px] text-rose-700 font-medium">الغائب</div>
                <div className="text-lg font-bold tabular-nums">{stat.absentCount}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900">
                <div className="text-[11px] text-amber-700 font-medium">الإجازات</div>
                <div className="text-lg font-bold tabular-nums">{stat.leaveCount}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-900">
                <div className="text-[11px] text-orange-700 font-medium">التأخير والجزاءات</div>
                <div className="text-lg font-bold tabular-nums">
                  {stat.lateCount + stat.penaltyCount}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Status in Daily Report */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>حالة معدات وماكينات المغسلة لليوم</span>
          <span className="text-xs text-slate-500 font-normal">
            إجمالي المعدات: {totalEquipment}
          </span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
            <div className="text-xs text-emerald-700 font-medium">تعمل بصورة ممتازة</div>
            <div className="text-xl font-bold text-emerald-900 tabular-nums">{workingEquipment}</div>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-center">
            <div className="text-xs text-rose-700 font-medium">أعطال متوقفة</div>
            <div className="text-xl font-bold text-rose-900 tabular-nums">{brokenEquipment}</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
            <div className="text-xs text-amber-700 font-medium">تحتاج صيانة دورية</div>
            <div className="text-xl font-bold text-amber-900 tabular-nums">{maintenanceEquipment}</div>
          </div>
        </div>
      </div>

      {/* Notes & Supervisor Signature Block */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            ملاحظات التقرير اليومي:
          </label>
          <textarea
            rows={3}
            value={notes || existingReport?.notes || ''}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="سجل أي ملاحظات خاصة بسير العمل خلال الفترة..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-100 gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="font-semibold">المشرف المسؤول:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
              {activeOperator}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">التوقيع الإلكتروني: معتمد ✓</span>
          </div>

          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            {isSaved ? <Check className="w-4 h-4 stroke-[3]" /> : <FileText className="w-4 h-4" />}
            <span>{isSaved ? '✓ تم حفظ التقرير' : 'حفظ التقرير اليومي'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
