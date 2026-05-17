import React, { useState, useEffect } from "react";
import { 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  Settings as SettingsIcon, 
  Users, 
  UploadCloud, 
  Check, 
  AlertCircle, 
  X, 
  RefreshCw,
  Lock,
  Key,
  Eye,
  EyeOff,
  Edit,
  User
} from "lucide-react";
import { PALETTE } from "../lib/palette";
import { cn } from "../lib/utils";
import { useSettings } from "../context/SettingsContext";

interface Employee {
  id: number;
  name: string;
  job_title: string;
  color_index?: number;
  avatar?: string | null;
}

export default function Settings() {
  const { settings, updateSettings, isSuperAdmin, unlockSuperAdmin, changePasscode } = useSettings();
  const [activeTab, setActiveTab] = useState<"branding" | "team">("branding");
  
  // Lock Screen State
  const [passcode, setPasscode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // App Branding State
  const [appNameInput, setAppNameInput] = useState("");
  const [appTitleInput, setAppTitleInput] = useState("");
  const [logoInput, setLogoInput] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Security Password Change State
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmNewPasscode, setConfirmNewPasscode] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  
  // Toast notifications state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Team Directory State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [colorIndex, setColorIndex] = useState(0);
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);

  // Editing Team Member State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editColorIndex, setEditColorIndex] = useState(0);
  const [editAvatar, setEditAvatar] = useState("");
  const [editLoading, setEditLoading] = useState(false);


  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setAppNameInput(settings.app_name);
      setAppTitleInput(settings.app_title);
      setLogoInput(settings.app_logo);
    }
  }, [settings]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees", error);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchEmployees();
    }
  }, [isSuperAdmin]);

  // Lock screen handler - Awaits server-side passcode verification
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsShaking(false);

    const success = await unlockSuperAdmin(passcode);
    if (success) {
      setToast({ type: "success", message: "Superadmin privilege unlocked!" });
      setTimeout(() => setToast(null), 4000);
      setPasscode("");
    } else {
      setErrorMsg("Invalid superadmin passcode. Access Denied.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  // Branding handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: "error", message: "Logo image must be less than 2MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoInput(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoInput("");
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appNameInput.trim() || !appTitleInput.trim()) {
      setToast({ type: "error", message: "App name and page title are required." });
      return;
    }

    setSaveLoading(true);
    setToast(null);

    const success = await updateSettings({
      app_name: appNameInput.trim(),
      app_title: appTitleInput.trim(),
      app_logo: logoInput,
    });

    setSaveLoading(false);
    if (success) {
      setToast({ type: "success", message: "Application branding settings saved successfully!" });
      setTimeout(() => setToast(null), 4000);
    } else {
      setToast({ type: "error", message: "Failed to save settings. Please try again." });
    }
  };

  // Passcode changer handler
  const handleChangePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasscode.length < 4) {
      setToast({ type: "error", message: "New passcode must be at least 4 characters." });
      return;
    }
    if (newPasscode !== confirmNewPasscode) {
      setToast({ type: "error", message: "New passcodes do not match." });
      return;
    }

    setSecurityLoading(true);
    const result = await changePasscode(currentPasscode, newPasscode);
    setSecurityLoading(false);

    if (result.success) {
      setToast({ type: "success", message: "Superadmin passcode updated successfully!" });
      setTimeout(() => setToast(null), 4000);
      setCurrentPasscode("");
      setNewPasscode("");
      setConfirmNewPasscode("");
    } else {
      setToast({ type: "error", message: result.error || "Failed to update passcode." });
    }
  };

  // Team Directory handlers
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      setToast({ type: "error", message: "Avatar image must be less than 1MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        if (isEdit) {
          setEditAvatar(event.target.result as string);
        } else {
          setAvatar(event.target.result as string);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !jobTitle) return;
    
    setLoading(true);
    try {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          job_title: jobTitle.trim(), 
          color_index: colorIndex,
          avatar: avatar || null
        }),
      });
      setName("");
      setJobTitle("");
      setColorIndex(0);
      setAvatar("");
      fetchEmployees();
      setToast({ type: "success", message: `Successfully added ${name} to team.` });
      setTimeout(() => setToast(null), 4000);
    } catch (error) {
      console.error("Failed to add employee", error);
      setToast({ type: "error", message: "Failed to add team member." });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditJobTitle(emp.job_title);
    setEditColorIndex(emp.color_index || 0);
    setEditAvatar(emp.avatar || "");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editName.trim() || !editJobTitle.trim()) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          job_title: editJobTitle.trim(),
          color_index: editColorIndex,
          avatar: editAvatar || null
        }),
      });

      if (res.ok) {
        setEditingEmployee(null);
        fetchEmployees();
        setToast({ type: "success", message: `Successfully updated employee details.` });
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast({ type: "error", message: "Failed to update employee details." });
      }
    } catch (error) {
      console.error("Failed to update employee", error);
      setToast({ type: "error", message: "Failed to update employee details." });
    } finally {
      setEditLoading(false);
    }
  };


  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this employee? All their status logs will also be deleted.")) {
      return;
    }
    try {
      await fetch(`/api/employees/${id}`, { method: "DELETE" });
      fetchEmployees();
      setToast({ type: "success", message: "Team member removed successfully." });
      setTimeout(() => setToast(null), 4000);
    } catch (error) {
      console.error("Failed to delete employee", error);
      setToast({ type: "error", message: "Failed to delete employee." });
    }
  };

  // Render Lock Screen if user is not Superadmin
  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 animate-in fade-in duration-300">
        {/* Dynamic CSS Shake Injection */}
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
            20%, 40%, 60%, 80% { transform: translateX(6px); }
          }
          .animate-shake {
            animation: shake 0.45s cubic-bezier(.36,.07,.19,.97) both;
          }
        `}</style>

        <div className={cn(
          "bg-white rounded-2xl shadow-xl border border-gray-150 p-8 text-center space-y-6 transition-all duration-300",
          isShaking && "animate-shake border-rose-300 shadow-rose-50"
        )}>
          {/* Animated Lock Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm relative">
            <Lock size={28} className="animate-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-amber-400/10 animate-ping" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Superadmin Access Required</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              This page contains general configurations, branding options, and employee catalog management. Please elevate your privileges to access these settings.
            </p>
          </div>
          
          {/* Passcode Form */}
          <form onSubmit={handleUnlock} className="space-y-4 pt-2">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Enter passcode"
                className="w-full rounded-xl border border-gray-300 shadow-inner px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center font-semibold tracking-wide transition-all text-sm"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                title={showPassword ? "Hide Passcode" : "Show Passcode"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {errorMsg && (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2.5 flex items-center justify-center gap-2 animate-in fade-in duration-200">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-md flex items-center justify-center gap-2 hover:shadow-indigo-100 cursor-pointer"
            >
              <Key size={16} />
              Unlock Settings
            </button>
          </form>

          {/* Dynamic Guide Note */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs text-gray-500 leading-relaxed flex items-center justify-center gap-2">
            <span>💡 Note:</span>
            <span className="font-semibold text-indigo-600">Enter the custom passcode configured during system setup.</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Settings panel if Superadmin
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your application branding and manage the team catalog.</p>
        </div>
        
        {/* Sleek dynamic pill-style tab switcher */}
        <div className="bg-gray-100 p-1 rounded-xl flex self-start sm:self-auto shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab("branding")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "branding"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <SettingsIcon size={16} />
            Branding
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "team"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Users size={16} />
            Team Directory
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      {activeTab === "branding" ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Identity & Branding Card */}
          <form onSubmit={handleSaveBranding} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <SettingsIcon size={18} className="text-indigo-600" />
                App Identity & Branding
              </h2>
              <p className="text-xs text-gray-500 mt-1">Change the application's logo, sidebar branding, and tab title.</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Logo Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Application Logo</label>
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  {/* Transparent Checkerboard Logo Preview Box */}
                  <div className="relative w-24 h-24 rounded-xl border border-gray-100 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] flex items-center justify-center overflow-hidden shrink-0 shadow-inner group">
                    {logoInput ? (
                      <>
                        <img 
                          src={logoInput} 
                          alt="App Logo Preview" 
                          className="max-w-full max-h-full p-2 object-contain transition-transform duration-300 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-[10px] font-semibold text-white uppercase tracking-wider bg-black/50 px-2 py-1 rounded-md">Preview</span>
                        </div>
                      </>
                    ) : (
                      // Dynamic fallback letter icon
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm select-none">
                        {(appNameInput || "E").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap gap-3">
                      <label className="relative cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
                        <span className="flex items-center gap-2">
                          <UploadCloud size={16} className="text-gray-500" />
                          Upload Custom Logo
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/svg+xml"
                          onChange={handleLogoUpload}
                          className="sr-only"
                        />
                      </label>
                      
                      {logoInput && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Supports SVG, PNG, or JPG formats. Recommended dimensions are square (e.g., 512x512 pixels) under 2MB. If no custom logo is uploaded, the app automatically generates a dynamic letter-based icon corresponding to the application name.
                    </p>
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="appName" className="block text-sm font-semibold text-gray-800 mb-1">
                    App Name
                  </label>
                  <input
                    id="appName"
                    type="text"
                    value={appNameInput}
                    onChange={(e) => setAppNameInput(e.target.value)}
                    placeholder="e.g. EmpMonitor"
                    className="w-full rounded-lg border-gray-300 shadow-sm px-4 py-2.5 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    The name displayed in the sidebar header and the mobile application bar.
                  </p>
                </div>

                <div>
                  <label htmlFor="appTitle" className="block text-sm font-semibold text-gray-800 mb-1">
                    App Title / Page Title
                  </label>
                  <input
                    id="appTitle"
                    type="text"
                    value={appTitleInput}
                    onChange={(e) => setAppTitleInput(e.target.value)}
                    placeholder="e.g. Employee Status Monitor"
                    className="w-full rounded-lg border-gray-300 shadow-sm px-4 py-2.5 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    The text displayed in the browser tab (updates immediately upon save).
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAppNameInput(settings.app_name);
                  setAppTitleInput(settings.app_title);
                  setLogoInput(settings.app_logo);
                }}
                className="bg-white border border-gray-150 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-sm disabled:opacity-75 flex items-center gap-2"
              >
                {saveLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  "Save Branding"
                )}
              </button>
            </div>
          </form>

          {/* Security & Passcode Change Card */}
          <form onSubmit={handleChangePasscodeSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lock size={18} className="text-indigo-600" />
                Administrative Security
              </h2>
              <p className="text-xs text-gray-500 mt-1">Change the superadmin access passcode for the application settings.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="currentPass" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Passcode
                  </label>
                  <input
                    id="currentPass"
                    type="password"
                    value={currentPasscode}
                    onChange={(e) => setCurrentPasscode(e.target.value)}
                    placeholder="Enter current passcode"
                    className="w-full rounded-lg border-gray-300 shadow-sm px-4 py-2.5 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="newPass" className="block text-sm font-medium text-gray-700 mb-1">
                    New Passcode
                  </label>
                  <input
                    id="newPass"
                    type="password"
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full rounded-lg border-gray-300 shadow-sm px-4 py-2.5 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmNewPass" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Passcode
                  </label>
                  <input
                    id="confirmNewPass"
                    type="password"
                    value={confirmNewPasscode}
                    onChange={(e) => setConfirmNewPasscode(e.target.value)}
                    placeholder="Confirm new passcode"
                    className="w-full rounded-lg border-gray-300 shadow-sm px-4 py-2.5 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={securityLoading}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-sm disabled:opacity-75 flex items-center gap-2 cursor-pointer"
              >
                {securityLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Updating Passcode...
                  </>
                ) : (
                  "Update Passcode"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Team Directory Management Tab
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <UserPlus size={18} className="text-indigo-600" />
                Add New Employee
              </h2>
              
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Left Column: Avatar upload box (Circular) */}
                  <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
                    <label className="block text-sm font-semibold text-gray-800 text-center md:text-left w-full mb-1">Avatar Photo</label>
                    <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-250 bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm group">
                      {avatar ? (
                        <>
                          <img 
                            src={avatar} 
                            alt="Avatar Preview" 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                          />
                          <button
                            type="button"
                            onClick={() => setAvatar("")}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-2 text-gray-400">
                          <User size={24} className="stroke-[1.5]" />
                          <span className="text-[10px] font-semibold mt-1">Upload</span>
                        </div>
                      )}
                      
                      {!avatar && (
                        <input
                          type="file"
                          accept="image/png, image/jpeg"
                          onChange={(e) => handleAvatarUpload(e, false)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      )}
                    </div>
                    {avatar && (
                      <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                        <Check size={10} /> Photo selected
                      </p>
                    )}
                  </div>

                  {/* Right Column: Name, Job Title, Avatar Color */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full rounded-lg border-gray-300 shadow-sm px-4 py-2 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="jobTitle" className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
                        <input
                          id="jobTitle"
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Software Engineer"
                          className="w-full rounded-lg border-gray-300 shadow-sm px-4 py-2 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Fallback Avatar Color</label>
                        <div className="flex flex-wrap gap-1.5 h-[42px] items-center">
                          {PALETTE.map((color, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setColorIndex(idx)}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all cursor-pointer",
                                colorIndex === idx ? "scale-125 shadow-sm" : "border-transparent hover:scale-110"
                              )}
                              style={{
                                backgroundColor: color.bg,
                                borderColor: colorIndex === idx ? color.hoverBorder : "transparent"
                              }}
                              title={`Color ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-70 h-[42px] text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <UserPlus size={16} />
                          {loading ? "Adding..." : "Add Member"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="divide-y divide-gray-100">
              {employees.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No employees added yet.
                </div>
              ) : (
                employees.map((emp) => {
                  const color = PALETTE[emp.color_index || 0];
                  return (
                    <div key={emp.id} className="p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {emp.avatar ? (
                          <img 
                            src={emp.avatar} 
                            alt={emp.name} 
                            className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm border-2" 
                            style={{ borderColor: color.hoverBorder }}
                          />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border-2"
                            style={{ backgroundColor: color.bg, color: color.text, borderColor: color.hoverBorder }}
                          >
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm">{emp.name}</h3>
                            <span 
                              className="w-2.5 h-2.5 rounded-full border border-black/5 shrink-0 shadow-sm"
                              style={{ backgroundColor: color.hoverBorder }}
                              title="Assigned team color"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{emp.job_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => startEdit(emp)}
                          className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold border border-transparent hover:border-indigo-100 cursor-pointer"
                        >
                          <Edit size={14} />
                          <span>Edit Details</span>
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold border border-transparent hover:border-rose-100 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm shadow-sm">
            <ShieldAlert className="shrink-0 text-amber-600" size={20} />
            <p className="leading-relaxed">Removing a team member will permanently delete their historical status logs from the database.</p>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Team Member</h3>
                <p className="text-xs text-gray-500 mt-0.5">Modify details and update avatar photo.</p>
              </div>
              <button 
                onClick={() => setEditingEmployee(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                  {/* Edit Avatar Column */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Avatar Photo</label>
                    <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-250 bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm group">
                      {editAvatar ? (
                        <>
                          <img 
                            src={editAvatar} 
                            alt="Avatar Edit Preview" 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                          />
                          <button
                            type="button"
                            onClick={() => setEditAvatar("")}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-1 text-gray-400">
                          <User size={20} className="stroke-[1.5]" />
                          <span className="text-[9px] font-semibold mt-1">Upload</span>
                        </div>
                      )}
                      
                      {!editAvatar && (
                        <input
                          type="file"
                          accept="image/png, image/jpeg"
                          onChange={(e) => handleAvatarUpload(e, true)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      )}
                    </div>
                  </div>

                  {/* Edit Fields Column */}
                  <div className="flex-1 w-full space-y-4">
                    <div>
                      <label htmlFor="editName" className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                      <input
                        id="editName"
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border-gray-300 shadow-sm px-4 py-2 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="editJobTitle" className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
                      <input
                        id="editJobTitle"
                        type="text"
                        value={editJobTitle}
                        onChange={(e) => setEditJobTitle(e.target.value)}
                        className="w-full rounded-lg border-gray-300 shadow-sm px-4 py-2 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fallback Avatar Color</label>
                  <div className="flex flex-wrap gap-1.5 h-[42px] items-center justify-center sm:justify-start">
                    {PALETTE.map((color, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditColorIndex(idx)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all cursor-pointer",
                          editColorIndex === idx ? "scale-125 shadow-sm" : "border-transparent hover:scale-110"
                        )}
                        style={{
                          backgroundColor: color.bg,
                          borderColor: editColorIndex === idx ? color.hoverBorder : "transparent"
                        }}
                        title={`Color ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="bg-white border border-gray-150 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-sm disabled:opacity-75 flex items-center gap-2 cursor-pointer"
                >
                  {editLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border animate-in fade-in slide-in-from-bottom-4 duration-300",
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        )}>
          {toast.type === "success" ? (
            <Check size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="p-1 rounded-lg hover:bg-black/5 text-gray-500 ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
