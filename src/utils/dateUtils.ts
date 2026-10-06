// Date utilities with Arabic day & month names, English numerals
const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function formatDateToArabic(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = ARABIC_DAYS[date.getDay()];
  const monthName = ARABIC_MONTHS[month - 1];
  return `${dayName} ${String(day).padStart(2, '0')} ${monthName} ${year}`;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function getPreviousDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

export function getNextDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

export function getAvailableMonths(): { value: string; label: string }[] {
  // Financial year from Oct 2026 to Oct 2027
  return [
    { value: '2026-10', label: 'أكتوبر 2026' },
    { value: '2026-11', label: 'نوفمبر 2026' },
    { value: '2026-12', label: 'ديسمبر 2026' },
    { value: '2027-01', label: 'يناير 2027' },
    { value: '2027-02', label: 'فبراير 2027' },
    { value: '2027-03', label: 'مارس 2027' },
    { value: '2027-04', label: 'أبريل 2027' },
    { value: '2027-05', label: 'مايو 2027' },
    { value: '2027-06', label: 'يونيو 2027' },
    { value: '2027-07', label: 'يوليو 2027' },
    { value: '2027-08', label: 'أغسطس 2027' },
    { value: '2027-09', label: 'سبتمبر 2027' },
    { value: '2027-10', label: 'أكتوبر 2027' },
  ];
}
