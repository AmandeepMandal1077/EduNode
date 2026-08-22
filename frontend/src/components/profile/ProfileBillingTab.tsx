import { motion } from "motion/react";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Purchase } from "@/types";

interface ProfileBillingTabProps {
  purchases: Purchase[];
}

export function ProfileBillingTab({ purchases }: ProfileBillingTabProps) {
  const statusBadgeVariant: Record<Purchase["status"], "default" | "neutral"> = {
    completed: "default",
    refunded: "neutral",
    pending: "neutral",
    failed: "neutral",
  };

  return (
    <motion.div
      key="billing"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="bg-background border-4 border-border rounded-base p-6 sm:p-8 shadow-shadow flex flex-col gap-6"
    >
      <h2 className="text-xl font-heading font-black text-foreground">Purchase & Billing History</h2>

      {purchases.length === 0 ? (
        <div className="text-center py-12 bg-secondary-background border-2 border-border rounded-base p-6 shadow-shadow">
          <div className="w-12 h-12 rounded-base bg-main border-2 border-border flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_0px_#000]">
            <CreditCard className="w-6 h-6 text-main-foreground" />
          </div>
          <p className="text-foreground font-heading font-bold text-base">No purchases yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-border rounded-base">
          <table className="w-full text-sm">
            <thead className="bg-secondary-background border-b-2 border-border">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-heading font-black text-foreground uppercase tracking-wide">Course</th>
                <th className="text-left py-3 px-4 text-xs font-heading font-black text-foreground uppercase tracking-wide">Date</th>
                <th className="text-left py-3 px-4 text-xs font-heading font-black text-foreground uppercase tracking-wide">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-heading font-black text-foreground uppercase tracking-wide">Method</th>
                <th className="text-left py-3 px-4 text-xs font-heading font-black text-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border/20">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-secondary-background/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-heading font-bold text-foreground line-clamp-1">{p.courseTitle}</p>
                    <p className="text-xs font-mono text-foreground/60">#{p.id}</p>
                  </td>
                  <td className="py-3 px-4 text-foreground/80 font-base whitespace-nowrap">
                    {new Date(p.purchasedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                    {p.currency?.toUpperCase() === "INR" || p.currency?.toUpperCase() === "RUPEES" ? "₹" : "$"}{p.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-foreground/80 font-base text-xs">{p.paymentMethod}</td>
                  <td className="py-3 px-4">
                    <Badge variant={statusBadgeVariant[p.status]} className="text-xs uppercase font-heading font-black">
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
  );
}
