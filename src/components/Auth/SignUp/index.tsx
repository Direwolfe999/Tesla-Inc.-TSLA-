"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SocialSignUp from "../SocialSignUp";
import Logo from "@/components/Layout/Header/Logo";
import { useState } from "react";
import Loader from "@/components/Common/Loader";
import { supabase } from "@/lib/supabaseClient";

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const { name, email, password } = Object.fromEntries(data.entries()) as {
      name: string;
      email: string;
      password: string;
    };

    if (!name || !email || !password) {
      toast.error("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      // Sign up user
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) {
        console.error("SignUp error:", signUpError);
        throw signUpError;
      }

      const userId = signUpData.user?.id;

      if (!userId) {
        // Common case when the project requires email confirmation: user object is not returned immediately.
        toast.success(
          "Registration successful. Please check your email to confirm your account."
        );
        router.push("/auth/signin");
        return;
      }

      // If user was created immediately (no confirmation required), create profile and wallet
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{ id: userId, username: name }]);
      if (profileError) {
        console.error("Profile insert error:", profileError);
        throw profileError;
      }

      // Check if wallet exists
      const { data: existingWallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();
      // Insert into wallets
      if (!existingWallet) {
        const { error: walletError } = await supabase
          .from("wallets")
          .insert([{ user_id: userId, balance: 0 }]);
        if (walletError) {
          console.error("Wallet insert error:", walletError);
          throw walletError;
        }
      }

      toast.success("Successfully registered!");
      router.push("/auth/signin");
    } catch (err: any) {
      console.error("SignUp handler error:", err);
      toast.error(err?.message || "Something went wrong. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="mb-10 text-center mx-auto inline-block max-w-[160px]">
        <Logo />
      </div>

      <SocialSignUp />

      <span className="z-1 relative my-8 block text-center before:content-[''] before:absolute before:h-px before:w-40% before:bg-dark_border before:bg-opacity-60 before:left-0 before:top-3 after:content-[''] after:absolute after:h-px after:w-40% after:bg-dark_border after:bg-opacity-60 after:top-3 after:right-0">
        <span className="text-body-secondary relative z-10 inline-block px-3 text-base text-white">
          OR
        </span>
      </span>

      <form onSubmit={handleSubmit}>
        <div className="mb-[22px]">
          <input
            type="text"
            placeholder="Name"
            name="name"
            required
            className="w-full rounded-md border border-dark_border border-opacity-60 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-grey focus:border-primary focus-visible:shadow-none text-white dark:focus:border-primary"
          />
        </div>
        <div className="mb-[22px]">
          <input
            type="email"
            placeholder="Email"
            name="email"
            required
            className="w-full rounded-md border border-dark_border border-opacity-60 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-grey focus:border-primary focus-visible:shadow-none text-white dark:focus:border-primary"
          />
        </div>
        <div className="mb-[22px]">
          <input
            type="password"
            placeholder="Password"
            name="password"
            required
            className="w-full rounded-md border border-dark_border border-opacity-60 border-solid bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-grey focus:border-primary focus-visible:shadow-none text-white dark:focus:border-primary"
          />
        </div>
        <div className="mb-9">
          <button
            type="submit"
            className="flex w-full items-center text-18 font-medium justify-center rounded-md bg-primary px-5 py-3 text-darkmode transition duration-300 ease-in-out hover:bg-transparent hover:text-primary border-primary border"
          >
            Sign Up {loading && <Loader />}
          </button>
        </div>
      </form>

      <p className="text-body-secondary mb-4 text-white text-base">
        By creating an account you agree with our{" "}
        <a href="/#" className="text-primary hover:underline">
          Privacy
        </a>{" "}
        and{" "}
        <a href="/#" className="text-primary hover:underline">
          Policy
        </a>
      </p>

      <p className="text-body-secondary text-white text-base">
        Already have an account?
        <Link href="/auth/signin" className="pl-2 text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </>
  );
};

export default SignUp;
