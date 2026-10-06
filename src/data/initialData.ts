import { Employee, Department, Equipment, SystemSettings } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'wash', name: 'قسم الغسيل', defaultSalary: 2000 },
  { id: 'steam', name: 'قسم البخار', defaultSalary: 2000 },
  { id: 'dry', name: 'قسم التنشيف', defaultSalary: 1500 },
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  { id: 'eq-1', name: 'ماكينة أوتوماتيك', code: 'AUTO-01', location: 'المسار الرئيسي', status: 'working', createdAt: '2026-10-03' },
  { id: 'eq-2', name: 'مياه الصرف', code: 'DRAIN-01', location: 'محطة الصرف والتكرير', status: 'working', createdAt: '2026-10-03' },
  { id: 'eq-3', name: 'ماكينة 1', code: 'M-01', location: 'المحطة 1', status: 'working', createdAt: '2026-10-03' },
  { id: 'eq-4', name: 'ماكينة 2', code: 'M-02', location: 'المحطة 2', status: 'working', createdAt: '2026-10-03' },
  { id: 'eq-5', name: 'ماكينة 3', code: 'M-03', location: 'المحطة 3', status: 'working', createdAt: '2026-10-03' },
  { id: 'eq-6', name: 'ماكينة 4', code: 'M-04', location: 'المحطة 4', status: 'working', createdAt: '2026-10-03' },
];

export const INITIAL_SETTINGS: SystemSettings = {
  washSalary: 2000,
  steamSalary: 2000,
  drySalary: 1500,
  workHoursPerDay: 8,
  daysPerMonth: 30,
  laundryName: 'مغسلة المنار لخدمات السيارات',
  activeOperator: 'محمد',
  googleSheetConnected: false,
};

// Initial 36 Workers as given in the specification
const rawWorkersGroup1 = [
  'موسي عثمان',
  'محمد جبريل',
  'اربعه علي',
  'محمد علي نور',
  'مشتاق احمد',
  'عبدهلل',
  'روبيول',
  'محمد يوسف',
  'شفيق حسن',
  'محمد روبيل',
  'نور ابو سن',
  'مهند',
  'عمر ادام',
];

const rawWorkersGroup2 = [
  'مصطفي سليمان',
  'شبوج',
  'ليبان',
  'شيبون',
  'حسن عثمان',
  'حفيظ الدين',
  'علي حسن',
  'عبد الفتاح',
  'مقبول',
  'عبدهلل محمد نور',
  'امجد خان',
  'ابراهيم معلم',
  'محمد عودو',
  'ابو بكر',
  'محمد حسن',
  'محمد علي عبدة',
  'سعيد معلم',
  'حسن عبدة',
  'ادام معلم',
  'محمد ديخ',
  'محمد شيخ',
  'هارون محمد',
  'كبير',
];

export const INITIAL_EMPLOYEES: Employee[] = [];

// Populate workers distributed across Wash, Steam, Dry
// Wash (first 13)
rawWorkersGroup1.forEach((name, index) => {
  INITIAL_EMPLOYEES.push({
    id: `emp-${index + 1}`,
    number: index + 1,
    name,
    departmentId: 'wash',
    departmentName: 'قسم الغسيل',
    monthlySalary: 2000,
    startDate: '2026-10-03',
    status: 'active',
  });
});

// Steam (next 12)
rawWorkersGroup2.slice(0, 12).forEach((name, index) => {
  const num = 14 + index;
  INITIAL_EMPLOYEES.push({
    id: `emp-${num}`,
    number: num,
    name,
    departmentId: 'steam',
    departmentName: 'قسم البخار',
    monthlySalary: 2000,
    startDate: '2026-10-03',
    status: 'active',
  });
});

// Dry (remaining 11)
rawWorkersGroup2.slice(12).forEach((name, index) => {
  const num = 26 + index;
  INITIAL_EMPLOYEES.push({
    id: `emp-${num}`,
    number: num,
    name,
    departmentId: 'dry',
    departmentName: 'قسم التنشيف',
    monthlySalary: 1500,
    startDate: '2026-10-03',
    status: 'active',
  });
});

export function getInitialDatabase(): import('../types').DatabaseState {
  const initialLogs: import('../types').ActivityLog[] = [
    {
      id: 'log-seed-1',
      userName: 'محمد',
      action: 'تهيئة دفتر المغسلة الإلكتروني',
      targetType: 'system',
      targetName: 'النظام',
      date: '2026-10-03',
      time: '07:00',
      createdAt: '2026-10-03T07:00:00Z',
    },
    {
      id: 'log-seed-2',
      userName: 'محمد',
      action: 'تسجيل الحضور الافتراضي للعمال',
      targetType: 'employee',
      targetName: 'جميع العمال',
      date: '2026-10-03',
      time: '07:05',
      createdAt: '2026-10-03T07:05:00Z',
    },
    {
      id: 'log-seed-3',
      userName: 'بلال',
      action: 'فحص ماكينة أوتوماتيك ومياه الصرف',
      targetType: 'equipment',
      targetName: 'ماكينة أوتوماتيك',
      date: '2026-10-03',
      time: '07:15',
      createdAt: '2026-10-03T07:15:00Z',
    },
  ];

  return {
    departments: INITIAL_DEPARTMENTS,
    employees: INITIAL_EMPLOYEES,
    attendance: [],
    penalties: [],
    equipment: INITIAL_EQUIPMENT,
    equipmentChecks: [],
    dailyReports: [],
    activityLogs: initialLogs,
    settings: INITIAL_SETTINGS,
    users: [
      { id: 'u1', name: 'محمد', role: 'supervisor' },
      { id: 'u2', name: 'بلال', role: 'supervisor' },
      { id: 'u3', name: 'عبدالله', role: 'supervisor' },
    ],
  };
}
