"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function GoogleCallback() {
    const router = useRouter();

    useEffect(() => {
        const finalize = async () => {

            // 1. Get logged in user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // 2. Retrieve stored metadata from before redirect
            const raw = sessionStorage.getItem("google_neural_metadata");

            if (!raw) {
                router.push("/login");
                return;
            }

            const meta = JSON.parse(raw);

            // 3. Attach metadata to Supabase user
            await supabase.auth.updateUser({
                data: {
                    provider_type: "google_neural_node",
                    full_name: meta.full_name || user.email?.split("@")[0],
                    username: meta.username || "NODE_PENDING",
                    country: meta.country || "GLOBAL",
                    neural_key_backup: meta.neural_key,
                    sync_status: "verified_identity",
                    security_tier: 1
                }
            });

            // 4. Clean storage
            sessionStorage.removeItem("google_neural_metadata");

            // 5. Continue your existing flow
            router.push("/auth/processing"); // <-- your neural syncing step page
        };

        finalize();
    }, [router]);

    return (
        <div className="h-screen flex items-center justify-center text-sm font-mono">
            Establishing Neural Link...
        </div>
    );
}
