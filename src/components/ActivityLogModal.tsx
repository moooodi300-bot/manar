import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { X, Search, Clock, Filter, User } from 'lucide-react';

interface ActivityLogModalProps {
  logs: ActivityLog[];
  onClose: () => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ logs, onClose }) => {
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const users = ['محمد', 'بلال', 'عبدالله'];

  const filteredLogs = logs.filter((log) => {
    if (selectedUser !== 'all' && log.userName !== selectedUser) return false;
    if (
      searchQuery &&
      !log.action.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.targetName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">سجل الأعمال والعمليات الكامل</h3>
              <p className="text-xs text-slate-500">
                متابعة دقيقة لكل إجراء تم اتخاذه مع اسم المنفذ والتوقيت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedUser('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedUser === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              جميع المستخدمين
            </button>
            {users.map((u) => (
              <button
                key={u}
                onClick={() => setSelectedUser(u)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  selectedUser === u
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في السجل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              لا توجد عمليات تطابق البحث
            </div>
          ) : (
            filteredLogs.map((log) => {
              let dotColor = 'bg-emerald-500';
              if (log.action.includes('غياب') || log.action.includes('عطل')) {
                dotColor = 'bg-rose-500';
              } else if (log.action.includes('تأخير') || log.action.includes('تقصير') || log.action.includes('صيانة')) {
                dotColor = 'bg-amber-500';
              } else if (log.action.includes('خصم')) {
                dotColor = 'bg-purple-500';
              }

              return (
                <div
                  key={log.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {log.userName}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {log.action}
                        </span>
                      </div>
                      {log.targetName && log.targetName !== log.userName && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          العنصر: {log.targetName}
                          {log.amount ? ` · المبلغ: ${log.amount} ريال` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <div className="text-xs font-medium text-slate-700 tabular-nums">
                      {log.time}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      {log.date}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 text-left">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
