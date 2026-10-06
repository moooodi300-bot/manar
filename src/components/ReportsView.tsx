import React, { useState } from 'react';
import { DatabaseState } from '../types';
import { formatDateToArabic } from '../utils/dateUtils';
import { Printer, Download, FileText, Calendar, Filter, DollarSign, Wrench, Users, Scissors } from 'lucide-react';

interface ReportsViewProps {
  db: DatabaseState;
  currentDate: string;
  onPrintA4: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ db, currentDate, onPrintA4 }) => {
  const [reportType, setReportType] = useState<
    'daily_attendance' | 'penalties' | 'equipment' | 'grooming'
  >('daily_attendance');
  const [filterDate, setFilterDate] = useState<string>(currentDate);

  // Filter attendance for the chosen date
  const filteredAttendance = db.attendance.filter((a) => a.date === filterDate);
  // Default attendance mapping
  const activeEmployees = db.employees.filter((e) => e.status === 'active');

  const reportEmployees = activeEmployees.map((emp) => {
    const record = filteredAttendance.find((a) => a.employeeId === emp.id);
    const pens = db.penalties.filter((p) => p.employeeId === emp.id && p.date === filterDate);
    const totalPenalty = pens.reduce((s, p) => s + (p.amount || 0), 0);
    return {
      emp,
      status: record ? record.status : 'present',
      lateHours: record?.lateHours || 0,
      grooming: record?.grooming || 'good',
      notes: record?.notes || '',
      penalties: pens,
      totalPenalty,
    };
  });

  // Filter penalties for chosen date or all
  const filteredPenalties = db.penalties.filter((p) => p.date === filterDate);

  // Filter equipment checks for chosen date
  const filteredChecks = db.equipmentChecks.filter((c) => c.date === filterDate);

  // Export CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `تقرير_${reportType}_${filterDate}.csv`;

    if (reportType === 'daily_attendance') {
      headers = ['#', 'اسم العامل', 'القسم', 'حالة الحضور', 'ساعات التأخير', 'العناية الشخصية', 'الخصومات', 'ملاحظات'];
      rows = reportEmployees.map((r, i) => [
        i + 1,
        `"${r.emp.name}"`,
        `"${r.emp.departmentName}"`,
        r.status === 'present'
          ? 'حاضر'
          : r.status === 'absent_unexcused'
          ? 'غياب بدون عذر'
          : r.status === 'absent_excused'
          ? 'غياب بعذر'
          : r.status === 'late'
          ? 'تأخير'
          : 'إجازة',
        r.lateHours,
        r.grooming === 'good' ? 'ملتزم' : 'يحتاج متابعة',
        r.totalPenalty,
        `"${r.notes}"`,
      ]);
    } else if (reportType === 'penalties') {
      headers = ['#', 'اسم العامل', 'القسم', 'نوع الخصم', 'السبب', 'القيمة بالريال', 'المسجل'];
      rows = filteredPenalties.map((p, i) => [
        i + 1,
        `"${p.employeeName}"`,
        `"${p.departmentName}"`,
        `"${p.type}"`,
        `"${p.reason}"`,
        p.amount,
        `"${p.createdBy}"`,
      ]);
    } else {
      headers = ['#', 'اسم الجهاز', 'الفترة', 'الحالة', 'الملاحظات', 'المسجل'];
      rows = filteredChecks.map((c, i) => [
        i + 1,
        `"${c.equipmentName}"`,
        c.period === 'morning' ? 'صباحي' : 'مسائي',
        c.status === 'working' ? 'تعمل' : c.status === 'broken' ? 'عطل' : 'صيانة',
        `"${c.notes || ''}"`,
        `"${c.checkedBy}"`,
      ]);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            التقارير اليومية والدورية
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            مركز طباعة وتصدير التقارير
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            نماذج جاهزة للطباعة بحجم A4 والتصدير بصيغة Excel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrintA4}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[40px]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير A4</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[40px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setReportType('daily_attendance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              reportType === 'daily_attendance'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>كشف الحضور اليومي</span>
          </button>

          <button
            onClick={() => setReportType('penalties')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              reportType === 'penalties'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>كشف الجزاءات والخصومات</span>
          </button>

          <button
            onClick={() => setReportType('equipment')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              reportType === 'equipment'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>تقرير فحص المعدات</span>
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">تاريخ التقرير:</span>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => e.target.value && setFilterDate(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Render Current Report Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {reportType === 'daily_attendance' && (
          <div className="overflow-x-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                كشف حضور عمال المغسلة ليوم {formatDateToArabic(filterDate)}
              </h3>
              <span className="text-xs text-slate-500">
                إجمالي العمال: {reportEmployees.length}
              </span>
            </div>

            <table className="w-full text-right text-xs">
              <thead className="bg-white text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">اسم العامل</th>
                  <th className="p-3.5">القسم</th>
                  <th className="p-3.5">حالة الحضور</th>
                  <th className="p-3.5">التأخير</th>
                  <th className="p-3.5">العناية الشخصية</th>
                  <th className="p-3.5">الخصومات</th>
                  <th className="p-3.5">الملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportEmployees.map((r, i) => (
                  <tr key={r.emp.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="p-3.5 font-bold text-slate-900">{r.emp.name}</td>
                    <td className="p-3.5 text-slate-600">{r.emp.departmentName}</td>
                    <td className="p-3.5">
                      {r.status === 'present' && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                          ✓ حاضر
                        </span>
                      )}
                      {r.status === 'absent_unexcused' && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold">
                          ✕ غياب بدون عذر
                        </span>
                      )}
                      {r.status === 'absent_excused' && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold">
                          ✕ غياب بعذر
                        </span>
                      )}
                      {r.status === 'late' && (
                        <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded font-bold">
                          ⚠ متأخر
                        </span>
                      )}
                      {(r.status === 'leave_paid' || r.status === 'leave_unpaid') && (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                          إجازة
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 tabular-nums">
                      {r.lateHours > 0 ? `${r.lateHours} س` : '-'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.grooming === 'good'
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-amber-700 bg-amber-50'
                        }`}
                      >
                        {r.grooming === 'good' ? 'ملتزم' : 'يحتاج متابعة'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-rose-700 tabular-nums">
                      {r.totalPenalty > 0 ? `-${r.totalPenalty} ريال` : '-'}
                    </td>
                    <td className="p-3.5 text-slate-500 italic">{r.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'penalties' && (
          <div className="overflow-x-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                كشف الخصومات والجزاءات ليوم {formatDateToArabic(filterDate)}
              </h3>
              <span className="text-xs font-bold text-rose-700">
                الإجمالي: {filteredPenalties.reduce((s, p) => s + p.amount, 0)} ريال
              </span>
            </div>

            {filteredPenalties.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                لا توجد خصومات أو جزاءات مسجلة في هذا التاريخ
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-white text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">اسم العامل</th>
                    <th className="p-3.5">القسم</th>
                    <th className="p-3.5">نوع الخصم</th>
                    <th className="p-3.5">السبب / البيان</th>
                    <th className="p-3.5 text-rose-700 font-bold">المبلغ</th>
                    <th className="p-3.5">القائم بالتسجيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPenalties.map((pen, i) => (
                    <tr key={pen.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 text-slate-400 tabular-nums">{i + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900">{pen.employeeName}</td>
                      <td className="p-3.5 text-slate-600">{pen.departmentName}</td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {pen.type === 'absence_unexcused'
                          ? 'غياب بدون عذر'
                          : pen.type === 'absence_excused'
                          ? 'غياب بعذر'
                          : pen.type === 'late'
                          ? 'تأخير'
                          : pen.type === 'neglect'
                          ? 'تقصير في العمل'
                          : 'خصم مالي'}
                      </td>
                      <td className="p-3.5 text-slate-600">{pen.reason}</td>
                      <td className="p-3.5 font-bold text-rose-700 tabular-nums">
                        {pen.amount} ريال
                      </td>
                      <td className="p-3.5 text-slate-500">{pen.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {reportType === 'equipment' && (
          <div className="overflow-x-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                تقرير فحص المعدات ليوم {formatDateToArabic(filterDate)}
              </h3>
              <span className="text-xs text-slate-500">
                سجلات الفحص: {filteredChecks.length}
              </span>
            </div>

            {filteredChecks.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                لم يتم تسجيل فحص للمعدات في هذا التاريخ بعد
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-white text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">اسم الجهاز</th>
                    <th className="p-3.5">الفترة</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5">الملاحظات</th>
                    <th className="p-3.5">القائم بالفحص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredChecks.map((c, i) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 text-slate-400 tabular-nums">{i + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900">{c.equipmentName}</td>
                      <td className="p-3.5 text-slate-600">
                        {c.period === 'morning' ? '☀ صباحي' : '🌙 مسائي'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            c.status === 'working'
                              ? 'text-emerald-700 bg-emerald-50'
                              : c.status === 'broken'
                              ? 'text-rose-700 bg-rose-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          {c.status === 'working'
                            ? 'تعمل بصورة طبيعية'
                            : c.status === 'broken'
                            ? 'عطل وتوقف'
                            : 'تحتاج صيانة'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{c.notes || '-'}</td>
                      <td className="p-3.5 text-slate-500">{c.checkedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
