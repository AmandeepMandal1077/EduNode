import { motion, AnimatePresence } from "motion/react";
import { User, Shield, CreditCard } from "lucide-react";

import { useProfile } from "@/hooks/useProfile";
import { ProfileGeneralTab } from "@/components/profile/ProfileGeneralTab";
import { ProfileSecurityTab } from "@/components/profile/ProfileSecurityTab";
import { ProfileBillingTab } from "@/components/profile/ProfileBillingTab";

const TABS = [
  { id: "general", label: "General Profile", icon: User },
  { id: "security", label: "Security & Login", icon: Shield },
  { id: "billing", label: "Billing & Receipts", icon: CreditCard },
];

export function ProfilePage() {
  const { activeTab, setActiveTab, user, setUser, purchases } = useProfile();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-heading font-black text-foreground mb-8"
        >
          Account Settings
        </motion.h1>

        <div className="flex flex-col sm:flex-row gap-6">
          <motion.nav
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="sm:w-56 flex-shrink-0"
          >
            <div className="bg-secondary-background border-2 border-border rounded-base p-2 shadow-shadow flex flex-col gap-1.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-base text-sm transition-all w-full text-left cursor-pointer border-2 ${
                    activeTab === tab.id
                      ? "bg-main text-main-foreground border-border shadow-[2px_2px_0px_0px_#000] font-heading font-black"
                      : "border-transparent text-foreground font-heading font-bold hover:bg-main/30"
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
