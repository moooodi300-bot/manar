import React from 'react';
import { DatabaseState } from '../types';
import { formatDateToArabic } from '../utils/dateUtils';
import { TabType } from './BottomNav';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  DollarSign,
  BookOpen,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface HomeOverviewProps {
  db: DatabaseState;
  currentDate: string;
  onNavigateTab: (tab: TabType) => void;
  onOpenDailyReportModal: () => void;
  onOpenAllActivitiesModal: () => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  db,
  currentDate,
  onNavigateTab,
  onOpenDailyReportModal,
  onOpenAllActivitiesModal,
}) => {
  // Compute today's metrics
  const activeEmployees = db.employees.filter((e) => e.status === 'active');
  const totalWorkers = activeEmployees.length;

  const todayAttendance = db.attendance.filter((a) => a.date === currentDate);
  const todayPenalties = db.penalties.filter((p) => p.date === currentDate);

  let absentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;

  todayAttendance.forEach((att) => {
    if (att.status === 'absent_unexcused' || att.status === 'absent_excused') {
      absentCount += 1;
    } else if (att.status === 'late') {
      lateCount += 1;
    } else if (att.status === 'leave_paid' || att.status === 'leave_unpaid') {
      leaveCount += 1;
    }
  });

  // Default attendance rule: everyone not explicitly absent/leave is considered present!
  const presentCount = Math.max(0, totalWorkers - absentCount - leaveCount);

  // Today's total deductions
  const totalDeductionsToday = todayPenalties.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Equipment requiring attention
  const equipmentNeedingAttention = db.equipment.filter(
    (eq) => eq.status === 'broken' || eq.status === 'maintenance'
  ).length;

  // Latest 10 activities
  const latestActivities = (db.activityLogs || []).slice(0, 10);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Date Header Hero Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            اليوم الحالي بالدفتر
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {formatDateToArabic(currentDate)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            دفتر المغسلة جاهز للتسجيل والمتابعة اليومية
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigateTab('notebook')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تسجيل حضور اليوم</span>
          </button>
        </div>
      </div>

      {/* 2. Main 4 Big Operational Buttons for iPad */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 px-1">
          العمليات اليومية الأساسية
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Button 1: الحضور */}
          <button
            onClick={() => onNavigateTab('notebook')}
            className="group bg-white hover:bg-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 shadow-xs transition-all text-right flex flex-col justify-between min-h-[110px] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900">حضور العمال</div>
              <div className="text-xs text-slate-500">دفتر الحضور السريع</div>
            </div>
          </button>

          {/* Button 2: التقرير اليومي */}
          <button
            onClick={onOpenDailyReportModal}
            className="group bg-white hover:bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 shadow-xs transition-all text-right flex flex-col justify-between min-h-[110px] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900">التقرير اليومي</div>
              <div className="text-xs text-slate-500">صباحي ومسائي مع التوقيع</div>
            </div>
          </button>

          {/* Button 3: فحص المعدات */}
          <button
            onClick={() => onNavigateTab('equipment')}
            className="group bg-white hover:bg-amber-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-amber-300 shadow-xs transition-all text-right flex flex-col justify-between min-h-[110px] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900">فحص المعدات</div>
              <div className="text-xs text-slate-500">متابعة الماكينات والصرف</div>
            </div>
          </button>

          {/* Button 4: الرواتب */}
          <button
            onClick={() => onNavigateTab('payroll')}
            className="group bg-white hover:bg-purple-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-purple-300 shadow-xs transition-all text-right flex flex-col justify-between min-h-[110px] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900">كشف الرواتب</div>
              <div className="text-xs text-slate-500">حساب الخصومات والصافي</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Daily Summary Cards ("ملخص اليوم") */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <span>ملخص اليوم</span>
            <span className="text-xs text-slate-500 font-normal">
              (حالة المغسلة لتاريخ {currentDate})
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Workers */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs">إجمالي العمال</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {totalWorkers}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">3 أقسام تشغيلية</div>
          </div>

          {/* Present */}
          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/70 shadow-xs">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-xs font-semibold">حاضر اليوم</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-900 tabular-nums">
              {presentCount}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">حالة العمل منتظمة</div>
          </div>

          {/* Absent */}
          <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200/70 shadow-xs">
            <div className="flex items-center justify-between text-rose-800 mb-1">
              <span className="text-xs font-semibold">الغائبين</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-900 tabular-nums">
              {absentCount}
            </div>
            <div className="text-[11px] text-rose-700 mt-0.5">خصم تلقائي مسجل</div>
          </div>

          {/* Late */}
          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/70 shadow-xs">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-xs font-semibold">المتأخرين</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-900 tabular-nums">
              {lateCount}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">ساعتين لكل ساعة</div>
          </div>

          {/* Total Deductions Today */}
          <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200/70 shadow-xs">
            <div className="flex items-center justify-between text-purple-800 mb-1">
              <span className="text-xs font-semibold">خصومات اليوم</span>
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-900 tabular-nums">
              {totalDeductionsToday} <span className="text-xs font-normal">ريال</span>
            </div>
            <div className="text-[11px] text-purple-700 mt-0.5">تخصم من الصافي</div>
          </div>

          {/* Equipment Status */}
          <div className={`p-3.5 rounded-xl border shadow-xs ${
            equipmentNeedingAttention > 0
              ? 'bg-rose-50/60 border-rose-200/70 text-rose-900'
              : 'bg-white border-slate-200/80 text-slate-900'
          }`}>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs">أعطال الأجهزة</span>
              <Wrench className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums">
              {equipmentNeedingAttention}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {equipmentNeedingAttention > 0 ? 'تحتاج صيانة فورية' : 'كل المعدات تعمل'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Latest Activities Feed ("آخر الأعمال") */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">آخر الأعمال والعمليات</h3>
              <p className="text-xs text-slate-500">سجل لحظي بالعمليات التي نفذها المشرفون</p>
            </div>
          </div>

          <button
            onClick={onOpenAllActivitiesModal}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            عرض كل الأعمال
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {latestActivities.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              لا توجد عمليات مسجلة حتى الآن
            </div>
          ) : (
            latestActivities.map((act) => {
              // Activity badge styling
              let dotColor = 'bg-emerald-500';
              let badgeBg = 'bg-emerald-50 text-emerald-800';

              if (act.action.includes('غياب') || act.action.includes('عطل')) {
                dotColor = 'bg-rose-500';
                badgeBg = 'bg-rose-50 text-rose-800';
              } else if (act.action.includes('تأخير') || act.action.includes('تقصير') || act.action.includes('صيانة')) {
                dotColor = 'bg-amber-500';
                badgeBg = 'bg-amber-50 text-amber-800';
              } else if (act.action.includes('خصم')) {
                dotColor = 'bg-purple-500';
                badgeBg = 'bg-purple-50 text-purple-800';
              }

              return (
                <div
                  key={act.id}
                  className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 shrink-0">
                          {act.userName}
                        </span>
                        <span className="text-xs text-slate-600 truncate">
                          {act.action}
                        </span>
                      </div>
                      {act.targetName && act.targetName !== act.userName && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          العامل / الجهاز: {act.targetName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                      {act.time}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {act.date}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
