export type DepartmentId = 'wash' | 'steam' | 'dry' | string;

export interface Department {
  id: DepartmentId;
  name: string;
  defaultSalary: number;
}

export type WorkerStatus = 'active' | 'suspended' | 'terminated';

export interface Employee {
  id: string;
  number: number;
  name: string;
  departmentId: DepartmentId;
  departmentName: string;
  monthlySalary: number;
  startDate: string;
  status: WorkerStatus;
  phone?: string;
  notes?: string;
}

export type AttendanceStatus = 'present' | 'absent_unexcused' | 'absent_excused' | 'leave_paid' | 'leave_unpaid' | 'late' | 'half_day';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  lateHours?: number; // duration in hours
  lateMinutes?: number;
  notes?: string;
  grooming?: 'good' | 'needs_attention';
  groomingNotes?: string;
  createdBy: string; // محمد | بلال | عبدالله
  createdAt: string;
  updatedAt: string;
}

export type PenaltyType = 
  | 'absence_unexcused' // خصم يومين
  | 'absence_excused'   // خصم يوم واحد
  | 'late'              // ساعتين عن كل ساعة
  | 'neglect'           // تقصير في العمل - ساعتين
  | 'quick'             // خصم سريع بمبلغ
  | 'other';

export interface PenaltyRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  date: string; // YYYY-MM-DD
  type: PenaltyType;
  reason: string;
  hours?: number;
  days?: number;
  amount: number; // SAR
  createdBy: string;
  createdAt: string;
  notes?: string;
}

export type EquipmentStatus = 'working' | 'broken' | 'maintenance';

export interface Equipment {
  id: string;
  name: string;
  code?: string;
  location?: string;
  status: EquipmentStatus;
  notes?: string;
  createdAt: string;
}

export interface EquipmentCheck {
  id: string;
  equipmentId: string;
  equipmentName: string;
  date: string; // YYYY-MM-DD
  period: 'morning' | 'evening';
  status: EquipmentStatus;
  notes?: string;
  checkedBy: string;
  checkedAt: string;
}

export interface DailyReport {
  id: string;
  date: string; // YYYY-MM-DD
  period: 'morning' | 'evening';
  supervisorName: string;
  signature?: string;
  notes?: string;
  departmentSummaries: {
    departmentName: string;
    totalWorkers: number;
    presentCount: number;
    absentCount: number;
    leaveCount: number;
    lateCount: number;
    penaltyCount: number;
    notes?: string;
  }[];
  equipmentSummary: {
    total: number;
    working: number;
    broken: number;
    maintenance: number;
  };
  createdAt: string;
  createdBy: string;
}

export interface ActivityLog {
  id: string;
  userName: string; // محمد | بلال | عبدالله
  action: string; // سجل حضور, سجل غياب, خصم, فحص جهاز, etc.
  targetType: 'employee' | 'equipment' | 'report' | 'salary' | 'system';
  targetId?: string;
  targetName: string;
  amount?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  createdAt: string;
}

export interface SystemSettings {
  washSalary: number;
  steamSalary: number;
  drySalary: number;
  workHoursPerDay: number;
  daysPerMonth: number;
  laundryName: string;
  activeOperator: string; // محمد | بلال | عبدالله
  googleSheetUrl?: string;
  googleSheetConnected?: boolean;
  lastSyncedAt?: string;
}

export interface MonthlyPayrollItem {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  basicSalary: number;
  attendanceDays: number;
  absentUnexcusedDays: number;
  absentExcusedDays: number;
  leaveDays: number;
  lateHours: number;
  neglectCount: number;
  absenceDeduction: number;
  lateDeduction: number;
  performanceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  additions: number;
  netSalary: number;
}

export interface DatabaseState {
  departments: Department[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  penalties: PenaltyRecord[];
  equipment: Equipment[];
  equipmentChecks: EquipmentCheck[];
  dailyReports: DailyReport[];
  activityLogs: ActivityLog[];
  settings: SystemSettings;
  users: { id: string; name: string; role: string }[];
}
