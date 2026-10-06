import React, { useState } from 'react';
import { DatabaseState } from '../types';
import { formatDateToArabic } from '../utils/dateUtils';
import { calculatePayroll } from '../services/api';
import { X, Printer } from 'lucide-react';

interface PrintModalProps {
  db: DatabaseState;
  currentDate: string;
  activeOperator: string;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  db,
  currentDate,
  activeOperator,
  onClose,
}) => {
  const [reportType, setReportType] = useState<
    'daily_sheet' | 'daily_report' | 'penalties' | 'payroll' | 'equipment'
  >('daily_sheet');

  const handlePrint = () => {
    window.print();
  };

  const activeEmployees = db.employees.filter((e) => e.status === 'active');
  const payrollItems = calculatePayroll(db, currentDate.substring(0, 7));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Control Header - Hidden during actual print */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">معاينة الطباعة بحجم A4</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
            >
              <option value="daily_sheet">كشف الحضور اليومي</option>
              <option value="daily_report">التقرير اليومي الشامل</option>
              <option value="penalties">كشف الخصومات والجزاءات</option>
              <option value="payroll">كشف الرواتب الشهري</option>
              <option value="equipment">تقرير فحص المعدات</option>
            </select>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الآن (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (Styled like real A4 official document) */}
        <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 print:p-0 print:overflow-visible" id="printable-sheet">
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-950">
                {db.settings.laundryName}
              </h1>
              <p className="text-xs font-bold text-slate-600 mt-1">
                إدارة التشغيل والموارد البشرية · دفتر المغسلة الإلكتروني
              </p>
            </div>

            <div className="text-left text-xs font-bold text-slate-800">
              <div>التاريخ: {currentDate}</div>
              <div>اليوم: {formatDateToArabic(currentDate)}</div>
              <div>المشرف المسؤول: {activeOperator}</div>
            </div>
          </div>

          {/* 1. Daily Attendance Sheet */}
          {reportType === 'daily_sheet' && (
            <div>
              <div className="text-center mb-5">
                <h2 className="text-base font-black underline underline-offset-4">
                  كشف الحضور والانصراف والغياب اليومي لعمال المغسلة
                </h2>
              </div>

              <table className="w-full text-right text-[11px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-400">
                    <th className="border border-slate-300 p-2 text-center w-8">#</th>
                    <th className="border border-slate-300 p-2">اسم العامل</th>
                    <th className="border border-slate-300 p-2">القسم</th>
                    <th className="border border-slate-300 p-2 text-center">الحالة</th>
                    <th className="border border-slate-300 p-2 text-center">التأخير</th>
                    <th className="border border-slate-300 p-2 text-center">العناية الشخصية</th>
                    <th className="border border-slate-300 p-2 text-center">الخصم (ريال)</th>
                    <th className="border border-slate-300 p-2">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {activeEmployees.map((emp, i) => {
                    const att = db.attendance.find((a) => a.employeeId === emp.id && a.date === currentDate);
                    const status = att ? att.status : 'present';
                    const pens = db.penalties.filter((p) => p.employeeId === emp.id && p.date === currentDate);
                    const penTotal = pens.reduce((s, p) => s + p.amount, 0);

                    return (
                      <tr key={emp.id} className="border-b border-slate-200">
                        <td className="border border-slate-200 p-2 text-center tabular-nums">{i + 1}</td>
                        <td className="border border-slate-200 p-2 font-bold">{emp.name}</td>
                        <td className="border border-slate-200 p-2">{emp.departmentName}</td>
                        <td className="border border-slate-200 p-2 text-center font-bold">
                          {status === 'present'
                            ? 'حاضر ✓'
                            : status === 'absent_unexcused'
                            ? 'غياب بدون عذر ✕'
                            : status === 'absent_excused'
                            ? 'غياب بعذر'
                            : status === 'late'
                            ? 'تأخير'
                            : 'إجازة'}
                        </td>
                        <td className="border border-slate-200 p-2 text-center tabular-nums">
                          {att?.lateHours ? `${att.lateHours} س` : '-'}
                        </td>
                        <td className="border border-slate-200 p-2 text-center">
                          {att?.grooming === 'needs_attention' ? 'يحتاج متابعة' : 'ملتزم ✓'}
                        </td>
                        <td className="border border-slate-200 p-2 text-center font-bold tabular-nums">
                          {penTotal > 0 ? penTotal : '-'}
                        </td>
                        <td className="border border-slate-200 p-2 text-slate-600 text-[10px]">
                          {att?.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Daily Report Sheet */}
          {reportType === 'daily_report' && (
            <div>
              <div className="text-center mb-5">
                <h2 className="text-base font-black underline underline-offset-4">
                  التقرير اليومي الشامل لمغسلة السيارات
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {db.departments.map((dept) => {
                  const emps = db.employees.filter((e) => e.status === 'active' && e.departmentId === dept.id);
                  const absent = emps.filter((e) => {
                    const a = db.attendance.find((x) => x.employeeId === e.id && x.date === currentDate);
                    return a && (a.status === 'absent_unexcused' || a.status === 'absent_excused');
                  }).length;
                  const present = emps.length - absent;

                  return (
                    <div key={dept.id} className="border border-slate-300 p-3 rounded">
                      <div className="font-bold text-xs pb-1 border-b border-slate-200 mb-2">
                        {dept.name}
                      </div>
                      <div className="text-[11px] space-y-1">
                        <div>إجمالي العمال: {emps.length}</div>
                        <div>الحاضرين: {present}</div>
                        <div>الغائبين: {absent}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border border-slate-300 p-3 rounded mb-6">
                <div className="font-bold text-xs pb-1 border-b border-slate-200 mb-2">
                  فحص المعدات والماكينات
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  {db.equipment.map((eq) => {
                    const chk = db.equipmentChecks.find((c) => c.equipmentId === eq.id && c.date === currentDate);
                    const status = chk ? chk.status : eq.status;
                    return (
                      <div key={eq.id} className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                        <span className="font-bold">{eq.name}: </span>
                        <span>{status === 'working' ? 'تعمل ✓' : status === 'broken' ? 'عطل ✕' : 'صيانة ⚠'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. Penalties Sheet */}
          {reportType === 'penalties' && (
            <div>
              <div className="text-center mb-5">
                <h2 className="text-base font-black underline underline-offset-4">
                  كشف الجزاءات والخصومات المالية
                </h2>
              </div>

              <table className="w-full text-right text-[11px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-400">
                    <th className="border border-slate-300 p-2 text-center w-8">#</th>
                    <th className="border border-slate-300 p-2">اسم العامل</th>
                    <th className="border border-slate-300 p-2">القسم</th>
                    <th className="border border-slate-300 p-2">نوع الخصم</th>
                    <th className="border border-slate-300 p-2">السبب والبيان</th>
                    <th className="border border-slate-300 p-2 text-center">المبلغ (ريال)</th>
                    <th className="border border-slate-300 p-2">القائم بالتسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {db.penalties.map((pen, i) => (
                    <tr key={pen.id} className="border-b border-slate-200">
                      <td className="border border-slate-200 p-2 text-center tabular-nums">{i + 1}</td>
                      <td className="border border-slate-200 p-2 font-bold">{pen.employeeName}</td>
                      <td className="border border-slate-200 p-2">{pen.departmentName}</td>
                      <td className="border border-slate-200 p-2">{pen.type}</td>
                      <td className="border border-slate-200 p-2">{pen.reason}</td>
                      <td className="border border-slate-200 p-2 text-center font-bold tabular-nums">
                        {pen.amount}
                      </td>
                      <td className="border border-slate-200 p-2">{pen.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Payroll Sheet */}
          {reportType === 'payroll' && (
            <div>
              <div className="text-center mb-5">
                <h2 className="text-base font-black underline underline-offset-4">
                  كشف مسير رواتب عمال المغسلة لشهر {currentDate.substring(0, 7)}
                </h2>
              </div>

              <table className="w-full text-right text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-400">
                    <th className="border border-slate-300 p-1.5 text-center w-7">#</th>
                    <th className="border border-slate-300 p-1.5">اسم العامل</th>
                    <th className="border border-slate-300 p-1.5">القسم</th>
                    <th className="border border-slate-300 p-1.5 text-center">الراتب الأساسي</th>
                    <th className="border border-slate-300 p-1.5 text-center">أيام الحضور</th>
                    <th className="border border-slate-300 p-1.5 text-center">خصم غياب</th>
                    <th className="border border-slate-300 p-1.5 text-center">خصم تأخير</th>
                    <th className="border border-slate-300 p-1.5 text-center">خصم تقصير</th>
                    <th className="border border-slate-300 p-1.5 text-center">إجمالي الخصم</th>
                    <th className="border border-slate-300 p-1.5 text-center font-black">صافي الراتب</th>
                    <th className="border border-slate-300 p-1.5 text-center">توقيع المستلم</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollItems.map((p, i) => (
                    <tr key={p.employeeId} className="border-b border-slate-200">
                      <td className="border border-slate-200 p-1.5 text-center tabular-nums">{i + 1}</td>
                      <td className="border border-slate-200 p-1.5 font-bold">{p.employeeName}</td>
                      <td className="border border-slate-200 p-1.5">{p.departmentName}</td>
                      <td className="border border-slate-200 p-1.5 text-center tabular-nums">{p.basicSalary}</td>
                      <td className="border border-slate-200 p-1.5 text-center tabular-nums">{p.attendanceDays}</td>
                      <td className="border border-slate-200 p-1.5 text-center tabular-nums">{p.absenceDeduction || '-'}</td>
                      <td className="border border-slate-200 p-1.5 text-center tabular-nums">{p.lateDeduction || '-'}</td>
                      <td className="border border-slate-200 p-1.5 text-center tabular-nums">{p.performanceDeduction || '-'}</td>
                      <td className="border border-slate-200 p-1.5 text-center font-bold tabular-nums text-rose-700">
                        {p.totalDeductions > 0 ? `-${p.totalDeductions}` : '0'}
                      </td>
                      <td className="border border-slate-200 p-1.5 text-center font-black tabular-nums">
                        {p.netSalary} ريال
                      </td>
                      <td className="border border-slate-200 p-1.5 w-20"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signatures Footer on Printout */}
          <div className="mt-12 pt-6 border-t border-slate-400 grid grid-cols-3 gap-4 text-center text-xs font-bold">
            <div>
              <div className="mb-8">المشرف المسؤول</div>
              <div className="text-slate-700">{activeOperator}</div>
            </div>
            <div>
              <div className="mb-8">المدير العام للمغسلة</div>
              <div className="text-slate-400">.......................</div>
            </div>
            <div>
              <div className="mb-8">الختم والاعتماد</div>
              <div className="text-slate-400">.......................</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
