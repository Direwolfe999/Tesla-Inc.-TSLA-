-- Migration: create wallets, transactions, basic profiles, RLS policies, and atomic deposit/withdraw functions

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure profiles table exists (used for is_admin flag)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  username text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Wallets table: primary key on user_id to satisfy FK constraints
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.wallets(user_id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit','withdraw')),
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Wallets policies: allow SELECT for owner or admin; allow UPDATE only for admins (prevent clients from arbitrarily setting balances)
DROP POLICY IF EXISTS wallets_select_owner ON public.wallets;
CREATE POLICY wallets_select_owner ON public.wallets
  FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS wallets_update_admin ON public.wallets;
CREATE POLICY wallets_update_admin ON public.wallets
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- Transactions policies: allow SELECT for owner or admin; allow INSERT if owner or admin
DROP POLICY IF EXISTS transactions_select_owner ON public.transactions;
CREATE POLICY transactions_select_owner ON public.transactions
  FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS transactions_insert_owner ON public.transactions;
CREATE POLICY transactions_insert_owner ON public.transactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- Atomic deposit function (runs with definer privileges to perform safe updates)
CREATE OR REPLACE FUNCTION public.deposit(amount numeric)
RETURNS void AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF amount IS NULL OR amount <= 0 THEN
    RAISE EXCEPTION 'amount must be > 0';
  END IF;
  UPDATE public.wallets SET balance = balance + amount WHERE user_id = uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet not found';
  END IF;
  INSERT INTO public.transactions (user_id, type, amount) VALUES (uid, 'deposit', amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic withdraw function
CREATE OR REPLACE FUNCTION public.withdraw(amount numeric)
RETURNS void AS $$
DECLARE uid uuid := auth.uid();
DECLARE current_balance numeric;
BEGIN
  IF amount IS NULL OR amount <= 0 THEN
    RAISE EXCEPTION 'amount must be > 0';
  END IF;
  SELECT balance INTO current_balance FROM public.wallets WHERE user_id = uid;
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'wallet not found';
  END IF;
  IF current_balance < amount THEN
    RAISE EXCEPTION 'insufficient funds';
  END IF;
  UPDATE public.wallets SET balance = balance - amount WHERE user_id = uid;
  INSERT INTO public.transactions (user_id, type, amount) VALUES (uid, 'withdraw', amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users so they can call the RPC
GRANT EXECUTE ON FUNCTION public.deposit(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw(numeric) TO authenticated;
