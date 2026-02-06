"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SocialSignUp from "../SocialSignUp";
import Logo from "@/components/Layout/Header/Logo";
import { useState } from "react";
import Loader from "@/components/Common/Loader";
import { supabase } from "@/lib/supabaseClient";

const countries = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Nigeria",
  "United Arab Emirates",
  "Australia",
  "India",
  "Singapore",
];

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    country: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { name, username, email, password, country } = formData;

    if (!name || !username || !email || !password || !country) {
      toast.error("All mission-critical fields are required.");
      setLoading(false);
      return;
    }

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) throw signUpError;
      const userId = signUpData.user?.id;

      if (!userId) {
        toast.success("Deployment Successful. Check your email to confirm.");
        router.push("/auth/signin");
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          { id: userId, username: username, full_name: name, country: country },
        ]);

      if (profileError) throw profileError;

      await supabase.from("wallets").insert([{ user_id: userId, balance: 0 }]);

      toast.success("Neural Link Active. Welcome!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Deployment Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto px-4 py-8">
      {/* LOGO SECTION */}
      <div className="mb-10 text-center mx-auto block max-w-[160px]">
        <Logo />
      </div>

      {/* HEADER SECTION */}
      <div className="text-center mb-8">
        <h2 className="text-dark dark:text-white text-2xl font-bold mb-2">
          💪 Create an account
        </h2>
        <p className="text-body-secondary dark:text-white/60 text-sm font-medium">
          Register to continue
        </p>
      </div>

      {/* SOCIAL SIGN UP */}
      <SocialSignUp />

      <span className="z-1 relative my-8 block text-center before:content-[''] before:absolute before:h-px before:w-[35%] before:bg-dark_border dark:before:bg-white/10 before:bg-opacity-60 before:left-0 before:top-3 after:content-[''] after:absolute after:h-px after:w-[35%] after:bg-dark_border dark:after:bg-white/10 after:bg-opacity-60 after:top-3 after:right-0">
        <span className="text-body-secondary relative z-10 inline-block px-3 text-sm text-dark dark:text-white font-medium uppercase tracking-[0.2em]">
          OR
        </span>
      </span>

      <form onSubmit={handleSubmit} className="space-y-[20px]">
        {/* Full Name */}
        <div>
          <input
            type="text"
            placeholder="Full Name*"
            required
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-md border border-dark_border dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base outline-none transition placeholder:text-grey focus:border-primary text-dark dark:text-white"
          />
        </div>

        {/* Username */}
        <div>
          <input
            type="text"
            placeholder="Username*"
            required
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="w-full rounded-md border border-dark_border dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base outline-none transition placeholder:text-grey focus:border-primary text-dark dark:text-white"
          />
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            placeholder="Email Address*"
            required
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full rounded-md border border-dark_border dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base outline-none transition placeholder:text-grey focus:border-primary text-dark dark:text-white"
          />
        </div>

        {/* Country Selector with Premium Chevron */}
        <div className="relative group">
          <select
            required
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            className="w-full rounded-md border border-dark_border dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base text-dark dark:text-white outline-none transition focus:border-primary appearance-none cursor-pointer"
          >
            <option
              value=""
              disabled
              selected
              className="bg-white dark:bg-[#0b0b0b]"
            >
              Select Country*
            </option>
            {countries.map((c) => (
              <option
                key={c}
                value={c}
                className="bg-white dark:bg-[#0b0b0b] text-dark dark:text-white"
              >
                {c}
              </option>
            ))}
          </select>
          {/* THE PREMIUM CHEVRON */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-dark/40 dark:text-white/40 group-focus-within:text-primary transition-colors">
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Password */}
        <div>
          <input
            type="password"
            placeholder="Create Password*"
            required
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full rounded-md border border-dark_border dark:border-white/20 border-solid bg-transparent px-5 py-3 text-base outline-none transition placeholder:text-grey focus:border-primary text-dark dark:text-white"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`bg-primary w-full py-3.5 rounded-lg text-lg font-bold border border-primary text-white transition-all hover:bg-transparent hover:text-primary flex justify-center items-center shadow-lg shadow-primary/10 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            SIGN UP{" "}
            {loading && (
              <div className="ml-2 scale-75">
                <Loader />
              </div>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-body-secondary dark:text-white/70 mb-4 text-sm">
          By joining, you agree to our{" "}
          <Link href="#" className="text-primary hover:underline font-semibold">
            Privacy
          </Link>{" "}
          &{" "}
          <Link href="#" className="text-primary hover:underline font-semibold">
            Policy
          </Link>
        </p>

        <p className="text-dark dark:text-white text-base">
          Already a member?
          <Link
            href="/auth/signin"
            className="pl-2 text-primary font-bold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
