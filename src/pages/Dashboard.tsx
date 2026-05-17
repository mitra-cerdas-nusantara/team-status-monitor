import { useState, useEffect } from "react";
import { format, subDays, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, User, Briefcase } from "lucide-react";
import { cn } from "../lib/utils";

type StatusType = "Work" | "Sick" | "Leave" | "Off Day";

interface EmployeeStatus {
  id: number | null;
  employee_id: number;
  name: string;
  job_title: string;
  status: StatusType | null;
  color_index?: number;
}

const statusConfig: Record<StatusType, { bg: string; text: string; ring: string }> = {
  "Work": { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/20" },
  "Sick": { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-600/10" },
  "Leave": { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-600/20" },
  "Off Day": { bg: "bg-gray-200", text: "text-gray-800", ring: "ring-gray-600/30" },
};

const PALETTE = [
  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', hoverBorder: '#ef4444' }, // Red
  { bg: '#ffedd5', text: '#9a3412', border: '#fdba74', hoverBorder: '#f97316' }, // Orange
  { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', hoverBorder: '#f59e0b' }, // Amber
  { bg: '#ecfccb', text: '#3f6212', border: '#bef264', hoverBorder: '#84cc16' }, // Lime
  { bg: '#dcfce7', text: '#166534', border: '#86efac', hoverBorder: '#22c55e' }, // Green
  { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7', hoverBorder: '#10b981' }, // Emerald
  { bg: '#ccfbf1', text: '#115e59', border: '#5eead4', hoverBorder: '#14b8a6' }, // Teal
  { bg: '#cffafe', text: '#155e75', border: '#67e8f9', hoverBorder: '#06b6d4' }, // Cyan
  { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc', hoverBorder: '#0ea5e9' }, // Sky
  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', hoverBorder: '#3b82f6' }, // Blue
  { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc', hoverBorder: '#6366f1' }, // Indigo
  { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd', hoverBorder: '#8b5cf6' }, // Violet
  { bg: '#fae8ff', text: '#86198f', border: '#f0abfc', hoverBorder: '#d946ef' }, // Fuchsia
  { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4', hoverBorder: '#ec4899' }, // Pink
  { bg: '#ffe4e6', text: '#9f1239', border: '#fda4af', hoverBorder: '#f43f5e' }, // Rose
];

function EmployeeCard({ emp, handleUpdateStatus }: { emp: EmployeeStatus, handleUpdateStatus: (id: number, status: StatusType) => void, key?: any }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Use assigned color_index
  const index = Math.max(0, Math.min(PALETTE.length - 1, emp.color_index || 0));
  const colors = PALETTE[index];

  return (
    <div 
      className="bg-white p-5 rounded-xl shadow-sm flex flex-col gap-5 transition-colors border-2"
      style={{ borderColor: isHovered ? colors.hoverBorder : colors.border }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0 text-lg"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {emp.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{emp.name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
            <Briefcase size={14} />
            {emp.job_title}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-gray-50">
        {(["Work", "Sick", "Leave", "Off Day"] as StatusType[]).map((status) => {
          const isSelected = emp.status === status;
          const config = statusConfig[status];
          
          return (
            <button
              key={status}
              onClick={() => handleUpdateStatus(emp.employee_id, status)}
              className={cn(
                "py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all w-full",
                isSelected 
                  ? `${config.bg} ${config.text} border-transparent ring-1 ring-inset ${config.ring}`
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              )}
            >
              {isSelected && <CheckCircle2 size={14} className="shrink-0" />}
              {status}
            </button>
          )
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [date, setDate] = useState<Date>(new Date());
  const [employees, setEmployees] = useState<EmployeeStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const dateStr = format(date, "yyyy-MM-dd");

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/statuses/${dateStr}`);
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to fetch statuses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [dateStr]);

  const handleUpdateStatus = (employee_id: number, status: StatusType) => {
    const updatedEmployees = employees.map(emp => 
      emp.employee_id === employee_id ? { ...emp, status } : emp
    );
    setEmployees(updatedEmployees);

    fetch("/api/statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id, date: dateStr, status }),
    }).catch((error) => {
      console.error("Failed to update status", error);
      fetchStatuses(); // Revert on failure
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Daily Status</h1>
          <p className="text-sm text-gray-500">Monitor and update today's workforce availability.</p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border">
          <button 
            onClick={() => setDate(d => subDays(d, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="w-32 text-center font-medium text-sm text-gray-700">
            {format(date, "MMM dd, yyyy")}
          </div>
          <button 
            onClick={() => setDate(d => addDays(d, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">Loading...</div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
            <User className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No employees found</h3>
          <p className="text-gray-500">Add employees in the settings tab to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...employees].sort((a, b) => {
            const getOrder = (status: StatusType | null) => {
              if (!status) return 5;
              return { "Work": 1, "Sick": 2, "Leave": 3, "Off Day": 4 }[status] || 5;
            };
            return getOrder(a.status) - getOrder(b.status) || a.name.localeCompare(b.name);
          }).map((emp) => (
            <EmployeeCard key={emp.employee_id} emp={emp} handleUpdateStatus={handleUpdateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
