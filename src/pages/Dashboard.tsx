import { useState, useEffect, useRef } from "react";
import { format, subDays, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, User, Briefcase, ChevronDown, Lock, Thermometer } from "lucide-react";
import { cn } from "../lib/utils";
import { PALETTE } from "../lib/palette";
import { useSettings } from "../context/SettingsContext";

type StatusType = "Work" | "Sick" | "Leave" | "Off Day";

interface EmployeeStatus {
  id: number | null;
  employee_id: number;
  name: string;
  job_title: string;
  status: StatusType | null;
  color_index?: number;
  avatar?: string | null;
}

const statusConfig: Record<StatusType, { bg: string; text: string; ring: string }> = {
  "Work": { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/20" },
  "Sick": { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-600/10" },
  "Leave": { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-600/20" },
  "Off Day": { bg: "bg-gray-200", text: "text-gray-800", ring: "ring-gray-600/30" },
};


function EmployeeCard({ 
  emp, 
  handleUpdateStatus, 
  isSuperAdmin, 
  isNotToday 
}: { 
  emp: EmployeeStatus; 
  handleUpdateStatus: (id: number, status: StatusType) => void; 
  isSuperAdmin: boolean; 
  isNotToday: boolean; 
  key?: any; 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleDropdownToggle = () => {
    if (isLocked) return;

    if (!isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If the space below is less than 240px, display the options upward
      setOpenUpward(spaceBelow < 240);
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Use assigned color_index
  const index = Math.max(0, Math.min(PALETTE.length - 1, emp.color_index || 0));
  const colors = PALETTE[index];

  const currentStatus = emp.status;
  const currentConfig = currentStatus ? statusConfig[currentStatus] : null;

  const isLocked = isNotToday && !isSuperAdmin;
  const isLessAppeared = currentStatus === "Sick" || currentStatus === "Leave" || currentStatus === "Off Day";

  return (
    <div
      className={cn(
        "p-5 rounded-xl shadow-sm flex flex-col justify-center min-h-[96px] transition-all duration-300 border relative",
        isLessAppeared
          ? "bg-gray-50/60 border-gray-200/60 opacity-55 grayscale-[35%]"
          : "bg-white"
      )}
      style={{
        borderColor: isLessAppeared ? undefined : (isHovered ? colors.hoverBorder : colors.border)
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between gap-4 w-full relative">
        {/* Left side: Avatar, Name, and Job Title */}
        <div className="flex items-center gap-4 min-w-0">
          {emp.avatar ? (
            <img
              src={emp.avatar}
              alt={emp.name}
              className="w-12 h-12 rounded-full object-cover shrink-0 shadow-sm border border-gray-100"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0 text-lg"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {emp.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-base">{emp.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5 truncate">
              <Briefcase size={14} className="shrink-0" />
              <span className="truncate">{emp.job_title}</span>
            </div>
          </div>
        </div>

        {/* Right side: Status Dropdown Pill */}
        <div className="relative shrink-0">
          <button
            ref={buttonRef}
            onClick={handleDropdownToggle}
            disabled={isLocked}
            title={isLocked ? "Past and future date status changes require Superadmin passcode" : undefined}
            className={cn(
              "px-4 py-2 rounded-full text-2xl font-extrabold border flex items-center gap-2.5 transition-all shadow-sm select-none",
              isLocked ? "cursor-not-allowed opacity-60 border-gray-200" : "cursor-pointer",
              currentStatus && currentConfig
                ? `${currentConfig.bg} ${currentConfig.text} border-transparent ring-1 ring-inset ${currentConfig.ring} ${!isLocked ? "hover:opacity-90" : ""} ${currentStatus === "Work" ? "animate-work-glow-breath" : ""}`
                : `bg-gray-50 text-gray-500 border-gray-100 ${!isLocked ? "hover:bg-gray-100 hover:text-gray-700" : ""}`
            )}
          >
            <span className="flex items-center gap-2">
              {currentStatus === "Work" && (
                <span className="relative flex h-2.5 w-2.5 mr-0.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-work-pulse-ring opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600 animate-work-pulse-dot" />
                </span>
              )}
              {currentStatus === "Sick" && (
                <Thermometer size={20} className="text-rose-600 animate-pulse mr-0.5 shrink-0" />
              )}
              <span>{currentStatus || "Set Status"}</span>
            </span>
            {isLocked ? (
              <Lock size={16} className="text-gray-400 shrink-0" />
            ) : (
              <ChevronDown size={20} className={cn("transition-transform duration-200 shrink-0", isDropdownOpen ? "rotate-180" : "")} />
            )}
          </button>

          {/* Click outside backdrop */}
          {isDropdownOpen && (
            <div
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setIsDropdownOpen(false)}
            />
          )}

          {/* Dropdown Options Box */}
          {isDropdownOpen && (
            <div className={cn(
              "absolute right-0 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1.5 overflow-hidden animate-in fade-in duration-150",
              openUpward 
                ? "bottom-full mb-2 slide-in-from-bottom-2" 
                : "top-full mt-2 slide-in-from-top-2"
            )}>
              <div className="px-3.5 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                Select Status
              </div>
              {(["Work", "Sick", "Leave", "Off Day"] as StatusType[]).map((status) => {
                const isSelected = currentStatus === status;
                const config = statusConfig[status];
                return (
                  <button
                    key={status}
                    onClick={() => {
                      handleUpdateStatus(emp.employee_id, status);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-3.5 py-3 text-left text-base font-bold flex items-center justify-between transition-colors hover:bg-gray-50 cursor-pointer",
                      isSelected ? `${config.text} bg-gray-50/50` : "text-gray-700"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {status === "Sick" && <Thermometer size={16} className="text-rose-600 shrink-0" />}
                      <span>{status}</span>
                    </span>
                    {isSelected && <CheckCircle2 size={16} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isSuperAdmin } = useSettings();
  const [date, setDate] = useState<Date>(new Date());
  const [employees, setEmployees] = useState<EmployeeStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const dateStr = format(date, "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isNotToday = dateStr !== todayStr;

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
    if (isNotToday && !isSuperAdmin) {
      console.warn("Unauthorized: Past or future date status updates are restricted to Superadmin mode.");
      return;
    }
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

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">Loading...</div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
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
            <EmployeeCard 
              key={emp.employee_id} 
              emp={emp} 
              handleUpdateStatus={handleUpdateStatus} 
              isSuperAdmin={isSuperAdmin}
              isNotToday={isNotToday}
            />
          ))}
        </div>
      )}
    </div>
  );
}
