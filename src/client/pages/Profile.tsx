import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Hash, 
  ShieldCheck, 
  ChevronLeft,
  Save,
  Loader2,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { authAPI } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    baselineSpend: user?.baselineSpend || 2500,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        baselineSpend: user.baselineSpend || 2500,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name is required." });
      return;
    }

    setIsSaving(true);
    try {
      const res = await authAPI.updateProfile({
        name: formData.name,
        baselineSpend: formData.baselineSpend,
      });
      
      updateUser({
        name: res.data.user.user_name,
        baselineSpend: res.data.user.baseline_spend,
      });

      toast({
        title: "Profile Updated",
        description: "Your account details have been securely synchronized.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Could not established analytical link to server.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTerminate = async () => {
    setIsDeleting(true);
    try {
      await authAPI.deleteAccount();
      toast({
        title: "Account Terminated",
        description: "Your Pulse profile and all telemetry have been purged.",
      });
      logout();
      navigate("/auth");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Termination Failed",
        description: err.message || "Could not established analytical link to server.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Account Details</h1>
          <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1">Identity & Baseline Configuration</p>
        </div>
      </div>

      <div className="bg-[#12110F] border border-white/5 rounded-[2.5rem] p-8 md:p-10 space-y-8 shadow-2xl">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="profile-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                id="profile-name"
                name="profile-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/[0.02] border-white/5 rounded-2xl py-6 pl-12 focus:border-primary/40 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="space-y-3 opacity-50 cursor-not-allowed">
            <Label htmlFor="profile-email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address (Locked)</Label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="profile-email"
                name="profile-email"
                value={formData.email}
                disabled
                className="bg-white/[0.01] border-white/5 rounded-2xl py-6 pl-12 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="profile-baseline" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Monthly Spending Baseline ($)</Label>
            <div className="relative group">
              <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                id="profile-baseline"
                name="profile-baseline"
                type="number"
                value={formData.baselineSpend}
                onChange={(e) => setFormData({ ...formData, baselineSpend: parseFloat(e.target.value) })}
                className="bg-white/[0.02] border-white/5 rounded-2xl py-6 pl-12 focus:border-primary/40 transition-all font-semibold"
              />
            </div>
            <p className="text-[10px] text-muted-foreground italic ml-1">This is the 'Pulse' Nova uses to detect spending drift.</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-5 bg-primary text-background font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_0_40px_rgba(45,237,156,0.2)] uppercase tracking-[0.2em] text-xs disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Synchronize Changes
            </>
          )}
        </button>
      </div>

      <div className="bg-red-500/[0.02] border border-red-500/10 rounded-[2.5rem] p-8 md:p-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Danger Zone</h3>
            <p className="text-xs text-muted-foreground font-semibold">Irreversible account operations.</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors text-xs font-black uppercase tracking-widest ml-1">
              <Trash2 className="w-4 h-4" />
              Terminate Account & Purge Data
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#0A0908] border-white/10 rounded-[2rem]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white font-black uppercase tracking-tighter text-xl">Confirm Termination</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground font-medium">
                This will permanently delete your Pulse profile, all historical spending telemetry, and cancel any active Nova guidance subscriptions. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel className="bg-white/5 border-white/5 text-white hover:bg-white/10 rounded-xl font-black uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleTerminate}
                disabled={isDeleting}
                className="bg-red-500 text-white hover:bg-red-600 rounded-xl font-black uppercase tracking-widest text-[10px]"
              >
                {isDeleting ? "Purging..." : "Purge Data"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
