"use client";

import { Icon } from "@iconify/react";

interface Props {
  email: string;
  onConfirm: () => void;
  onBack: () => void;
}

const GoogleConfirm = ({ email, onConfirm, onBack }: Props) => {
  return (
    <div className="w-full max-w-[450px] bg-white dark:bg-[#1f1f1f] rounded-[24px] p-8 md:p-10 border border-[#e0e0e0] dark:border-white/10 shadow-sm mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center gap-2 mb-8 text-[#5f6368] dark:text-white/60">
        <svg width="20" height="20" viewBox="0 0 24 24">
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
        <span className="text-[14px] font-medium">Sign in with Google</span>
      </div>

      <h1 className="text-[#202124] dark:text-white text-[32px] font-normal leading-tight mb-6">
        Verify with Tesla-X
      </h1>

      <div className="flex items-center gap-3 w-fit px-2 py-1 border border-gray-300 dark:border-white/10 rounded-full mb-8">
        <div className="w-6 h-6 rounded-full bg-[#1D6350] flex items-center justify-center text-[10px] text-white uppercase font-bold">
          {email ? email[0] : "U"}
        </div>
        <span className="text-[14px] font-medium text-dark dark:text-white">
          {email || "user@gmail.com"}
        </span>
        <Icon icon="tabler:chevron-down" className="text-gray-400" />
      </div>

      <p className="text-[16px] text-[#202124] dark:text-white/90 mb-6">
        Google will allow{" "}
        <span className="font-semibold">Tesla-X Global Protocol</span> to access
        this info about you:
      </p>

      <div className="space-y-6 mb-10">
        <div className="flex gap-4">
          <Icon
            icon="solar:user-circle-bold"
            className="text-gray-500 mt-1"
            width="22"
          />
          <div>
            <p className="text-[14px] font-medium text-dark dark:text-white">
              Your Identity
            </p>
            <p className="text-[12px] text-gray-500">
              Name and profile picture
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Icon
            icon="solar:letter-bold"
            className="text-gray-500 mt-1"
            width="22"
          />
          <div>
            <p className="text-[14px] font-medium text-dark dark:text-white">
              {email || "Email address"}
            </p>
            <p className="text-[12px] text-gray-500">
              Primary contact endpoint
            </p>
          </div>
        </div>
      </div>

      <div className="text-[12px] text-gray-500 space-y-4 mb-10 leading-relaxed">
        <p>
          Review tesla-x-investment.vercel.app&apos;s{" "}
          <span className="text-[#1a73e8] font-medium cursor-pointer">
            Privacy Policy
          </span>{" "}
          and{" "}
          <span className="text-[#1a73e8] font-medium cursor-pointer">
            Terms of Service
          </span>
          .
        </p>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={onBack}
          className="text-[#1a73e8] text-[14px] font-semibold px-6 py-2.5 rounded-full hover:bg-blue-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-[#1a73e8] text-white px-10 py-2.5 rounded-full text-[14px] font-semibold hover:bg-[#185abc] shadow-sm active:scale-95 transition"
        >
          Allow Access
        </button>
      </div>
    </div>
  );
};

export default GoogleConfirm;
