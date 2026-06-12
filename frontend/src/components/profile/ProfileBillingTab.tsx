import { motion } from "motion/react";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Purchase } from "@/types";

interface ProfileBillingTabProps {
  purchases: Purchase[];
}

export function ProfileBillingTab({ purchases }: ProfileBillingTabProps) {
  const statusColor: Record<Purchase["status"], string> = {
    completed: "bg-emerald-100 text-emerald-700 border-0",
    refunded: "bg-rose-100 text-rose-700 border-0",
    pending: "bg-amber-100 text-amber-700 border-0",
    failed: "bg-red-100 text-red-700 border-0",
  };

  return (
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
  );
}
