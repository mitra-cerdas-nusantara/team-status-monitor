import React, { createContext, useContext, useState, useEffect } from "react";

export interface AppSettings {
  app_name: string;
  app_title: string;
  app_logo: string;
}

export type UserRole = "member" | "superadmin";

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  isSetupRequired: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  role: UserRole;
  setRole: (role: UserRole) => void;
  isSuperAdmin: boolean;
  unlockSuperAdmin: (passcode: string) => Promise<boolean>;
  lockSuperAdmin: () => void;
  completeSetup: (passcode: string) => Promise<boolean>;
  changePasscode: (currentPasscode: string, newPasscode: string) => Promise<{ success: boolean; error?: string }>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    app_name: "EmpMonitor",
    app_title: "Employee Status Monitor",
    app_logo: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          app_name: data.app_name,
          app_title: data.app_title,
          app_logo: data.app_logo,
        });
        setIsSetupRequired(!!data.is_setup_required);
      }
    } catch (error) {
      console.error("Failed to load settings from API", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update browser title & favicon dynamically whenever settings change
  useEffect(() => {
    // Set document title
    document.title = settings.app_title || "Employee Status Monitor";

    // Set or create favicon dynamically
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }

    if (settings.app_logo) {
      link.href = settings.app_logo;
    } else {
      // Dynamic elegant canvas favicon using the first letter of the App Name with a high-end indigo gradient
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Linear gradient background
          const gradient = ctx.createLinearGradient(0, 0, 64, 64);
          gradient.addColorStop(0, "#6366f1"); // Indigo-500
          gradient.addColorStop(1, "#4f46e5"); // Indigo-600
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(32, 32, 30, 0, Math.PI * 2);
          ctx.fill();

          // White text shadow / glowing effect
          ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;

          // Draw the first letter of the App Name
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 38px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const displayChar = (settings.app_name || "E").charAt(0).toUpperCase();
          ctx.fillText(displayChar, 32, 32);

          link.href = canvas.toDataURL("image/png");
        } else {
          link.href = "/vite.svg";
        }
      } catch (e) {
        link.href = "/vite.svg";
      }
    }
  }, [settings.app_name, settings.app_title, settings.app_logo]);

  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem("user_role") as UserRole) || "member";
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem("user_role", newRole);
  };

  const isSuperAdmin = role === "superadmin";

  const unlockSuperAdmin = async (passcode: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/settings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        setRole("superadmin");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to verify passcode", error);
      return false;
    }
  };

  const lockSuperAdmin = () => {
    setRole("member");
  };

  const completeSetup = async (passcode: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/settings/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        setIsSetupRequired(false);
        setRole("superadmin"); // auto-login as admin on setup complete
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to complete setup", error);
      return false;
    }
  };

  const changePasscode = async (currentPasscode: string, newPasscode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/settings/change-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_passcode: currentPasscode, new_passcode: newPasscode }),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true };
      }
      return { success: false, error: data.error || "Failed to change passcode." };
    } catch (error) {
      console.error("Failed to change passcode", error);
      return { success: false, error: "Failed to connect to the server." };
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings({
          app_name: data.app_name,
          app_title: data.app_title,
          app_logo: data.app_logo,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to save settings", error);
      return false;
    }
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      loading, 
      isSetupRequired,
      refreshSettings, 
      updateSettings,
      role,
      setRole,
      isSuperAdmin,
      unlockSuperAdmin,
      lockSuperAdmin,
      completeSetup,
      changePasscode
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
