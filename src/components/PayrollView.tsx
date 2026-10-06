import React, { useState } from 'react';
import { DatabaseState } from '../types';
import { calculatePayroll } from '../services/api';
import { getAvailableMonths } from '../utils/dateUtils';
import { Printer, Download, DollarSign, ArrowDownRight, Wallet, Users, Search, Filter } from 'lucide-react';

interface PayrollViewProps {
  db: DatabaseState;
  onPrintA4: () => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ db, onPrintA4 }) => {
  const availableMonths = getAvailableMonths();
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const payrollItems = calculatePayroll(db, selectedMonth);

  const filteredItems = payrollItems.filter((item) => {
    if (searchQuery && !item.employeeName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedDept !== 'all' && item.departmentName !== selectedDept) {
      return false;
    }
    return true;
  });

  // Calculate totals
  const totalBasic = filteredItems.reduce((sum, item) => sum + item.basicSalary, 0);
  const totalAbsenceDeductions = filteredItems.reduce((sum, item) => sum + item.absenceDeduction, 0);
  const totalLateDeductions = filteredItems.reduce((sum, item) => sum + item.lateDeduction, 0);
  const totalPerformanceDeductions = filteredItems.reduce((sum, item) => sum + item.performanceDeduction, 0);
  const totalOtherDeductions = filteredItems.reduce((sum, item) => sum + item.otherDeductions, 0);
  const totalDeductions = filteredItems.reduce((sum, item) => sum + item.totalDeductions, 0);
  const totalNet = filteredItems.reduce((sum, item) => sum + item.netSalary, 0);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'اسم العامل',
      'القسم',
      'الراتب الأساسي',
      'أيام الحضور',
      'خصم الغياب',
      'خصم التأخير',
      'خصم التقصير',
      'خصومات أخرى',
      'إجمالي الخصومات',
      'صافي الراتب',
    ];
    const rows = filteredItems.map((item) => [
      `"${item.employeeName}"`,
      `"${item.departmentName}"`,
      item.basicSalary,
      item.attendanceDays,
      item.absenceDeduction,
      item.lateDeduction,
      item.performanceDeduction,
      item.otherDeductions,
      item.totalDeductions,
      item.netSalary,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `كشف_رواتب_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
            كشف الرواتب الشهري
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            رواتب شهر {availableMonths.find((m) => m.value === selectedMonth)?.label || selectedMonth}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            حساب تلقائي لصافي الرواتب بعد خصم الغياب والتأخير والتقصير
          </p>
        </div>

        {/* Month selector & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden cursor-pointer"
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            onClick={onPrintA4}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[40px]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة A4</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[40px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Gross */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">إجمالي الرواتب الأساسية</span>
            <Wallet className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {totalBasic.toLocaleString()} <span className="text-xs font-normal">ريال</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {filteredItems.length} عمال مشمولين
          </div>
        </div>

        {/* Total Deductions */}
        <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200/80 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold">إجمالي الخصومات والجزاءات</span>
            <ArrowDownRight className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-900 tabular-nums">
            {totalDeductions.toLocaleString()} <span className="text-xs font-normal">ريال</span>
          </div>
          <div className="text-xs text-rose-600 mt-1">
            غياب: {totalAbsenceDeductions} | تأخير وتقصير: {totalLateDeductions + totalPerformanceDeductions} ريال
          </div>
        </div>

        {/* Total Net */}
        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-semibold">صافي الرواتب المستحقة للصرف</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 tabular-nums">
            {totalNet.toLocaleString()} <span className="text-xs font-normal">ريال</span>
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            المبلغ الفعلي المطلوب تحويله للعمال
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedDept === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل
          </button>
          {db.departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedDept === dept.name
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Payroll Table - Horizontal Scrollable for iPad */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3.5">#</th>
                <th className="p-3.5">اسم العامل</th>
                <th className="p-3.5">القسم</th>
                <th className="p-3.5">الراتب الأساسي</th>
                <th className="p-3.5">أيام الحضور</th>
                <th className="p-3.5 text-rose-600">خصم الغياب</th>
                <th className="p-3.5 text-orange-600">خصم التأخير</th>
                <th className="p-3.5 text-purple-600">خصم التقصير</th>
                <th className="p-3.5 text-rose-700 font-bold">إجمالي الخصم</th>
                <th className="p-3.5 text-emerald-700 font-bold">صافي الراتب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => (
                <tr key={item.employeeId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 text-slate-400 tabular-nums">{idx + 1}</td>
                  <td className="p-3.5 font-bold text-slate-900">{item.employeeName}</td>
                  <td className="p-3.5 text-slate-600">{item.departmentName}</td>
                  <td className="p-3.5 font-semibold text-slate-900 tabular-nums">
                    {item.basicSalary} ريال
                  </td>
                  <td className="p-3.5 text-slate-700 tabular-nums">
                    {item.attendanceDays} يوم
                  </td>
                  <td className="p-3.5 text-rose-600 tabular-nums">
                    {item.absenceDeduction > 0 ? `-${item.absenceDeduction}` : '0'}
                  </td>
                  <td className="p-3.5 text-orange-600 tabular-nums">
                    {item.lateDeduction > 0 ? `-${item.lateDeduction}` : '0'}
                  </td>
                  <td className="p-3.5 text-purple-600 tabular-nums">
                    {item.performanceDeduction > 0 ? `-${item.performanceDeduction}` : '0'}
                  </td>
                  <td className="p-3.5 font-bold text-rose-700 tabular-nums">
                    {item.totalDeductions > 0 ? `-${item.totalDeductions}` : '0'} ريال
                  </td>
                  <td className="p-3.5 font-bold text-emerald-800 text-sm tabular-nums">
                    {item.netSalary} ريال
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100/70 font-bold text-slate-900 border-t border-slate-200">
              <tr>
                <td colSpan={3} className="p-3.5">
                  الإجمالي العام ({filteredItems.length} عمال)
                </td>
                <td className="p-3.5 tabular-nums">{totalBasic} ريال</td>
                <td className="p-3.5">-</td>
                <td className="p-3.5 text-rose-600 tabular-nums">{totalAbsenceDeductions}</td>
                <td className="p-3.5 text-orange-600 tabular-nums">{totalLateDeductions}</td>
                <td className="p-3.5 text-purple-600 tabular-nums">{totalPerformanceDeductions}</td>
                <td className="p-3.5 text-rose-700 tabular-nums">-{totalDeductions} ريال</td>
                <td className="p-3.5 text-emerald-800 text-sm tabular-nums">
                  {totalNet} ريال
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
