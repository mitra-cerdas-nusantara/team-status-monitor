import React, { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { Lock, Key, Eye, EyeOff, AlertCircle, Sparkles, Check, X } from "lucide-react";
import { cn } from "../lib/utils";

export default function SetupWizard() {
  const { completeSetup } = useSettings();
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (passcode.length < 4) {
      setErrorMsg("Passcode must be at least 4 characters long.");
      return;
    }

    if (passcode !== confirmPasscode) {
      setErrorMsg("Passcodes do not match. Please verify.");
      return;
    }

    setLoading(true);
    const success = await completeSetup(passcode);
    setLoading(false);

    if (success) {
      setToast("System initialized successfully! Welcome aboard.");
    } else {
      setErrorMsg("Failed to save passcode. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Top-Right & Bottom-Left Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -translate-y-12 translate-x-12 select-none pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl translate-y-12 -translate-x-12 select-none pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-150 p-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Onboarding Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm relative">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Initialize Setup</h1>
            <p className="text-sm text-gray-500 leading-relaxed px-4">
              Welcome! Set up a secure **Superadmin Passcode** to protect branding configurations and the employee directory.
            </p>
          </div>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Create Passcode */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Create Passcode
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Choose a passcode"
                className="w-full rounded-xl border border-gray-300 shadow-inner px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-semibold tracking-wide transition-all"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                disabled={loading}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Passcode */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Confirm Passcode
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPasscode}
                onChange={(e) => {
                  setConfirmPasscode(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Confirm your passcode"
                className="w-full rounded-xl border border-gray-300 shadow-inner px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-semibold tracking-wide transition-all"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                disabled={loading}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Strength / match badge */}
          {passcode && confirmPasscode && (
            <div className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 transition-all animate-in fade-in duration-200",
              passcode === confirmPasscode
                ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                : "text-amber-700 bg-amber-50 border-amber-100"
            )}>
              {passcode === confirmPasscode ? (
                <>
                  <Check size={13} className="shrink-0" />
                  <span>Passcodes match perfectly!</span>
                </>
              ) : (
                <>
                  <AlertCircle size={13} className="shrink-0 animate-bounce" />
                  <span>Passcodes do not match yet</span>
                </>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3.5 px-4 rounded-xl text-sm font-bold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            <Key size={16} className={cn(loading && "animate-spin")} />
            {loading ? "Saving Passcode..." : "Complete Setup & Launch"}
          </button>
        </form>

        <div className="text-center">
          <span className="text-[11px] font-semibold text-gray-400 select-none">
            MITRA STATUS MONITOR SETUP
          </span>
        </div>
      </div>

      {/* Slide-in Toast on Successful Complete */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border bg-emerald-50 border-emerald-200 text-emerald-800 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Check size={18} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}
    </div>
  );
}
