import { DatabaseState, MonthlyPayrollItem, Employee, SystemSettings } from '../types';

const API_BASE = '/api';

export async function fetchDatabase(): Promise<DatabaseState> {
  const res = await fetch(`${API_BASE}/data`);
  if (!res.ok) {
    throw new Error('فشل جلب البيانات من الخادم');
  }
  return res.json();
}

export async function saveAttendance(payload: {
  employeeId: string;
  date: string;
  status: string;
  lateHours?: number;
  lateMinutes?: number;
  notes?: string;
  grooming?: 'good' | 'needs_attention';
  groomingNotes?: string;
  operatorName?: string;
}): Promise<{ success: boolean; db: DatabaseState }> {
  const res = await fetch(`${API_BASE}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('فشل تسجيل الحضور');
  return res.json();
}

export async function bulkSetPresent(payload: {
  date: string;
  operatorName?: string;
}): Promise<{ success: boolean; db: DatabaseState }> {
  const res = await fetch(`${API_BASE}/attendance/bulk-present`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('فشل تحديد الجميع حاضر');
  return res.json();
}

export async function addPenalty(payload: {
  employeeId: string;
  date: string;
  type: string;
  amount?: number;
  reason?: string;
  hours?: number;
  operatorName?: string;
  notes?: string;
}): Promise<{ success: boolean; db: DatabaseState }> {
  const res = await fetch(`${API_BASE}/penalties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('فشل تسجيل الخصم');
  return res.json();
}

export async function deletePenalty(id: string): Promise<{ success: boolean; db: DatabaseState }> {
  const res = await fetch(`${API_BASE}/penalties/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('فشل حذف الخصم');
  return res.json();
}

export async function addEquipment(payload: {
  name: string;
  code?: string;
  location?: string;
  notes?: string;
  operatorName?: string;
}): Promise<{ success: boolean; db: DatabaseState }> {
  const res = await fetch(`${API_BASE}/equipment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('فشل إضافة الجهاز');
  return res.json();
}

export async function saveEquipmentCheck(payload: {
  equipmentId: string;
  date: string;
  period: 'morning' | 'evening';
  status: string;
  notes?: string;
  operatorName?: string;
}): Promise<{ success: boolean; db: DatabaseState }> {
  const res = await fetch(`${API_BASE}/equipment-checks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('فشل تسجيل فحص الجهاز');
  return res.json();
}

export async function saveDailyReport(payload: {
  date: string;
  period: 'morning' | 'evening';
  supervisorName?: string;
  notes?: string;
  departmentSummaries?: any[];
  equipmentSummary?: any;
  operatorName?: string;
}): Promise<{ success: boolean; db: DatabaseState }> {
  const res = await fetch(`${API_BASE}/daily-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('فشل حفظ التقرير اليومي');
  return res.json();
}

export async function saveEmployee(payload: {
  id?: string;
  name: string;
  departmentId: string;
  monthlySalary: number;
  status?: string;
  phone?: string;
  notes?: string;
  operatorName?: string;
}): Promise<{ success: boolean; db: DatabaseState }> {
  const res = await fetch(`${API_BASE}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('فشل حفظ بيانات العامل');
  return res.json();
}

export async function saveSettings(payload: Partial<SystemSettings>): Promise<{ success: boolean; db: DatabaseState }> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('فشل حفظ الإعدادات');
  return res.json();
}

export async function resetDatabase(): Promise<{ success: boolean; db: DatabaseState }> {
  const res = await fetch(`${API_BASE}/reset-data`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('فشل إعادة ضبط البيانات');
  return res.json();
}

/**
 * Monthly payroll calculation
 * Month format: "YYYY-MM" (e.g. "2026-10")
 */
export function calculatePayroll(db: DatabaseState, monthStr: string): MonthlyPayrollItem[] {
  const daysInMonth = db.settings.daysPerMonth || 30;
  const hoursPerDay = db.settings.workHoursPerDay || 8;

  return db.employees.map((emp) => {
    const dailyRate = emp.monthlySalary / daysInMonth;
    const hourlyRate = dailyRate / hoursPerDay;

    // Filter attendance for this month
    const empAtt = db.attendance.filter(
      (a) => a.employeeId === emp.id && a.date.startsWith(monthStr)
    );

    // Filter penalties for this month
    const empPens = db.penalties.filter(
      (p) => p.employeeId === emp.id && p.date.startsWith(monthStr)
    );

    let absentUnexcusedDays = 0;
    let absentExcusedDays = 0;
    let leaveDays = 0;
    let lateHours = 0;

    empAtt.forEach((att) => {
      if (att.status === 'absent_unexcused') absentUnexcusedDays += 1;
      else if (att.status === 'absent_excused') absentExcusedDays += 1;
      else if (att.status === 'leave_paid' || att.status === 'leave_unpaid') leaveDays += 1;
      else if (att.status === 'late') lateHours += (att.lateHours || 1);
    });

    // Breakdown penalties
    let absenceDeduction = 0;
    let lateDeduction = 0;
    let performanceDeduction = 0;
    let otherDeductions = 0;
    let neglectCount = 0;

    empPens.forEach((p) => {
      if (p.type === 'absence_unexcused' || p.type === 'absence_excused') {
        absenceDeduction += p.amount;
      } else if (p.type === 'late') {
        lateDeduction += p.amount;
      } else if (p.type === 'neglect') {
        performanceDeduction += p.amount;
        neglectCount += 1;
      } else {
        otherDeductions += p.amount;
      }
    });

    const totalDeductions = Math.round((absenceDeduction + lateDeduction + performanceDeduction + otherDeductions) * 100) / 100;
    const netSalary = Math.max(0, Math.round((emp.monthlySalary - totalDeductions) * 100) / 100);

    // Attendance days estimation (days in month minus unexcused, excused, leave)
    const attendanceDays = Math.max(0, daysInMonth - absentUnexcusedDays - absentExcusedDays);

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      departmentName: emp.departmentName,
      basicSalary: emp.monthlySalary,
      attendanceDays,
      absentUnexcusedDays,
      absentExcusedDays,
      leaveDays,
      lateHours,
      neglectCount,
      absenceDeduction: Math.round(absenceDeduction * 100) / 100,
      lateDeduction: Math.round(lateDeduction * 100) / 100,
      performanceDeduction: Math.round(performanceDeduction * 100) / 100,
      otherDeductions: Math.round(otherDeductions * 100) / 100,
      totalDeductions,
      additions: 0,
      netSalary,
    };
  });
}
