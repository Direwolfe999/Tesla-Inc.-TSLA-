"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const VerifyEmail = () => {
  const [status, setStatus] = useState("Verifying...");
  const router = useRouter();

  useEffect(() => {
    const verify = async () => {
      try {
        // This parses the access_token from the URL and sets the session
        const { data, error } = await supabase.auth.getSessionFromUrl({
          storeSession: true, // automatically store the session in local storage
        });

        if (error) {
          setStatus("Error verifying email: " + error.message);
          return;
        }

        if (data.session) {
          setStatus("Email verified successfully!");
          // optional: redirect to profile/dashboard after 2s
          setTimeout(() => router.push("/profile"), 2000);
        } else {
          setStatus("Verification failed. Try again.");
        }
      } catch (err) {
        setStatus("Verification error: " + err.message);
      }
    };

    verify();
  }, [router]);

  return <p className="text-white">{status}</p>;
};

export default VerifyEmail;
