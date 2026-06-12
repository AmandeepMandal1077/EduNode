import { useState, useEffect } from "react";
import { getCurrentUser, getPurchaseHistory } from "@/services/userService";
import type { User, Purchase } from "@/types";

export function useProfile() {
  const [activeTab, setActiveTab] = useState("general");
  const [user, setUser] = useState<User | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    Promise.all([getCurrentUser(), getPurchaseHistory()]).then(([u, p]) => {
      setUser(u);
      setPurchases(p);
    });
  }, []);

  return {
    activeTab,
    setActiveTab,
    user,
    setUser,
    purchases,
  };
}
