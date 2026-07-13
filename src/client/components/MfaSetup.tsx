import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, ShieldAlert, Loader2, QrCode, Trash2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/components/ui/use-toast";

export function MfaSetup() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  
  const [setupData, setSetupData] = useState<{ qr_code: string; secret: string; id: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactor = data.totp[0];
      if (totpFactor && totpFactor.status === "verified") {
        setIsEnrolled(true);
        setFactorId(totpFactor.id);
      } else {
        setIsEnrolled(false);
        setFactorId(null);
      }
    } catch (err: any) {
      console.error("[MFA STATUS]", err);
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error) throw error;
      
      setSetupData({
        qr_code: data.totp.qr_code,
        secret: data.totp.secret,
        id: data.id,
      });
      setVerifyCode("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const cancelEnrollment = async () => {
    if (setupData) {
      // Unenroll the unverified factor just to clean up
      await supabase.auth.mfa.unenroll({ factorId: setupData.id });
    }
    setSetupData(null);
    setVerifyCode("");
  };

  const completeEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || verifyCode.length !== 6) return;

    setActionLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: setupData.id,
      });
      if (challengeError) throw challengeError;

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: setupData.id,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "Security Upgraded",
        description: "Multi-Factor Authentication is now active.",
      });
      setIsEnrolled(true);
      setFactorId(setupData.id);
      setSetupData(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: err.message || "Invalid authentication code.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const disableMfa = async () => {
    if (!factorId) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      
      toast({
        title: "Security Downgraded",
        description: "Multi-Factor Authentication has been disabled.",
      });
      setIsEnrolled(false);
      setFactorId(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Disable Failed",
        description: err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEnrolled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {isEnrolled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Multi-Factor Authentication</h3>
          <p className="text-sm font-medium text-muted-foreground">
            {isEnrolled ? "Your account has maximum security." : "Add an extra layer of protection."}
          </p>
        </div>
      </div>

      {!isEnrolled && !setupData && (
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Use an authenticator app (like Google Authenticator or Authy) to generate one-time passwords. This significantly reduces the risk of unauthorized access.
          </p>
          <button
            onClick={startEnrollment}
            disabled={actionLoading}
            className="bg-primary/10 border border-primary/30 text-primary font-black py-3 px-6 rounded-xl flex items-center gap-2 hover:bg-primary/20 transition-all uppercase tracking-widest text-xs"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
            Enable MFA
          </button>
        </div>
      )}

      {isEnrolled && !setupData && (
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-primary font-bold">Status: Active</p>
          <button
            onClick={disableMfa}
            disabled={actionLoading}
            className="text-destructive hover:bg-destructive/10 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-xs uppercase tracking-wider"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Disable
          </button>
        </div>
      )}

      {setupData && (
        <div className="pt-4 border-t border-border animate-in fade-in slide-in-from-top-4 duration-500">
          <h4 className="font-bold text-foreground mb-2">Step 1: Scan QR Code</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Scan the image below with your authenticator app.
          </p>
          
          <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-md" dangerouslySetInnerHTML={{ __html: setupData.qr_code }} />

          <h4 className="font-bold text-foreground mb-2">Step 2: Verify Code</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the 6-digit code generated by the app to verify the setup.
          </p>

          <form onSubmit={completeEnrollment} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <InputOTP
              maxLength={6}
              value={verifyCode}
              onChange={(val) => setVerifyCode(val)}
              disabled={actionLoading}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot 
                    key={index} 
                    index={index} 
                    className="w-10 h-12 text-lg font-bold bg-muted/50 border-border rounded-md focus:ring-primary/50 text-foreground"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={cancelEnrollment}
                disabled={actionLoading}
                className="py-3 px-4 rounded-lg border border-border text-muted-foreground font-bold hover:bg-muted/50 transition-colors uppercase tracking-wider text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || verifyCode.length !== 6}
                className="bg-primary text-primary-foreground font-black py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:hover:scale-100"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
