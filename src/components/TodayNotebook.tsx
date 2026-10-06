import React, { useState } from 'react';
import { DatabaseState, Employee, AttendanceStatus, AttendanceRecord } from '../types';
import { saveAttendance, bulkSetPresent, addPenalty } from '../services/api';
import { formatDateToArabic } from '../utils/dateUtils';
import {
  Check,
  X,
  Clock,
  Calendar,
  AlertCircle,
  Scissors,
  CheckCircle2,
  Sparkles,
  FileText,
  UserCheck,
  ChevronDown,
  Search,
} from 'lucide-react';

interface TodayNotebookProps {
  db: DatabaseState;
  currentDate: string;
  onRefresh: () => void;
  activeOperator: string;
}

export const TodayNotebook: React.FC<TodayNotebookProps> = ({
  db,
  currentDate,
  onRefresh,
  activeOperator,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Modals for quick input
  const [absenceModalEmp, setAbsenceModalEmp] = useState<Employee | null>(null);
  const [lateModalEmp, setLateModalEmp] = useState<Employee | null>(null);
  const [lateHours, setLateHours] = useState<number>(1);
  const [lateReason, setLateReason] = useState<string>('');
  const [leaveModalEmp, setLeaveModalEmp] = useState<Employee | null>(null);
  const [discountModalEmp, setDiscountModalEmp] = useState<Employee | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(50);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [noteModalEmp, setNoteModalEmp] = useState<Employee | null>(null);
  const [tempNote, setTempNote] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Filter employees
  const filteredEmployees = db.employees.filter((emp) => {
    if (emp.status !== 'active') return false;
    if (selectedDept !== 'all' && emp.departmentId !== selectedDept) return false;
    if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Get attendance status for a worker on currentDate (default is 'present')
  const getEmployeeAttendance = (empId: string): AttendanceRecord | undefined => {
    return db.attendance.find((a) => a.employeeId === empId && a.date === currentDate);
  };

  // Get worker penalties for this date
  const getEmployeePenaltiesToday = (empId: string) => {
    return db.penalties.filter((p) => p.employeeId === empId && p.date === currentDate);
  };

  // 1. Mark Single Present
  const handleMarkPresent = async (emp: Employee) => {
    setIsProcessing(true);
    try {
      await saveAttendance({
        employeeId: emp.id,
        date: currentDate,
        status: 'present',
        operatorName: activeOperator,
      });
      showToast(`✓ تم تسجيل ${emp.name} حاضر`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Bulk Mark All Present ("✓ الجميع حاضر")
  const handleBulkPresent = async () => {
    if (!window.confirm('هل تريد تأكيد حضور جميع العمال لتاريخ اليوم؟')) return;
    setIsProcessing(true);
    try {
      await bulkSetPresent({
        date: currentDate,
        operatorName: activeOperator,
      });
      showToast('✓ تم تحديد جميع العمال حاضرين لليوم');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Confirm Absence
  const handleConfirmAbsence = async (type: 'unexcused' | 'excused') => {
    if (!absenceModalEmp) return;
    setIsProcessing(true);
    try {
      const status = type === 'unexcused' ? 'absent_unexcused' : 'absent_excused';
      await saveAttendance({
        employeeId: absenceModalEmp.id,
        date: currentDate,
        status,
        operatorName: activeOperator,
        notes: type === 'unexcused' ? 'غياب بدون عذر' : 'غياب بعذر مقبول',
      });
      showToast(`✓ تم تسجيل غياب ${absenceModalEmp.name}`);
      setAbsenceModalEmp(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Confirm Leave
  const handleConfirmLeave = async (type: 'paid' | 'unpaid') => {
    if (!leaveModalEmp) return;
    setIsProcessing(true);
    try {
      const status = type === 'paid' ? 'leave_paid' : 'leave_unpaid';
      await saveAttendance({
        employeeId: leaveModalEmp.id,
        date: currentDate,
        status,
        operatorName: activeOperator,
        notes: type === 'paid' ? 'إجازة مصرح بها (مدفوعة)' : 'إجازة بدون راتب',
      });
      showToast(`✓ تم تسجيل إجازة ${leaveModalEmp.name}`);
      setLeaveModalEmp(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Confirm Late
  const handleConfirmLate = async () => {
    if (!lateModalEmp) return;
    setIsProcessing(true);
    try {
      await saveAttendance({
        employeeId: lateModalEmp.id,
        date: currentDate,
        status: 'late',
        lateHours,
        notes: lateReason || `تأخير ${lateHours} ساعة`,
        operatorName: activeOperator,
      });
      showToast(`✓ تم تسجيل تأخير ${lateHours} ساعة للعامل ${lateModalEmp.name}`);
      setLateModalEmp(null);
      setLateHours(1);
      setLateReason('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Direct Quick Neglect ("تقصير" - One Click!)
  const handleQuickNeglect = async (emp: Employee) => {
    setIsProcessing(true);
    try {
      await addPenalty({
        employeeId: emp.id,
        date: currentDate,
        type: 'neglect',
        reason: 'تقصير في أداء العمل (خصم ساعتين)',
        operatorName: activeOperator,
      });
      showToast(`✓ تم تسجيل تقصير وخصم ساعتين على ${emp.name}`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. Confirm Custom / Quick Discount
  const handleConfirmDiscount = async () => {
    if (!discountModalEmp) return;
    if (discountAmount <= 0) {
      alert('الرجاء إدخال مبلغ صحيح للخصم');
      return;
    }
    setIsProcessing(true);
    try {
      await addPenalty({
        employeeId: discountModalEmp.id,
        date: currentDate,
        type: 'quick',
        amount: discountAmount,
        reason: discountReason || `خصم مالي بقيمة ${discountAmount} ريال`,
        operatorName: activeOperator,
      });
      showToast(`✓ تم تسجيل خصم ${discountAmount} ريال على ${discountModalEmp.name}`);
      setDiscountModalEmp(null);
      setDiscountAmount(50);
      setDiscountReason('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  // 8. Toggle Personal Grooming (العناية الشخصية)
  const handleToggleGrooming = async (emp: Employee, currentVal?: string) => {
    const newVal = currentVal === 'needs_attention' ? 'good' : 'needs_attention';
    const att = getEmployeeAttendance(emp.id);
    setIsProcessing(true);
    try {
      await saveAttendance({
        employeeId: emp.id,
        date: currentDate,
        status: att ? att.status : 'present',
        lateHours: att?.lateHours,
        notes: att?.notes,
        grooming: newVal,
        groomingNotes: newVal === 'needs_attention' ? 'يحتاج متابعة في الزي والنظافة' : '',
        operatorName: activeOperator,
      });
      showToast(newVal === 'good' ? `✓ عناية شخصية ملتزمة: ${emp.name}` : `⚠ عناية شخصية تحتاج متابعة: ${emp.name}`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  // 9. Save Note
  const handleSaveNote = async () => {
    if (!noteModalEmp) return;
    const att = getEmployeeAttendance(noteModalEmp.id);
    setIsProcessing(true);
    try {
      await saveAttendance({
        employeeId: noteModalEmp.id,
        date: currentDate,
        status: att ? att.status : 'present',
        lateHours: att?.lateHours,
        notes: tempNote,
        grooming: att?.grooming,
        groomingNotes: att?.groomingNotes,
        operatorName: activeOperator,
      });
      showToast('✓ تم حفظ الملاحظة');
      setNoteModalEmp(null);
      setTempNote('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Big "الجميع حاضر" Button */}
          <button
            onClick={handleBulkPresent}
            disabled={isProcessing}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>✓ الجميع حاضر</span>
          </button>

          <span className="text-xs text-slate-500 hidden md:inline">
            (الحالة الافتراضية لجميع العمال هي حاضر، اضغط فقط لتعديل غير الحاضرين)
          </span>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث عن عامل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Department Tabs (مثل أوراق الدفتر) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedDept('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
            selectedDept === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          📄 جميع العمال ({db.employees.filter((e) => e.status === 'active').length})
        </button>

        {db.departments.map((dept) => {
          const count = db.employees.filter(
            (e) => e.status === 'active' && e.departmentId === dept.id
          ).length;
          const isActive = selectedDept === dept.id;
          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>📄 {dept.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Worker Rows - iPad Optimized List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            لا يوجد عمال يطابقون خيارات البحث
          </div>
        ) : (
          filteredEmployees.map((emp) => {
            const att = getEmployeeAttendance(emp.id);
            // Default status is 'present'
            const currentStatus: AttendanceStatus = att ? att.status : 'present';
            const penalties = getEmployeePenaltiesToday(emp.id);
            const totalPenaltyAmount = penalties.reduce((sum, p) => sum + (p.amount || 0), 0);

            // Styling based on status
            const isPresent = currentStatus === 'present';
            const isAbsent = currentStatus === 'absent_unexcused' || currentStatus === 'absent_excused';
            const isLeave = currentStatus === 'leave_paid' || currentStatus === 'leave_unpaid';
            const isLate = currentStatus === 'late';
            const isGroomingAlert = att?.grooming === 'needs_attention';

            return (
              <div
                key={emp.id}
                className={`p-3.5 sm:p-4.5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                  isAbsent ? 'bg-rose-50/20' : isLate ? 'bg-amber-50/20' : 'hover:bg-slate-50/60'
                }`}
              >
                {/* Worker Identity & Status Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 tabular-nums">
                    {emp.number}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {emp.name}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {emp.departmentName}
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {emp.monthlySalary} ريال
                      </span>
                    </div>

                    {/* Status badges & notes */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                      {isPresent && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> حاضر
                        </span>
                      )}
                      {currentStatus === 'absent_unexcused' && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <X className="w-3 h-3" /> غياب بدون عذر (خصم يومين)
                        </span>
                      )}
                      {currentStatus === 'absent_excused' && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                          <X className="w-3 h-3" /> غياب بعذر (خصم يوم)
                        </span>
                      )}
                      {isLeave && (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> إجازة
                        </span>
                      )}
                      {isLate && (
                        <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> تأخير {att?.lateHours || 1} ساعة (خصم {(att?.lateHours || 1) * 2} ساعة)
                        </span>
                      )}
                      {totalPenaltyAmount > 0 && (
                        <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-bold">
                          خصومات: {totalPenaltyAmount} ريال
                        </span>
                      )}
                      {att?.notes && (
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md italic">
                          ملاحظة: {att.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Big Action Buttons for iPad (Touch-Friendly $\ge 44$px) */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap self-end lg:self-auto shrink-0">
                  {/* 1. حاضر */}
                  <button
                    onClick={() => handleMarkPresent(emp)}
                    disabled={isProcessing}
                    className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isPresent
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70'
                    }`}
                    title="تسجيل حاضر"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>حاضر</span>
                  </button>

                  {/* 2. غياب */}
                  <button
                    onClick={() => setAbsenceModalEmp(emp)}
                    disabled={isProcessing}
                    className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isAbsent
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/70'
                    }`}
                    title="تسجيل غياب"
                  >
                    <X className="w-4 h-4" />
                    <span>غياب</span>
                  </button>

                  {/* 3. إجازة */}
                  <button
                    onClick={() => setLeaveModalEmp(emp)}
                    disabled={isProcessing}
                    className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isLeave
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/70'
                    }`}
                    title="تسجيل إجازة"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>إجازة</span>
                  </button>

                  {/* 4. تأخير */}
                  <button
                    onClick={() => {
                      setLateModalEmp(emp);
                      setLateHours(1);
                    }}
                    disabled={isProcessing}
                    className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isLate
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200/70'
                    }`}
                    title="تسجيل تأخير"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>تأخير</span>
                  </button>

                  {/* 5. تقصير في العمل (One click automatic 2-hours wage deduction!) */}
                  <button
                    onClick={() => handleQuickNeglect(emp)}
                    disabled={isProcessing}
                    className="min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/70 transition-all flex items-center gap-1 cursor-pointer"
                    title="تقصير في أداء العمل (خصم ساعتين تلقائياً)"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>تقصير</span>
                  </button>

                  {/* 6. خصم مالي سريع */}
                  <button
                    onClick={() => {
                      setDiscountModalEmp(emp);
                      setDiscountAmount(50);
                    }}
                    disabled={isProcessing}
                    className="min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/70 transition-all flex items-center gap-1 cursor-pointer"
                    title="خصم مالي بمبلغ محدد"
                  >
                    <span>خصم</span>
                  </button>

                  {/* 7. العناية الشخصية */}
                  <button
                    onClick={() => handleToggleGrooming(emp, att?.grooming)}
                    disabled={isProcessing}
                    className={`min-h-[42px] px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      isGroomingAlert
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title="العناية الشخصية"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">نظافة:</span>
                    <span>{isGroomingAlert ? 'يحتاج متابعة' : 'ملتزم'}</span>
                  </button>

                  {/* 8. ملاحظة */}
                  <button
                    onClick={() => {
                      setNoteModalEmp(emp);
                      setTempNote(att?.notes || '');
                    }}
                    className="min-h-[42px] px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                    title="إضافة ملاحظة"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* Modal 1: تسجيل الغياب (بدون عذر = يومين / بعذر = يوم) */}
      {absenceModalEmp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-2">
              تسجيل غياب العامل: {absenceModalEmp.name}
            </h4>
            <p className="text-xs text-slate-500 mb-5">
              اختر نوع الغياب وسيتم احتساب الخصم تلقائياً من راتب العامل ({absenceModalEmp.monthlySalary} ريال).
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleConfirmAbsence('unexcused')}
                className="w-full p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-right cursor-pointer transition-all"
              >
                <div className="font-bold text-rose-900 text-sm">🔴 غياب بدون عذر</div>
                <div className="text-xs text-rose-700 mt-1">
                  خصم أجر يومين تلقائياً ({Math.round((absenceModalEmp.monthlySalary / 30) * 2 * 100) / 100} ريال)
                </div>
              </button>

              <button
                onClick={() => handleConfirmAbsence('excused')}
                className="w-full p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-right cursor-pointer transition-all"
              >
                <div className="font-bold text-amber-900 text-sm">🟡 غياب بعذر مقبول</div>
                <div className="text-xs text-amber-700 mt-1">
                  خصم أجر يوم واحد فقط ({Math.round((absenceModalEmp.monthlySalary / 30) * 1 * 100) / 100} ريال)
                </div>
              </button>
            </div>

            <button
              onClick={() => setAbsenceModalEmp(null)}
              className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Modal 2: تسجيل التأخير (ساعتين لكل ساعة) */}
      {lateModalEmp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-1">
              تسجيل تأخير: {lateModalEmp.name}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              القاعدة: كل ساعة تأخير = خصم أجر ساعتين تلقائياً.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                مدة التأخير بالساعات:
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[0.5, 1, 1.5, 2].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setLateHours(hrs)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      lateHours === hrs
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {hrs} س
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="0.5"
                step="0.5"
                max="8"
                value={lateHours}
                onChange={(e) => setLateHours(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200/80 rounded-xl text-xs text-orange-900 font-semibold mb-4">
              الخصم المحتسب: خصم أجر {lateHours * 2} ساعة (
              {Math.round(lateHours * 2 * (lateModalEmp.monthlySalary / 30 / 8) * 100) / 100} ريال)
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                سبب التأخير (اختياري):
              </label>
              <input
                type="text"
                placeholder="أسباب شخصية / مواصلات..."
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmLate}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                تأكيد التأخير
              </button>
              <button
                onClick={() => setLateModalEmp(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: تسجيل إجازة */}
      {leaveModalEmp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-2">
              تسجيل إجازة: {leaveModalEmp.name}
            </h4>

            <div className="space-y-3 mb-4">
              <button
                onClick={() => handleConfirmLeave('paid')}
                className="w-full p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-right cursor-pointer transition-all"
              >
                <div className="font-bold text-emerald-900 text-sm">🟢 إجازة اعتيادية مدفوعة</div>
                <div className="text-xs text-emerald-700 mt-0.5">بدون أي خصم مالي</div>
              </button>

              <button
                onClick={() => handleConfirmLeave('unpaid')}
                className="w-full p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-right cursor-pointer transition-all"
              >
                <div className="font-bold text-amber-900 text-sm">🟡 إجازة بدون راتب</div>
                <div className="text-xs text-amber-700 mt-0.5">خصم أجر يوم واحد من الراتب</div>
              </button>
            </div>

            <button
              onClick={() => setLeaveModalEmp(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Modal 4: خصم مالي سريع */}
      {discountModalEmp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-1">
              تسجيل خصم: {discountModalEmp.name}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              اختر مبلغاً سريعاً أو أدخل المبلغ يدوياً.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[50, 100, 200].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDiscountAmount(amt)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    discountAmount === amt
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {amt} ريال
                </button>
              ))}
            </div>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المبلغ بالريال:
              </label>
              <input
                type="number"
                min="1"
                step="5"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                سبب الخصم:
              </label>
              <input
                type="text"
                placeholder="مخالفة تعليمات / إهمال..."
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmDiscount}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                تسجيل الخصم
              </button>
              <button
                onClick={() => setDiscountModalEmp(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: إضافة ملاحظة */}
      {noteModalEmp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-1">
              ملاحظة على العامل: {noteModalEmp.name}
            </h4>
            <textarea
              rows={3}
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              placeholder="اكتب ملاحظة لليوم..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden mb-4"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveNote}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                حفظ الملاحظة
              </button>
              <button
                onClick={() => setNoteModalEmp(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
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
