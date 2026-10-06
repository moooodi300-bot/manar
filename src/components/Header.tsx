import React from 'react';
import { formatDateToArabic, getPreviousDate, getNextDate } from '../utils/dateUtils';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, User, RefreshCw, Printer, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  activeOperator: string;
  onOperatorChange: (name: string) => void;
  onRefresh: () => void;
  onOpenPrint: () => void;
  onOpenGoogleSheets?: () => void;
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  activeOperator,
  onOperatorChange,
  onRefresh,
  onOpenPrint,
  onOpenGoogleSheets,
  isLoading,
}) => {
  const operators = ['محمد', 'بلال', 'عبدالله'];

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            م
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              نظام إدارة عمال المغسلة
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              دفتر المغسلة الإلكتروني اليومي
            </p>
          </div>
        </div>

        {/* Zone 2: Date Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => onDateChange(getPreviousDate(currentDate))}
            className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            title="اليوم السابق"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="hidden md:inline">السابق</span>
          </button>

          <div className="relative flex items-center px-2 sm:px-3 py-1 bg-white rounded-lg shadow-xs text-xs sm:text-sm font-semibold text-slate-800">
            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 ml-1.5 shrink-0" />
            <span className="whitespace-nowrap">{formatDateToArabic(currentDate)}</span>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="اختر تاريخاً"
            />
          </div>

          <button
            onClick={() => onDateChange(getNextDate(currentDate))}
            className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            title="اليوم التالي"
          >
            <span className="hidden md:inline">التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Zone 3: Operator & Quick Action */}
        <div className="flex items-center gap-2">
          {/* Google Sheets Sync Button */}
          {onOpenGoogleSheets && (
            <button
              onClick={onOpenGoogleSheets}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="الربط والمزامنة مع Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Google Sheets</span>
            </button>
          )}

          {/* Active Operator Selector */}
          <div className="flex items-center bg-slate-100 text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium">
            <User className="w-3.5 h-3.5 ml-1.5 text-slate-500 shrink-0" />
            <span className="text-slate-500 ml-1 hidden sm:inline">القائم بالإجراء:</span>
            <select
              value={activeOperator}
              onChange={(e) => onOperatorChange(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
            >
              {operators.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Print A4 */}
          <button
            onClick={onOpenPrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-medium shadow-xs transition-colors cursor-pointer"
            title="طباعة التقرير بحجم A4"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة A4</span>
          </button>
        </div>
      </div>
    </header>
  );
};

