import React, { useState } from 'react';
import { DatabaseState, Employee, DepartmentId, WorkerStatus } from '../types';
import { saveEmployee } from '../services/api';
import { Plus, Search, Edit2, UserX, UserCheck, Phone, CheckCircle2 } from 'lucide-react';

interface EmployeesViewProps {
  db: DatabaseState;
  onRefresh: () => void;
  activeOperator: string;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ db, onRefresh, activeOperator }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [modalEmployee, setModalEmployee] = useState<Partial<Employee> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredEmployees = db.employees.filter((emp) => {
    if (selectedDept !== 'all' && emp.departmentId !== selectedDept) return false;
    if (selectedStatus !== 'all' && emp.status !== selectedStatus) return false;
    if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmployee || !modalEmployee.name) {
      alert('الرجاء إدخال اسم العامل');
      return;
    }
    try {
      await saveEmployee({
        id: modalEmployee.id,
        name: modalEmployee.name,
        departmentId: modalEmployee.departmentId || 'wash',
        monthlySalary: Number(modalEmployee.monthlySalary) || 2000,
        status: modalEmployee.status || 'active',
        phone: modalEmployee.phone || '',
        notes: modalEmployee.notes || '',
        operatorName: activeOperator,
      });
      showToast(modalEmployee.id ? '✓ تم تحديث بيانات العامل' : '✓ تمت إضافة العامل بنجاح');
      setModalEmployee(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const newStatus: WorkerStatus = emp.status === 'active' ? 'suspended' : 'active';
    try {
      await saveEmployee({
        id: emp.id,
        name: emp.name,
        departmentId: emp.departmentId,
        monthlySalary: emp.monthlySalary,
        status: newStatus,
        phone: emp.phone,
        notes: emp.notes,
        operatorName: activeOperator,
      });
      showToast(`✓ تم تغيير حالة العامل ${emp.name} إلى: ${newStatus === 'active' ? 'يعمل' : 'موقوف'}`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            سجل عمال المغسلة
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            إدارة بيانات العمال والأقسام
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إجمالي العمال: {db.employees.length} عامل موزعين على 3 أقسام
          </p>
        </div>

        <button
          onClick={() =>
            setModalEmployee({
              name: '',
              departmentId: 'wash',
              monthlySalary: 2000,
              status: 'active',
            })
          }
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة عامل جديد</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedDept === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع الأقسام
          </button>
          {db.departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedDept === dept.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث عن عامل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Workers Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3.5">#</th>
                <th className="p-3.5">اسم العامل</th>
                <th className="p-3.5">القسم</th>
                <th className="p-3.5">الراتب الشهري</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5">رقم الجوال</th>
                <th className="p-3.5">ملاحظات</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 text-slate-400 tabular-nums">{emp.number}</td>
                  <td className="p-3.5 font-bold text-slate-900">{emp.name}</td>
                  <td className="p-3.5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {emp.departmentName}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-800 tabular-nums">
                    {emp.monthlySalary} ريال
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        emp.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {emp.status === 'active' ? 'يعمل' : 'موقوف'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 tabular-nums">
                    {emp.phone || '-'}
                  </td>
                  <td className="p-3.5 text-slate-500 truncate max-w-xs">
                    {emp.notes || '-'}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setModalEmployee(emp)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="تعديل بيانات العامل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          emp.status === 'active'
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={emp.status === 'active' ? 'إيقاف العامل' : 'تفعيل العامل'}
                      >
                        {emp.status === 'active' ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Worker */}
      {modalEmployee && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-4">
              {modalEmployee.id ? 'تعديل بيانات العامل' : 'إضافة عامل جديد'}
            </h4>

            <form onSubmit={handleSaveModal} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم العامل *
                </label>
                <input
                  type="text"
                  required
                  placeholder="اسم العامل بالكامل"
                  value={modalEmployee.name || ''}
                  onChange={(e) =>
                    setModalEmployee({ ...modalEmployee, name: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  القسم *
                </label>
                <select
                  value={modalEmployee.departmentId || 'wash'}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    const dept = db.departments.find((d) => d.id === deptId);
                    setModalEmployee({
                      ...modalEmployee,
                      departmentId: deptId,
                      // auto suggest default salary if new
                      monthlySalary: modalEmployee.id
                        ? modalEmployee.monthlySalary
                        : dept?.defaultSalary || 2000,
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden cursor-pointer"
                >
                  {db.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (الراتب الأساسي: {d.defaultSalary} ريال)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الراتب الشهري (بالريال) *
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  step="50"
                  value={modalEmployee.monthlySalary || 2000}
                  onChange={(e) =>
                    setModalEmployee({
                      ...modalEmployee,
                      monthlySalary: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الجوال (اختياري)
                </label>
                <input
                  type="tel"
                  placeholder="05xxxxxxxx"
                  value={modalEmployee.phone || ''}
                  onChange={(e) =>
                    setModalEmployee({ ...modalEmployee, phone: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات
                </label>
                <textarea
                  rows={2}
                  placeholder="أي ملاحظات تخص العامل..."
                  value={modalEmployee.notes || ''}
                  onChange={(e) =>
                    setModalEmployee({ ...modalEmployee, notes: e.target.value })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                >
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setModalEmployee(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
