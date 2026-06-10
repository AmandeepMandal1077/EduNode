import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Shield,
  CreditCard,
  Camera,
  Save,
  Loader2,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, updateUser } from "@/services/userService";
import { getPurchaseHistory } from "@/services/userService";
import type { User as UserType, Purchase } from "@/types";

const TABS = [
  { id: "general", label: "General", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState("general");
  const [user, setUser] = useState<UserType | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBio, setFormBio] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [nameError, setNameError] = useState("");
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    Promise.all([getCurrentUser(), getPurchaseHistory()]).then(([u, p]) => {
      setUser(u);
      setPurchases(p);
      if (u) {
        setFormName(u.name);
        setFormBio(u.bio);
      }
    });
  }, []);

  useEffect(() => {
    setNameError("");
    setGeneralError("");
  }, [activeTab]);

  const handleSaveGeneral = async () => {
    setNameError("");
    setGeneralError("");

    let hasError = false;
    if (!formName.trim()) {
      setNameError("Name cannot be empty.");
      hasError = true;
    } else if (formName.length > 50) {
      setNameError("Name cannot exceed 50 characters.");
      hasError = true;
    }

    if (formBio.length > 250) {
      setGeneralError("Bio cannot exceed 250 characters.");
      hasError = true;
    }

    if (hasError) return;

    try {
      setSaving(true);
      const updated = await updateUser({ name: formName, bio: formBio });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      setGeneralError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = () => {
    setPwError("");
    if (!newPassword || newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword.length > 32) {
      setPwError("Password cannot exceed 32 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwSaved(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPwSaved(false), 2500);
  };

  const statusColor: Record<Purchase["status"], string> = {
    completed: "bg-emerald-100 text-emerald-700 border-0",
    refunded: "bg-rose-100 text-rose-700 border-0",
    pending: "bg-amber-100 text-amber-700 border-0",
    failed: "bg-red-100 text-red-700 border-0",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-slate-900 mb-8"
        >
          Settings
        </motion.h1>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Side nav */}
          <motion.nav
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="sm:w-48 flex-shrink-0"
          >
            <div className="bento-card p-2 flex flex-col gap-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  id={`profile-tab-${tab.id}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.nav>

          {/* Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === "general" && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="bento-card flex flex-col gap-6"
                >
                  <h2 className="text-lg font-bold text-slate-800">General Information</h2>

                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0 overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
                    >
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={formName} className="w-full h-full object-cover" />
                      ) : (
                        formName?.slice(0, 2).toUpperCase() ?? "U"
                      )}
                    </div>
                    <div>
                      <Button variant="outline" size="sm" className="border-slate-200 rounded-lg text-sm">
                        <Camera className="w-3.5 h-3.5 mr-1.5" />
                        Change photo
                      </Button>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG or GIF. Max 5MB.</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="profile-name" className="text-sm font-medium text-slate-700">Full Name</Label>
                      {nameError && (
                        <p className="text-xs text-rose-600 font-medium" id="profile-name-error">
                          {nameError}
                        </p>
                      )}
                      <Input
                        id="profile-name"
                        value={formName}
                        maxLength={50}
                        onChange={(e) => {
                          setFormName(e.target.value);
                          if (nameError) setNameError("");
                        }}
                        className={`rounded-xl border-slate-200 ${
                          nameError ? "border-rose-500 focus-visible:ring-rose-500/20" : ""
                        }`}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 justify-center">
                      <p className="text-sm font-medium text-slate-700">Email Address</p>
                      <p className="text-sm text-slate-500">
                        {user?.email ?? "Loading..."}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label htmlFor="profile-bio" className="text-sm font-medium text-slate-700">Bio</Label>
                      <textarea
                        id="profile-bio"
                        value={formBio}
                        onChange={(e) => setFormBio(e.target.value)}
                        rows={3}
                        maxLength={250}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                        placeholder="Tell us about yourself..."
                      />
                      <span className="text-[10px] text-slate-400 text-right block mt-0.5">{formBio.length}/250</span>
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <p className="text-sm font-medium text-slate-700">Member Since</p>
                      <p className="text-sm text-slate-500">
                        {user ? new Date(user.joinedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Loading..."}
                      </p>
                    </div>
                  </div>

                  {generalError && (
                    <p className="text-sm text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
                      {generalError}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSaveGeneral}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                      id="profile-save-btn"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <AnimatePresence>
                      {saved && (
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium"
                        >
                          <Check className="w-4 h-4" />
                          Saved!
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="bento-card flex flex-col gap-6"
                >
                  <h2 className="text-lg font-bold text-slate-800">Security</h2>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="security-new-pwd" className="text-sm font-medium text-slate-700">New Password</Label>
                      <div className="relative">
                        <Input
                          id="security-new-pwd"
                          type={showNewPwd ? "text" : "password"}
                          value={newPassword}
                          maxLength={32}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          className="rounded-xl border-slate-200 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label="Toggle password"
                        >
                          {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="security-confirm-pwd" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                      <Input
                        id="security-confirm-pwd"
                        type="password"
                        value={confirmPassword}
                        maxLength={32}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    {pwError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{pwError}</p>
                    )}

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleSavePassword}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                        id="security-save-btn"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Update Password
                      </Button>
                      <AnimatePresence>
                        {pwSaved && (
                          <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium"
                          >
                            <Check className="w-4 h-4" />
                            Updated!
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3 text-sm">Active Sessions</h3>
                    <div className="bento-card p-3 bg-slate-50 border-slate-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Current Session — Windows</p>
                        <p className="text-xs text-slate-500 mt-0.5">Chrome • India • Active now</p>
                      </div>
                      <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-0 text-xs">Current</Badge>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "billing" && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="bento-card flex flex-col gap-6"
                >
                  <h2 className="text-lg font-bold text-slate-800">Purchase History</h2>

                  {purchases.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No purchases yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</th>
                            <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchases.map((p) => (
                            <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-2">
                                <p className="font-medium text-slate-700 line-clamp-1">{p.courseTitle}</p>
                                <p className="text-xs text-slate-400">#{p.id}</p>
                              </td>
                              <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                                {new Date(p.purchasedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                              <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">
                                {p.currency?.toUpperCase() === "INR" || p.currency?.toUpperCase() === "RUPEES" ? "₹" : "$"}{p.amount.toFixed(2)}
                              </td>
                              <td className="py-3 px-2 text-slate-500 text-xs">{p.paymentMethod}</td>
                              <td className="py-3 px-2">
                                <Badge className={`${statusColor[p.status]} text-xs capitalize`}>
                                  {p.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
