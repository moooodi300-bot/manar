import React from 'react';
import { Home, BookOpen, Users, Wrench, DollarSign, FileText, Settings } from 'lucide-react';

export type TabType = 'home' | 'notebook' | 'employees' | 'equipment' | 'payroll' | 'reports' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'الرئيسية', icon: Home },
    { id: 'notebook' as TabType, label: 'دفتر اليوم', icon: BookOpen },
    { id: 'employees' as TabType, label: 'العمال', icon: Users },
    { id: 'equipment' as TabType, label: 'المعدات', icon: Wrench },
    { id: 'payroll' as TabType, label: 'الرواتب', icon: DollarSign },
    { id: 'reports' as TabType, label: 'التقارير', icon: FileText },
    { id: 'settings' as TabType, label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5">
      <div className="max-w-4xl mx-auto flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-700 bg-emerald-50/80 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-600 scale-105' : 'text-slate-400'}`} />
              <span className="text-[11px] leading-tight whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
