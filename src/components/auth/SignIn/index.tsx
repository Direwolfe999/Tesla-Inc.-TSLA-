"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SocialSignIn from "../SocialSignIn";
import Logo from "@/components/Layout/Header/Logo";
import Loader from "@/components/Common/Loader";
import Link from "next/link";

const SignIn = () => {
  const router = useRouter();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("getSession error:", error);
          // Optional: show a non-blocking toast for visibility
          // toast.error("Auth session check failed. Check console for details.");
          return;
        }

        const { session } = data;
        if (session?.user) {
          console.log(
            "Existing session detected, redirecting to dashboard",
            session.user
          );
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("getSession failed:", err);
      }
    })();
  }, [router]);

  const loginUser = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const { email, password } = loginData;

    // --- Basic Validation ---
    if (!email || !password) {
      toast.error("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Supabase login data:", data);
      console.log("Supabase login error:", error);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.user) {
        toast.error(
          "No user returned. Check if your email is confirmed or credentials are correct."
        );
        return;
      }

      // Check if email is confirmed (optional)
      if (!data.user.email_confirmed_at) {
        toast.error(
          "Please verify your email before logging in. Check your inbox."
        );
        return;
      }

      toast.success("Signed in successfully!");
      router.push("/dashboard"); // Redirect to dashboard
    } catch (err: any) {
      console.error("Unexpected login error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-10 text-center mx-auto inline-block max-w-[160px]">
        <Logo />
      </div>

      <SocialSignIn />

      <span className="z-1 relative my-8 block text-center before:content-[''] before:absolute before:h-px before:w-40% before:bg-dark_border before:bg-opacity-60 before:left-0 before:top-3 after:content-[''] after:absolute after:h-px after:w-40% after:bg-dark_border after:bg-opacity-60 after:top-3 after:right-0">
        <span className="text-body-secondary relative z-10 inline-block px-3 text-base text-white">
          OR
        </span>
      </span>

      <form onSubmit={loginUser}>
        <div className="mb-[22px]">
          <input
            type="email"
            placeholder="Email"
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
            className="w-full rounded-md border border-dark_border border-opacity-60 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-grey focus:border-primary focus-visible:shadow-none text-white dark:focus:border-primary"
          />
        </div>
        <div className="mb-[22px]">
          <input
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
            className="w-full rounded-md border border-dark_border border-opacity-60 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-grey focus:border-primary focus-visible:shadow-none text-white dark:focus:border-primary"
          />
        </div>
        <div className="mb-9">
          <button
            type="submit"
            disabled={loading}
            className={`bg-primary w-full py-3 rounded-lg text-18 font-medium border border-primary hover:text-primary hover:bg-transparent flex justify-center items-center ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Sign In {loading && <Loader />}
          </button>
        </div>
      </form>

      <Link
        href="/forgot-password"
        className="mb-2 inline-block text-base text-dark hover:text-primary text-white dark:hover:text-primary"
      >
        Forgot Password?
      </Link>
      <p className="text-body-secondary text-white text-base">
        Not a member yet?{" "}
        <Link href="/auth/signup" className="text-primary hover:underline">
          Sign Up
        </Link>
      </p>
    </>
  );
};

export default SignIn;
