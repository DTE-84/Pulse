import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/components/ui/use-toast";

interface MfaChallengeProps {
  onVerified: () => void;
  onCancel: () => void;
}

export function MfaChallenge({ onVerified, onCancel }: MfaChallengeProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    try {
      // 1. Get the current AAL and identify factors
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;

      if (aalData.currentLevel === "aal2") {
        // Already verified
        onVerified();
        return;
      }

      // 2. Identify the TOTP factor to challenge
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactor = factorsData.totp[0];
      if (!totpFactor) throw new Error("No TOTP factor found on this account.");

      // 3. Challenge the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });
      if (challengeError) throw challengeError;

      // 4. Verify the challenge
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "Identity Verified",
        description: "MFA challenge successful. Establishing uplink.",
      });
      onVerified();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: err.message || "Invalid authentication code.",
      });
      setCode(""); // Clear on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(45,237,156,0.3)]">
        <ShieldAlert className="w-8 h-8 text-primary" />
      </div>
      
      <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">
        Security Protocol
      </h2>
      <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-sm mb-8">
        Your account is protected by Multi-Factor Authentication. Please enter the 6-digit code from your authenticator app.
      </p>

      <form onSubmit={handleVerify} className="w-full max-w-sm flex flex-col items-center gap-8">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(val) => setCode(val)}
          disabled={loading}
          autoFocus
        >
          <InputOTPGroup className="gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot 
                key={index} 
                index={index} 
                className="w-12 h-14 text-xl font-bold bg-muted/50 border-primary/30 rounded-xl focus:ring-primary/50 text-primary"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <div className="flex w-full gap-4 mt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-4 rounded-xl border border-border text-muted-foreground font-black uppercase tracking-widest text-xs hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            Abort
          </button>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="flex-1 bg-primary text-primary-foreground font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(45,237,156,0.25)] uppercase tracking-widest text-xs disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Verify
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
