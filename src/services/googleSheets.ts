import { getAccessToken } from './googleAuth';
import { DatabaseState } from '../types';

export interface SheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return input.trim();
}

/**
 * List spreadsheets available in user's Google Drive
 */
export async function listUserSpreadsheets(): Promise<SheetFile[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل جلب ملفات Google Sheets من Drive');
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Create a new spreadsheet with all required tabs for the car wash notebook
 */
export async function createLaundrySpreadsheet(title = 'نظام إدارة عمال المغسلة - دفتر المغسلة الإلكتروني'): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

  const sheetsToCreate = [
    { properties: { title: 'Employees' } },
    { properties: { title: 'Departments' } },
    { properties: { title: 'Attendance' } },
    { properties: { title: 'Penalties' } },
    { properties: { title: 'Payroll' } },
    { properties: { title: 'Equipment' } },
    { properties: { title: 'EquipmentChecks' } },
    { properties: { title: 'DailyReports' } },
    { properties: { title: 'ActivityLogs' } },
  ];

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: sheetsToCreate,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل إنشاء ملف Google Sheet جديد');
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
}

/**
 * Ensure all standard tabs exist in an existing spreadsheet
 */
export async function ensureSpreadsheetTabs(spreadsheetId: string): Promise<string[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

  // 1. Get existing sheets
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل الوصول إلى Google Sheet المحدد');
  }

  const metaData = await metaRes.json();
  const existingTitles = (metaData.sheets || []).map((s: any) => s.properties?.title);

  const requiredTabs = [
    'Employees',
    'Departments',
    'Attendance',
    'Penalties',
    'Payroll',
    'Equipment',
    'EquipmentChecks',
    'DailyReports',
    'ActivityLogs',
  ];

  const missingTabs = requiredTabs.filter((t) => !existingTitles.includes(t));

  if (missingTabs.length > 0) {
    const requests = missingTabs.map((title) => ({
      addSheet: { properties: { title } },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
  }

  return [...existingTitles, ...missingTabs];
}

/**
 * Sync entire current Database state into Google Sheets
 */
export async function syncDatabaseToGoogleSheet(
  spreadsheetId: string,
  db: DatabaseState
): Promise<{ success: boolean; message: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');

  await ensureSpreadsheetTabs(spreadsheetId);

  // Prepare data for each tab
  // 1. Employees tab
  const employeesRows = [
    [
      'employee_id',
      'employee_number',
      'name',
      'department_id',
      'department',
      'monthly_salary',
      'start_date',
      'status',
      'phone',
      'notes',
    ],
    ...db.employees.map((e) => [
      e.id,
      e.number,
      e.name,
      e.departmentId,
      e.departmentName,
      e.monthlySalary,
      e.startDate,
      e.status,
      e.phone || '',
      e.notes || '',
    ]),
  ];

  // 2. Departments tab
  const departmentsRows = [
    ['department_id', 'department_name', 'default_salary'],
    ...db.departments.map((d) => [d.id, d.name, d.defaultSalary]),
  ];

  // 3. Attendance tab
  const attendanceRows = [
    [
      'attendance_id',
      'date',
      'employee_id',
      'employee_name',
      'department',
      'status',
      'late_hours',
      'grooming',
      'notes',
      'created_by',
      'updated_at',
    ],
    ...db.attendance.map((a) => [
      a.id,
      a.date,
      a.employeeId,
      a.employeeName,
      a.departmentName,
      a.status,
      a.lateHours || 0,
      a.grooming || 'good',
      a.notes || '',
      a.createdBy,
      a.updatedAt,
    ]),
  ];

  // 4. Penalties tab
  const penaltiesRows = [
    [
      'penalty_id',
      'employee_id',
      'employee_name',
      'department',
      'date',
      'type',
      'reason',
      'hours',
      'days',
      'amount',
      'created_by',
      'notes',
    ],
    ...db.penalties.map((p) => [
      p.id,
      p.employeeId,
      p.employeeName,
      p.departmentName,
      p.date,
      p.type,
      p.reason,
      p.hours || 0,
      p.days || 0,
      p.amount,
      p.createdBy,
      p.notes || '',
    ]),
  ];

  // 5. Equipment tab
  const equipmentRows = [
    ['equipment_id', 'name', 'code', 'location', 'status', 'notes', 'created_at'],
    ...db.equipment.map((eq) => [
      eq.id,
      eq.name,
      eq.code || '',
      eq.location || '',
      eq.status,
      eq.notes || '',
      eq.createdAt,
    ]),
  ];

  // 6. EquipmentChecks tab
  const equipmentChecksRows = [
    ['check_id', 'equipment_id', 'equipment_name', 'date', 'period', 'status', 'notes', 'checked_by', 'checked_at'],
    ...db.equipmentChecks.map((c) => [
      c.id,
      c.equipmentId,
      c.equipmentName,
      c.date,
      c.period,
      c.status,
      c.notes || '',
      c.checkedBy,
      c.checkedAt,
    ]),
  ];

  // 7. DailyReports tab
  const dailyReportsRows = [
    ['report_id', 'date', 'period', 'supervisor_name', 'notes', 'created_by', 'created_at'],
    ...db.dailyReports.map((r) => [
      r.id,
      r.date,
      r.period,
      r.supervisorName,
      r.notes || '',
      r.createdBy,
      r.createdAt,
    ]),
  ];

  // 8. ActivityLogs tab
  const activityLogsRows = [
    ['log_id', 'user_name', 'action', 'target_type', 'target_name', 'amount', 'date', 'time', 'created_at'],
    ...db.activityLogs.map((l) => [
      l.id,
      l.userName,
      l.action,
      l.targetType,
      l.targetName,
      l.amount || 0,
      l.date,
      l.time,
      l.createdAt,
    ]),
  ];

  const updateData = [
    { range: 'Employees!A1', values: employeesRows },
    { range: 'Departments!A1', values: departmentsRows },
    { range: 'Attendance!A1', values: attendanceRows },
    { range: 'Penalties!A1', values: penaltiesRows },
    { range: 'Equipment!A1', values: equipmentRows },
    { range: 'EquipmentChecks!A1', values: equipmentChecksRows },
    { range: 'DailyReports!A1', values: dailyReportsRows },
    { range: 'ActivityLogs!A1', values: activityLogsRows },
  ];

  // Batch update spreadsheet values
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updateData,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل تحديث بيانات Google Sheet');
  }

  return {
    success: true,
    message: 'تمت مزامنة جميع البيانات بنجاح مع Google Sheets',
  };
}

/**
 * Append a single Attendance row to Google Sheets in real-time
 */
export async function appendAttendanceToGoogleSheet(
  spreadsheetId: string,
  record: any
): Promise<void> {
  const token = await getAccessToken();
  if (!token || !spreadsheetId) return;

  const row = [
    record.id,
    record.date,
    record.employeeId,
    record.employeeName,
    record.departmentName,
    record.status,
    record.lateHours || 0,
    record.grooming || 'good',
    record.notes || '',
    record.createdBy,
    record.updatedAt,
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Attendance!A1:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [row],
    }),
  }).catch((e) => console.warn('Silent append error:', e));
}
