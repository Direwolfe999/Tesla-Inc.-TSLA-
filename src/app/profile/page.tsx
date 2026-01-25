"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Line } from "react-chartjs-2";
import { Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

interface Asset {
  id: number;
  asset: string;
  amount: number;
}

const ProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [returns, setReturns] = useState(0);
  const [rank, setRank] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [assets, setAssets] = useState<any[]>([]);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [priceAlertEnabled, setPriceAlertEnabled] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [transactions]);

  const getPortfolioTimeline = (txs: any[]) => {
    let total = 0;

    return txs.map((tx) => {
      if (tx.type === "buy") {
        total += tx.amount * tx.price;
      } else if (tx.type === "sell") {
        total -= tx.amount * tx.price;
      }
      return Number(total.toFixed(2));
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return router.push("/auth/signin");
      setUser(data.session.user);
      fetchProfile(data.session.user.id);
    });
  }, []);
  // Verification with email
  useEffect(() => {
    const fetchUserVerification = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      if (!user) return;

      // Supabase sets `email_confirmed_at` when the user clicks the verification link
      setIsVerified(!!user.email_confirmed_at);
    };
    fetchUserVerification();
  }, []);

  useEffect(() => {
    const refreshUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!error && user) setIsVerified(!!user.email_confirmed_at);
    };

    const interval = setInterval(refreshUser, 5000); // check every 5s
    return () => clearInterval(interval);
  }, []);

  // fetch profile for the user
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId) // <-- changed from "user_id" to "id"
        .single();

      setProfile(profileData);
      setName(profileData.name || "");
      setEmail(profileData.email || "");
      setProfilePic(profileData.profile_pic_url || "");
      setIsVerified(profileData.is_verified || false);
      setBio(profileData.bio || "");
      setPortfolioValue(profileData.portfolio_value || 0);
      setReturns(profileData.returns || 0);
      const { data: assetsData } = await supabase
        .from("user_assets")
        .select("*")
        .eq("user_id", userId);
      setAssets(assetsData || []);

      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageChange = async (e: any) => {
    const file = e.target.files[0];
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Allowed types: " + allowedTypes.join(", "));
      return;
    }
    if (file.size > maxSize) {
      alert("File too large (max 5MB)");
      return;
    }
    const { data } = await supabase.storage
      .from("Profile-pics")
      .upload(`${user?.id}/${file.name}`, file);
    if (data) {
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}Profile-pics/${user?.id}/${file.name}`;
      setProfilePic(publicUrl);
    } else {
      console.error("Error uploading image");
    }
    console.log("Saving profile pic:", profilePic);
  };
  const handleSave = async () => {
    if (!user) return;

    try {
      const updates = {
        name,
        email,
        profile_pic_url: profilePic,
        bio,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id); // <-- use "id"

      if (error) throw error;

      await fetchProfile(user.id); // 🔑 rehydrate from DB
      setIsEditingBio(false);

      alert("Profile updated!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Password change, notification preferences, 2FA, linked accounts, delete account handlers would go here
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const session = await supabase.auth.getSession();
    const user = session.data.session?.user;
    if (!user?.email) {
      alert("User not found or email missing");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: user?.email ?? "",
      password: currentPassword,
    });
    if (error) {
      alert("Current password is incorrect");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) console.error("Error updating password:", updateError);
    else alert("Password updated!");
  };

  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const handleNotificationToggle = async (type: "email" | "sms") => {
    if (type === "email") setEmailNotifications(!emailNotifications);
    if (type === "sms") setSmsNotifications(!smsNotifications);
    await supabase
      .from("profiles")
      .update({
        [type]: type === "email" ? !emailNotifications : !smsNotifications,
      })
      .eq("id", user?.id);
  };

  const [twoFA, setTwoFA] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const handle2FA = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      console.error(error);
      return;
    }
    const factors = data?.all ?? [];
    const isEnabled = factors.length > 0;

    if (isEnabled) {
      // Disable 2FA
      const factorId = factors[0].id;
      await supabase.auth.mfa.unenroll({ factorId });
      setTwoFA(false);
    } else {
      // Enable 2FA - get QR code
      const { data: enrollData, error: enrollError } =
        await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (enrollError) {
        console.error(enrollError);
        return;
      }
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: enrollData.id });
      if (challengeError) {
        console.error(challengeError);
        return;
      }
      setChallengeId(challengeData.id);
      setQrCode(enrollData.totp.qr_code);
      setFactorId(enrollData.id);
    }
  };

  const verifyCode = async (code: string) => {
    if (!factorId || !challengeId) return;
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });
    if (!error) {
      setTwoFA(true);
      setQrCode(null);
    } else {
      console.error(error);
    }
  };

  // Updated the handleTogglePriceAlert function to store the new state in local storage
  const handleTogglePriceAlert = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (priceAlertEnabled) {
      // Disable price alert
      await supabase
        .from("price_alerts")
        .update({ status: "cancelled" })
        .eq("user_id", user?.id);
      setPriceAlertEnabled(false);
      localStorage.setItem("priceAlertEnabled", "false");
    } else {
      // Enable price alert
      await supabase
        .from("price_alerts")
        .insert({ user_id: user?.id, status: "active" });
      setPriceAlertEnabled(true);
      localStorage.setItem("priceAlertEnabled", "true");
    }
  };

  useEffect(() => {
    const fetchPriceAlertStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("price_alerts")
        .select("status")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (error) {
        console.error(error);
      } else {
        setPriceAlertEnabled(data.length > 0 && data[0].status === "active");
      }
    };
    fetchPriceAlertStatus();
  }, []);

  // Asset click handler
  const handleAssetClick = (asset: any) => {
    setSelectedAsset(asset);
  };

  // Fetch linked accounts on load
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  useEffect(() => {
    const fetchLinkedAccounts = async () => {
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) console.error(error);
      setLinkedAccounts(data?.identities ?? []);
    };
    fetchLinkedAccounts();
  }, []);

  // fetch ranks
  const fetchRank = async (userId: string) => {
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, portfolio_value")
      .order("portfolio_value", { ascending: false });

    if (error) {
      console.error("Rank fetch error:", error);
      return;
    }

    if (!users) return;

    const userRank = users.findIndex((u) => u.id === userId) + 1;
    setRank(userRank);
  };

  // Call after fetching the profile
  useEffect(() => {
    if (!user?.id) return;
    fetchRank(user.id);
  }, [user?.id, portfolioValue]);

  // portfolio asset holding in dollars
  useEffect(() => {
    if (assets.length && transactions.length) {
      const totalValue = assets.reduce((sum, asset) => {
        const buys = transactions.filter(
          (t) => t.asset === asset.asset && t.type === "buy",
        );
        const totalBought = buys.reduce((acc, t) => acc + t.amount, 0);
        const totalCost = buys.reduce((acc, t) => acc + t.amount * t.price, 0);
        const avgPrice = totalBought ? totalCost / totalBought : 0;
        return sum + asset.amount * avgPrice;
      }, 0);

      setPortfolioValue(totalValue);
    }
  }, [assets, transactions]);

  // resend verififcation email for user
  const resendVerificationEmail = async () => {
    if (!user?.email) return;

    const { error } = await supabase.auth.updateUser(
      { email: user.email }, // first argument: fields to update
      { emailRedirectTo: `${window.location.origin}/profile` }, // second argument: options
    );

    if (error) {
      alert("Failed to send verification email: " + error.message);
    } else {
      alert("Verification email sent! Check your inbox.");
    }
  };


  // handle deletion of accounts
  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", user?.id);
      if (error) throw error;
      await supabase.auth.signOut();
      window.location.href = "/home";
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const filteredTransactions = transactions.filter((t) => t.amount && t.price);
  // Profit/Loss summary
  const totalCost = transactions
    .filter((t) => t.type === "buy")
    .reduce((sum, t) => sum + Number(t.amount) * Number(t.price), 0);

  const totalSold = transactions
    .filter((t) => t.type === "sell")
    .reduce((sum, t) => sum + Number(t.amount) * Number(t.price), 0);

  const profitLoss = portfolioValue - totalCost; // +ve is profit, -ve is loss
  const profitPercentage = totalCost ? (profitLoss / totalCost) * 100 : 0;

  // portfolio value summary

  const portfolioChartData = useMemo(() => {
    if (!sortedTransactions.length) return null;

    return {
      labels: sortedTransactions.map((t) =>
        new Date(t.created_at).toLocaleDateString(),
      ),
      datasets: [
        {
          label: "Portfolio Value",
          data: getPortfolioTimeline(sortedTransactions),
          fill: true,
          borderWidth: 2,
          tension: 0.35,
        },
      ],
    };
  }, [sortedTransactions]);

  // Render
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 mt-10 md:mt-10 text-white">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Profile</h1>
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <div className="relative group w-24 h-24 md:w-32 md:h-32">
            <img
              src={profilePic || "/default-avatar.jpg"}
              alt="Profile Pic"
              className="w-full h-full rounded-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-2xl">+</span>
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageChange}
              />
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-lg md:text-xl font-bold">{name}</h2>

            <div className="flex items-center gap-2 mt-1">
              {isVerified ? (
                <>
                  {/* Verified Badge */}
                  <span className="flex items-center text-xs font-medium text-blue-500 bg-blue-100/20 px-2 py-1 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </span>
                  <p className="text-gray-400 text-sm">Verified Investor</p>
                </>
              ) : (
                <>
                  {/* Unverified Badge */}
                  <span className="flex items-center text-xs font-medium text-gray-500 bg-gray-700/30 px-2 py-1 rounded-full">
                    Unverified
                  </span>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-400 text-sm">
                      Complete email verification
                    </p>
                    <button
                      onClick={resendVerificationEmail}
                      className="text-blue-500 text-xs hover:underline"
                    >
                      Resend Email
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* // Add bio input field */}
        <div className="mb-4">
          {isEditingBio ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded"
            />
          ) : (
            <p
              className="p-2 bg-gray-700 rounded cursor-pointer"
              onClick={() => setIsEditingBio(true)}
            >
              {bio || "Add a bio..."}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-400">Portfolio Value</p>
            <p className="text-xl font-bold">${portfolioValue.toFixed(2)}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-400">Profit/Loss</p>
            <p
              className={`text-xl font-bold ${profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {profitLoss >= 0 ? "+" : "-"}${Math.abs(profitLoss).toFixed(2)} (
              {profitPercentage.toFixed(2)}%)
            </p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-400">Rank</p>
            <p className="text-xl font-bold">{rank ? `#${rank}` : "—"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === "overview" ? "bg-blue-600" : "bg-gray-700"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === "portfolio" ? "bg-blue-600" : "bg-gray-700"
            }`}
            onClick={() => setActiveTab("portfolio")}
          >
            Portfolio
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === "insights" ? "bg-blue-600" : "bg-gray-700"
            }`}
            onClick={() => setActiveTab("insights")}
          >
            Insights
          </button>

          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === "analytics" ? "bg-blue-600" : "bg-gray-700"
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === "settings" ? "bg-blue-600" : "bg-gray-700"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>
        {activeTab === "overview" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Overview</h2>

            {/* Live Portfolio Chart */}
            <div className="mb-4 h-64">
              {portfolioChartData && (
                <Line
                  data={portfolioChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        ticks: {
                          callback: (value) =>
                            typeof value === "number"
                              ? `$${value.toLocaleString()}`
                              : `$${Number(value).toLocaleString()}`,
                        },
                      },
                    },
                    plugins: {
                      tooltip: {
                        mode: "index",
                        intersect: false,
                        callbacks: {
                          label: (context) => {
                            const y = context.parsed?.y;
                            return y !== null && y !== undefined
                              ? `$${Number(y).toLocaleString()}`
                              : "$0";
                          },
                        },
                      },
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              )}
            </div>

            {/* Recent Activity Feed */}
            <div>
              <h3 className="text-lg font-bold mb-2">Recent Activity</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {[...transactions]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime(),
                  )
                  .slice(0, 10)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className={`flex justify-between p-2 rounded-md ${
                        tx.type === "buy" ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      <div>
                        <p className="font-bold">{tx.asset}</p>
                        <p className="text-sm">
                          {tx.type.toUpperCase()} {tx.amount} @ ${tx.price}
                        </p>
                      </div>
                      <p className="text-sm">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "portfolio" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Portfolio</h2>
            {assets.length === 0 ? (
              <p>No assets found.</p>
            ) : (
              <ul>
                {assets.map((asset) => (
                  <li
                    key={asset.id}
                    onClick={() => handleAssetClick(asset)}
                    className="cursor-pointer hover:bg-gray-700 p-2 rounded"
                  >
                    {asset.asset}: {asset.amount}
                  </li>
                ))}
              </ul>
            )}
            {selectedAsset && (
              <div className="mt-4 p-4 bg-gray-800 rounded">
                <h3 className="text-lg font-bold">{selectedAsset.asset}</h3>
                <p>Amount: {selectedAsset.amount}</p>

                {/* Asset Performance Chart */}
                <Line
                  data={{
                    labels: transactions
                      .filter((tx) => tx.asset === selectedAsset.asset)
                      .sort(
                        (a, b) =>
                          new Date(a.created_at).getTime() -
                          new Date(b.created_at).getTime(),
                      )
                      .map((tx) =>
                        new Date(tx.created_at).toLocaleDateString(),
                      ),
                    datasets: [
                      {
                        label: selectedAsset.asset,
                        data: (() => {
                          let amt = 0;
                          return transactions
                            .filter((tx) => tx.asset === selectedAsset.asset)
                            .sort(
                              (a, b) =>
                                new Date(a.created_at).getTime() -
                                new Date(b.created_at).getTime(),
                            )
                            .map((tx) => {
                              amt += tx.type === "buy" ? tx.amount : -tx.amount;
                              return amt;
                            });
                        })(),
                        backgroundColor: "rgba(255, 206, 86, 0.2)",
                        borderColor: "rgba(255, 206, 86, 1)",
                        borderWidth: 2,
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{ scales: { y: { beginAtZero: true } } }}
                />
              </div>
            )}
          </div>
        )}
        {activeTab === "insights" && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Insights</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Individual Asset Performance */}
              {assets.map((asset, idx) => (
                <div
                  key={asset.id || asset.asset + idx}
                  className="p-4 bg-gray-800 rounded-lg h-64"
                >
                  <h3 className="text-lg font-bold mb-2">
                    {asset.asset} Performance
                  </h3>
                  <Line
                    data={{
                      labels: transactions
                        .filter((t) => t.asset === asset.asset)
                        .sort(
                          (a, b) =>
                            new Date(a.created_at).getTime() -
                            new Date(b.created_at).getTime(),
                        )
                        .map((t) =>
                          new Date(t.created_at).toLocaleDateString(),
                        ),
                      datasets: [
                        {
                          label: asset.asset,
                          data: (() => {
                            let amt = 0;
                            return transactions
                              .filter((t) => t.asset === asset.asset)
                              .sort(
                                (a, b) =>
                                  new Date(a.created_at).getTime() -
                                  new Date(b.created_at).getTime(),
                              )
                              .map((t) => {
                                amt += t.type === "buy" ? t.amount : -t.amount;
                                return amt;
                              });
                          })(),
                          backgroundColor: "rgba(255, 206, 86, 0.2)",
                          borderColor: "rgba(255, 206, 86, 1)",
                          borderWidth: 2,
                          tension: 0.3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics tab */}
        {activeTab === "analytics" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-bold mb-2">Asset Distribution</h3>
                <Pie
                  data={{
                    labels: assets.map((asset) => asset.asset),
                    datasets: [
                      {
                        label: "Asset Distribution",
                        data: assets.map((asset) => asset.amount),
                        backgroundColor: assets.map(
                          (_, i) => `hsla(${(i * 60) % 360}, 70%, 50%, 0.5)`, // auto unique color per asset
                        ),
                        borderColor: assets.map(
                          (_, i) => `hsla(${(i * 60) % 360}, 70%, 40%, 1)`,
                        ),
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{ plugins: { tooltip: { mode: "index" } } }}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Price Chart</h3>
                {selectedAsset && (
                  <Line
                    data={{
                      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                      datasets: [
                        {
                          label: selectedAsset.asset,
                          data: [100, 120, 150, 180, 200, 220],
                          backgroundColor: "rgba(255, 99, 132, 0.2)",
                          borderColor: "rgba(255, 99, 132, 1)",
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="w-full max-w-md">
            {/* Settings form */}
            {/* Name change */}
            <div className="mb-4">
              <label className="block mb-1 text-sm">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
            {/* Email change */}
            <div className="mb-4">
              <label className="block mb-1 text-sm">Email</label>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
            {/* Password Change */}
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">Change Password</h3>
              <input
                type="password"
                placeholder="Current Password"
                className="w-full p-2 bg-gray-700 rounded mb-2"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="New Password"
                className="w-full p-2 bg-gray-700 rounded mb-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full p-2 bg-gray-700 rounded mb-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                className="bg-primary px-4 py-2 rounded"
                onClick={handlePasswordChange}
              >
                Update Password
              </button>
            </div>
            {/* Notification Preferences */}
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">Notifications</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={() => handleNotificationToggle("email")}
                />
                Email notifications
              </label>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={smsNotifications}
                  onChange={() => handleNotificationToggle("sms")}
                />
                SMS notifications
              </label>
            </div>

            {/* Price Alerts */}
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">Price Alerts</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={priceAlertEnabled}
                  onChange={handleTogglePriceAlert}
                />
                Enable Price Alerts
              </label>
            </div>

            {/* Two-Factor Auth */}
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">Two-Factor Auth</h3>
              <button
                className="bg-primary px-4 py-2 rounded"
                onClick={handle2FA}
              >
                {twoFA ? "Disable 2FA" : "Enable 2FA"}
              </button>
              {qrCode && (
                <div>
                  <div dangerouslySetInnerHTML={{ __html: qrCode }} />
                  <input
                    placeholder="Enter code from app"
                    onChange={(e) => verifyCode(e.target.value)}
                  />
                </div>
              )}
            </div>
            {/* Linked Accounts */}
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">Linked Accounts</h3>
              {linkedAccounts.map((account) => (
                <p key={account.id}>{account.provider}: Connected</p>
              ))}
            </div>
            {/* Delete Account */}
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2 text-red-500">
                Danger Zone
              </h3>
              <button
                className="bg-red-500 px-4 py-2 rounded"
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to delete your account? This cannot be undone.",
                    )
                  ) {
                    handleDeleteAccount();
                  }
                }}
              >
                Delete Account
              </button>
            </div>
            <button
              onClick={handleSave}
              className="bg-primary px-4 py-2 rounded"
            >
              Save Changes
            </button>
            <div className="flex justify-center md:justify-start mt-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 inline-block mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ProfilePage;
