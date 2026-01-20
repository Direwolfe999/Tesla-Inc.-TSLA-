"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Line } from "react-chartjs-2";
import { Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

// Define Asset type
interface Asset {
  id: number;
  asset: string;
  amount: number;
  // Add other properties as needed
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
  const [rank, setRank] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [priceAlertEnabled, setPriceAlertEnabled] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Portfolio Value",
        data: [1000, 1200, 1500, 1800, 2000, 2200],
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return router.push("/auth/signin");
      setUser(data.session.user);
      fetchProfile(data.session.user?.id);
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(profileData);
      setName(profileData.name || "");
      setEmail(profileData.email || "");
      setProfilePic(profileData.profile_pic_url || "");
      setPortfolioValue(profileData.portfolio_value || 0);
      setReturns(profileData.returns || 0);
      setRank(profileData.rank || 0);


      
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
    try {
      const updates = {
        name,
        email,
        profile_pic_url: profilePic,
      };

      await supabase.from("profiles").update(updates).eq("id", user?.id);

      alert("Profile updated!");
      router.refresh(); // <--- Add this to refresh the page
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

  // Price Alert Toggle
  // Update the handleTogglePriceAlert function to store the new state in local storage
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

  const handleDeleteAccount = async () => {
    await supabase.auth.admin.deleteUser(user?.id);
    await supabase.auth.signOut();
    // Redirect to login page or home
    window.location.href = "/login";
  };

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
            <p className="text-gray-400">Verified Investor</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-400">Portfolio Value</p>
            <p className="text-xl font-bold">${portfolioValue}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-400">Returns</p>
            <p className="text-xl font-bold">{returns}%</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-400">Rank</p>
            <p className="text-xl font-bold">#{rank}</p>
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
              activeTab === "history" ? "bg-blue-600" : "bg-gray-700"
            }`}
            onClick={() => setActiveTab("history")}
          >
            History
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
            <p>Portfolio Value: ${portfolioValue}</p>
            <p>Returns: {returns}%</p>
            <p>Rank: #{rank}</p>
            <p>Number of Assets: {assets.length}</p>
            <p>Number of Transactions: {transactions.length}</p>
            <Line data={chartData} options={chartOptions} />
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
                {/* <!-- Add more details here --> */}
              </div>
            )}
          </div>
        )}
        {activeTab === "history" && (
          <div>
            <h2 className="text-xl font-bold mb-4">History</h2>
            {transactions.length === 0 ? (
              <p>No transactions found.</p>
            ) : (
              <ul>
                {transactions.map((transaction) => (
                  <li key={transaction.id}>
                    {transaction.type}: {transaction.asset} -{" "}
                    {transaction.amount} @ {transaction.price}
                  </li>
                ))}
              </ul>
            )}
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
                        backgroundColor: [
                          "rgba(255, 99, 132, 0.2)",
                          "rgba(54, 162, 235, 0.2)",
                          "rgba(255, 206, 86, 0.2)",
                          "rgba(75, 192, 192, 0.2)",
                          "rgba(153, 102, 255, 0.2)",
                          "rgba(255, 159, 64, 0.2)",
                        ],
                        borderColor: [
                          "rgba(255, 99, 132, 1)",
                          "rgba(54, 162, 235, 1)",
                          "rgba(255, 206, 86, 1)",
                          "rgba(75, 192, 192, 1)",
                          "rgba(153, 102, 255, 1)",
                          "rgba(255, 159, 64, 1)",
                        ],
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
                onClick={handleDeleteAccount}
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
