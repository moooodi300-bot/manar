import { IncomingMessage, ServerResponse } from 'http';
import { loadDatabase, saveDatabase, getInitialDatabase, DatabaseState } from './db';
import { AttendanceRecord, PenaltyRecord, Equipment, EquipmentCheck, DailyReport, ActivityLog, Employee, SystemSettings } from '../src/types';

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api')) {
    return false;
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  const db: DatabaseState = loadDatabase();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dateStr = now.toISOString().split('T')[0];

  try {
    // 1. GET /api/data
    if (req.method === 'GET' && url === '/api/data') {
      sendJson(res, 200, db);
      return true;
    }

    // 2. POST /api/attendance
    if (req.method === 'POST' && url === '/api/attendance') {
      const payload = await parseJsonBody(req);
      const {
        employeeId,
        date,
        status,
        lateHours = 0,
        lateMinutes = 0,
        notes = '',
        grooming,
        groomingNotes = '',
        operatorName = db.settings.activeOperator || 'محمد',
      } = payload;

      const employee = db.employees.find((e) => e.id === employeeId);
      if (!employee) {
        sendJson(res, 404, { error: 'العامل غير موجود' });
        return true;
      }

      const dailyRate = Math.round((employee.monthlySalary / (db.settings.daysPerMonth || 30)) * 100) / 100;
      const hourlyRate = Math.round((dailyRate / (db.settings.workHoursPerDay || 8)) * 100) / 100;

      // Check existing attendance for this date & employee
      const existingIndex = db.attendance.findIndex((a) => a.employeeId === employeeId && a.date === date);

      const record: AttendanceRecord = {
        id: existingIndex >= 0 ? db.attendance[existingIndex].id : generateId('att'),
        employeeId,
        employeeName: employee.name,
        departmentName: employee.departmentName,
        date,
        status,
        lateHours: Number(lateHours) || 0,
        lateMinutes: Number(lateMinutes) || 0,
        notes,
        grooming,
        groomingNotes,
        createdBy: operatorName,
        createdAt: existingIndex >= 0 ? db.attendance[existingIndex].createdAt : now.toISOString(),
        updatedAt: now.toISOString(),
      };

      if (existingIndex >= 0) {
        db.attendance[existingIndex] = record;
      } else {
        db.attendance.push(record);
      }

      // Remove auto penalties previously created for this worker on this date
      db.penalties = db.penalties.filter(
        (p) => !(p.employeeId === employeeId && p.date === date && (p.type === 'absence_unexcused' || p.type === 'absence_excused' || p.type === 'late'))
      );

      // Add automatic penalty if applicable
      let actionLabel = 'سجل حضور';
      if (status === 'absent_unexcused') {
        actionLabel = 'سجل غياب بدون عذر';
        const penaltyAmount = Math.round(dailyRate * 2 * 100) / 100;
        db.penalties.push({
          id: generateId('pen'),
          employeeId,
          employeeName: employee.name,
          departmentName: employee.departmentName,
          date,
          type: 'absence_unexcused',
          reason: 'غياب بدون عذر (خصم أجر يومين)',
          days: 2,
          amount: penaltyAmount,
          createdBy: operatorName,
          createdAt: now.toISOString(),
        });
      } else if (status === 'absent_excused') {
        actionLabel = 'سجل غياب بعذر';
        const penaltyAmount = Math.round(dailyRate * 1 * 100) / 100;
        db.penalties.push({
          id: generateId('pen'),
          employeeId,
          employeeName: employee.name,
          departmentName: employee.departmentName,
          date,
          type: 'absence_excused',
          reason: 'غياب بعذر (خصم أجر يوم)',
          days: 1,
          amount: penaltyAmount,
          createdBy: operatorName,
          createdAt: now.toISOString(),
        });
      } else if (status === 'leave_unpaid') {
        actionLabel = 'سجل إجازة بدون راتب';
        const penaltyAmount = Math.round(dailyRate * 1 * 100) / 100;
        db.penalties.push({
          id: generateId('pen'),
          employeeId,
          employeeName: employee.name,
          departmentName: employee.departmentName,
          date,
          type: 'absence_excused',
          reason: 'إجازة بدون راتب (خصم أجر يوم)',
          days: 1,
          amount: penaltyAmount,
          createdBy: operatorName,
          createdAt: now.toISOString(),
        });
      } else if (status === 'late') {
        const hours = Number(lateHours) || 1;
        actionLabel = `سجل تأخير ${hours} ساعة`;
        // Every 1 hour late = deduct 2 hours wage
        const penaltyAmount = Math.round(hours * 2 * hourlyRate * 100) / 100;
        db.penalties.push({
          id: generateId('pen'),
          employeeId,
          employeeName: employee.name,
          departmentName: employee.departmentName,
          date,
          type: 'late',
          reason: `تأخير ${hours} ساعة (خصم أجر ${hours * 2} ساعة)`,
          hours: hours * 2,
          amount: penaltyAmount,
          createdBy: operatorName,
          createdAt: now.toISOString(),
        });
      } else if (status === 'leave_paid') {
        actionLabel = 'سجل إجازة مدفوعة';
      }

      // Log activity
      const log: ActivityLog = {
        id: generateId('log'),
        userName: operatorName,
        action: `${actionLabel} للعامل ${employee.name}`,
        targetType: 'employee',
        targetId: employeeId,
        targetName: employee.name,
        date: date || dateStr,
        time: timeStr,
        createdAt: now.toISOString(),
      };
      db.activityLogs.unshift(log);
      if (db.activityLogs.length > 200) db.activityLogs.pop();

      saveDatabase(db);
      sendJson(res, 200, { success: true, record, db });
      return true;
    }

    // 3. POST /api/attendance/bulk-present (الجميع حاضر)
    if (req.method === 'POST' && url === '/api/attendance/bulk-present') {
      const payload = await parseJsonBody(req);
      const { date, operatorName = db.settings.activeOperator || 'محمد' } = payload;

      db.employees.forEach((emp) => {
        if (emp.status === 'active') {
          const existingIndex = db.attendance.findIndex((a) => a.employeeId === emp.id && a.date === date);
          const record: AttendanceRecord = {
            id: existingIndex >= 0 ? db.attendance[existingIndex].id : generateId('att'),
            employeeId: emp.id,
            employeeName: emp.name,
            departmentName: emp.departmentName,
            date,
            status: 'present',
            lateHours: 0,
            lateMinutes: 0,
            createdBy: operatorName,
            createdAt: existingIndex >= 0 ? db.attendance[existingIndex].createdAt : now.toISOString(),
            updatedAt: now.toISOString(),
          };
          if (existingIndex >= 0) {
            db.attendance[existingIndex] = record;
          } else {
            db.attendance.push(record);
          }
        }
      });

      // Clear absence penalties for this date
      db.penalties = db.penalties.filter(
        (p) => !(p.date === date && (p.type === 'absence_unexcused' || p.type === 'absence_excused' || p.type === 'late'))
      );

      // Add log
      db.activityLogs.unshift({
        id: generateId('log'),
        userName: operatorName,
        action: 'تحديد جميع العمال حاضر',
        targetType: 'employee',
        targetName: 'جميع العمال',
        date: date || dateStr,
        time: timeStr,
        createdAt: now.toISOString(),
      });
      if (db.activityLogs.length > 200) db.activityLogs.pop();

      saveDatabase(db);
      sendJson(res, 200, { success: true, db });
      return true;
    }

    // 4. POST /api/penalties (Manual penalty, quick penalty, or neglect)
    if (req.method === 'POST' && url === '/api/penalties') {
      const payload = await parseJsonBody(req);
      const {
        employeeId,
        date,
        type,
        amount,
        reason,
        hours,
        operatorName = db.settings.activeOperator || 'محمد',
        notes = '',
      } = payload;

      const employee = db.employees.find((e) => e.id === employeeId);
      if (!employee) {
        sendJson(res, 404, { error: 'العامل غير موجود' });
        return true;
      }

      const dailyRate = Math.round((employee.monthlySalary / (db.settings.daysPerMonth || 30)) * 100) / 100;
      const hourlyRate = Math.round((dailyRate / (db.settings.workHoursPerDay || 8)) * 100) / 100;

      let calcAmount = Number(amount) || 0;
      let finalReason = reason || '';

      if (type === 'neglect') {
        // Automatically deduct 2 hours wage
        calcAmount = Math.round(hourlyRate * 2 * 100) / 100;
        finalReason = finalReason || 'تقصير في أداء العمل (خصم ساعتين)';
      }

      const penalty: PenaltyRecord = {
        id: generateId('pen'),
        employeeId,
        employeeName: employee.name,
        departmentName: employee.departmentName,
        date: date || dateStr,
        type,
        reason: finalReason,
        amount: calcAmount,
        hours: type === 'neglect' ? 2 : hours,
        createdBy: operatorName,
        createdAt: now.toISOString(),
        notes,
      };

      db.penalties.push(penalty);

      db.activityLogs.unshift({
        id: generateId('log'),
        userName: operatorName,
        action: `سجل خصم ${calcAmount} ريال على العامل ${employee.name}`,
        targetType: 'employee',
        targetId: employeeId,
        targetName: employee.name,
        amount: calcAmount,
        date: date || dateStr,
        time: timeStr,
        createdAt: now.toISOString(),
      });
      if (db.activityLogs.length > 200) db.activityLogs.pop();

      saveDatabase(db);
      sendJson(res, 200, { success: true, penalty, db });
      return true;
    }

    // 5. DELETE /api/penalties
    if (req.method === 'DELETE' && url.startsWith('/api/penalties/')) {
      const penaltyId = url.replace('/api/penalties/', '').split('?')[0];
      const target = db.penalties.find((p) => p.id === penaltyId);
      db.penalties = db.penalties.filter((p) => p.id !== penaltyId);

      if (target) {
        db.activityLogs.unshift({
          id: generateId('log'),
          userName: db.settings.activeOperator || 'محمد',
          action: `إلغاء خصم بقيمة ${target.amount} ريال عن العامل ${target.employeeName}`,
          targetType: 'employee',
          targetId: target.employeeId,
          targetName: target.employeeName,
          amount: target.amount,
          date: dateStr,
          time: timeStr,
          createdAt: now.toISOString(),
        });
      }

      saveDatabase(db);
      sendJson(res, 200, { success: true, db });
      return true;
    }

    // 6. POST /api/equipment
    if (req.method === 'POST' && url === '/api/equipment') {
      const payload = await parseJsonBody(req);
      const { name, code, location, notes, operatorName = db.settings.activeOperator || 'محمد' } = payload;
      if (!name) {
        sendJson(res, 400, { error: 'اسم الجهاز مطلوب' });
        return true;
      }
      const newEquipment: Equipment = {
        id: generateId('eq'),
        name,
        code: code || `EQ-${db.equipment.length + 1}`,
        location: location || '',
        status: 'working',
        notes: notes || '',
        createdAt: now.toISOString(),
      };
      db.equipment.push(newEquipment);

      db.activityLogs.unshift({
        id: generateId('log'),
        userName: operatorName,
        action: `إضافة جهاز جديد: ${name}`,
        targetType: 'equipment',
        targetId: newEquipment.id,
        targetName: name,
        date: dateStr,
        time: timeStr,
        createdAt: now.toISOString(),
      });
      if (db.activityLogs.length > 200) db.activityLogs.pop();

      saveDatabase(db);
      sendJson(res, 200, { success: true, equipment: newEquipment, db });
      return true;
    }

    // 7. POST /api/equipment-checks
    if (req.method === 'POST' && url === '/api/equipment-checks') {
      const payload = await parseJsonBody(req);
      const {
        equipmentId,
        date,
        period = 'morning',
        status,
        notes = '',
        operatorName = db.settings.activeOperator || 'محمد',
      } = payload;

      const eq = db.equipment.find((e) => e.id === equipmentId);
      if (!eq) {
        sendJson(res, 404, { error: 'الجهاز غير موجود' });
        return true;
      }

      eq.status = status;

      const existingIndex = db.equipmentChecks.findIndex(
        (c) => c.equipmentId === equipmentId && c.date === date && c.period === period
      );

      const check: EquipmentCheck = {
        id: existingIndex >= 0 ? db.equipmentChecks[existingIndex].id : generateId('chk'),
        equipmentId,
        equipmentName: eq.name,
        date,
        period,
        status,
        notes,
        checkedBy: operatorName,
        checkedAt: now.toISOString(),
      };

      if (existingIndex >= 0) {
        db.equipmentChecks[existingIndex] = check;
      } else {
        db.equipmentChecks.push(check);
      }

      let statusLabel = 'يعمل بصورة طبيعية';
      if (status === 'broken') statusLabel = 'تسجيل عطل';
      if (status === 'maintenance') statusLabel = 'يحتاج صيانة';

      db.activityLogs.unshift({
        id: generateId('log'),
        userName: operatorName,
        action: `فحص ${eq.name}: ${statusLabel}`,
        targetType: 'equipment',
        targetId: equipmentId,
        targetName: eq.name,
        date: date || dateStr,
        time: timeStr,
        createdAt: now.toISOString(),
      });
      if (db.activityLogs.length > 200) db.activityLogs.pop();

      saveDatabase(db);
      sendJson(res, 200, { success: true, check, db });
      return true;
    }

    // 8. POST /api/daily-reports
    if (req.method === 'POST' && url === '/api/daily-reports') {
      const payload = await parseJsonBody(req);
      const {
        date,
        period = 'morning',
        supervisorName,
        notes = '',
        departmentSummaries = [],
        equipmentSummary,
        operatorName = db.settings.activeOperator || 'محمد',
      } = payload;

      const existingIndex = db.dailyReports.findIndex((r) => r.date === date && r.period === period);

      const report: DailyReport = {
        id: existingIndex >= 0 ? db.dailyReports[existingIndex].id : generateId('rep'),
        date,
        period,
        supervisorName: supervisorName || operatorName,
        notes,
        departmentSummaries,
        equipmentSummary: equipmentSummary || {
          total: db.equipment.length,
          working: db.equipment.filter((e) => e.status === 'working').length,
          broken: db.equipment.filter((e) => e.status === 'broken').length,
          maintenance: db.equipment.filter((e) => e.status === 'maintenance').length,
        },
        createdAt: now.toISOString(),
        createdBy: operatorName,
      };

      if (existingIndex >= 0) {
        db.dailyReports[existingIndex] = report;
      } else {
        db.dailyReports.push(report);
      }

      db.activityLogs.unshift({
        id: generateId('log'),
        userName: operatorName,
        action: `حفظ التقرير اليومي (${period === 'morning' ? 'صباحي' : 'مسائي'})`,
        targetType: 'report',
        targetName: `تقرير يوم ${date}`,
        date: date || dateStr,
        time: timeStr,
        createdAt: now.toISOString(),
      });
      if (db.activityLogs.length > 200) db.activityLogs.pop();

      saveDatabase(db);
      sendJson(res, 200, { success: true, report, db });
      return true;
    }

    // 9. POST /api/employees
    if (req.method === 'POST' && url === '/api/employees') {
      const payload = await parseJsonBody(req);
      const {
        id,
        name,
        departmentId,
        monthlySalary,
        status = 'active',
        phone = '',
        notes = '',
        operatorName = db.settings.activeOperator || 'محمد',
      } = payload;

      if (!name) {
        sendJson(res, 400, { error: 'اسم العامل مطلوب' });
        return true;
      }

      const dept = db.departments.find((d) => d.id === departmentId) || db.departments[0];
      const salary = Number(monthlySalary) || dept.defaultSalary || 2000;

      let employee: Employee;
      if (id) {
        const index = db.employees.findIndex((e) => e.id === id);
        if (index === -1) {
          sendJson(res, 404, { error: 'العامل غير موجود' });
          return true;
        }
        db.employees[index] = {
          ...db.employees[index],
          name,
          departmentId: dept.id,
          departmentName: dept.name,
          monthlySalary: salary,
          status,
          phone,
          notes,
        };
        employee = db.employees[index];

        db.activityLogs.unshift({
          id: generateId('log'),
          userName: operatorName,
          action: `تعديل بيانات العامل ${name}`,
          targetType: 'employee',
          targetId: employee.id,
          targetName: name,
          date: dateStr,
          time: timeStr,
          createdAt: now.toISOString(),
        });
      } else {
        const maxNum = db.employees.reduce((max, e) => (e.number > max ? e.number : max), 0);
        employee = {
          id: generateId('emp'),
          number: maxNum + 1,
          name,
          departmentId: dept.id,
          departmentName: dept.name,
          monthlySalary: salary,
          startDate: dateStr,
          status: 'active',
          phone,
          notes,
        };
        db.employees.push(employee);

        db.activityLogs.unshift({
          id: generateId('log'),
          userName: operatorName,
          action: `إضافة عامل جديد: ${name}`,
          targetType: 'employee',
          targetId: employee.id,
          targetName: name,
          date: dateStr,
          time: timeStr,
          createdAt: now.toISOString(),
        });
      }

      saveDatabase(db);
      sendJson(res, 200, { success: true, employee, db });
      return true;
    }

    // 10. POST /api/settings
    if (req.method === 'POST' && url === '/api/settings') {
      const payload = await parseJsonBody(req);
      db.settings = {
        ...db.settings,
        ...payload,
      };
      saveDatabase(db);
      sendJson(res, 200, { success: true, settings: db.settings, db });
      return true;
    }

    // 11. POST /api/reset-data
    if (req.method === 'POST' && url === '/api/reset-data') {
      const fresh = getInitialDatabase();
      saveDatabase(fresh);
      sendJson(res, 200, { success: true, db: fresh });
      return true;
    }

    return false;
  } catch (err: any) {
    console.error('API Error:', err);
    sendJson(res, 500, { error: err?.message || 'Server error' });
    return true;
  }
}
