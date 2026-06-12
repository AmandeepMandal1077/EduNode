import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyCheckoutSession, type PurchaseRecord } from "@/api/purchaseApi";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseRecord | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found in the URL.");
      setLoading(false);
      return;
    }

    async function verifyPayment() {
      try {
        setLoading(true);
        setError(null);
        const res = await verifyCheckoutSession(sessionId!);
        
        if (res) {
          if (res.paid) {
            setPurchase(res.purchase || null);
          } else {
            setError("Stripe payment session has not been paid yet. If you completed payment, it might take a few moments to process.");
          }
        } else {
          throw new Error("Could not verify session.");
        }
      } catch (err: unknown) {
        console.error("Verification error:", err);
        setError(getErrorMessage(err, "Unable to verify your payment status. Please contact support if your account was charged."));
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [sessionId]);

  const handleGoToLearning = () => {
    if (purchase && purchase.course) {
      navigate(`/dashboard`);
    } else {
      navigate("/my-courses");
    }
  };

  return {
    loading,
    error,
    purchase,
    navigate,
    handleGoToLearning,
  };
}
