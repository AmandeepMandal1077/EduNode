import { motion, AnimatePresence } from "motion/react";
import { User, Shield, CreditCard } from "lucide-react";

import { useProfile } from "@/hooks/useProfile";
import { ProfileGeneralTab } from "@/components/profile/ProfileGeneralTab";
import { ProfileSecurityTab } from "@/components/profile/ProfileSecurityTab";
import { ProfileBillingTab } from "@/components/profile/ProfileBillingTab";

const TABS = [
  { id: "general", label: "General", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

export function ProfilePage() {
  const { activeTab, setActiveTab, user, setUser, purchases } = useProfile();

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
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left cursor-pointer ${
                    activeTab === tab.id
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

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === "general" && <ProfileGeneralTab key="general" user={user} setUser={setUser} />}
              {activeTab === "security" && <ProfileSecurityTab key="security" />}
              {activeTab === "billing" && <ProfileBillingTab key="billing" purchases={purchases} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
