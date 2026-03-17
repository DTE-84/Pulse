import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Zap, 
  Database, 
  CreditCard,
  ChevronRight,
  Monitor,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

const SettingGroup = ({ title, description, children }: any) => (
  <div className="space-y-6">
    <div className="space-y-1">
      <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground font-medium">{description}</p>
    </div>
    <div className="bg-[#0A0907] border border-white/[0.03] rounded-[2rem] overflow-hidden">
      {children}
    </div>
  </div>
);

const SettingItem = ({ icon: Icon, label, description, rightElement, border = true }: any) => (
  <div className={cn(
    "flex items-center justify-between p-6 transition-colors hover:bg-white/[0.01]",
    border && "border-b border-white/[0.03]"
  )}>
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <div className="text-sm font-bold text-white uppercase tracking-wider">{label}</div>
        <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{description}</div>
      </div>
    </div>
    {rightElement}
  </div>
);

export default function Settings() {
  const { toast } = useToast();
  const [protocol, setProtocol] = useState(localStorage.getItem("nova_protocol") || "Balanced");
  const [mirroring, setMirroring] = useState(localStorage.getItem("nova_mirroring") === "true");
  const [intervention, setIntervention] = useState(localStorage.getItem("nova_intervention") === "true");

  const toggleProtocol = () => {
    const protocols = ["Balanced", "Aggressive", "Empathetic"];
    const next = protocols[(protocols.indexOf(protocol) + 1) % protocols.length];
    setProtocol(next);
    localStorage.setItem("nova_protocol", next);
    toast({
      title: "Nova Protocol Shift",
      description: `Uplink re-configured to ${next} frequency.`,
    });
  };

  const updateSetting = (key: string, val: boolean, setter: any, label: string) => {
    setter(val);
    localStorage.setItem(key, String(val));
    toast({
      title: "System Integrity Updated",
      description: `${label} is now ${val ? 'active' : 'disabled'}.`,
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          <span>Home</span>
          <ChevronRight className="w-3 h-3 opacity-30" />
          <span className="text-primary">Settings</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">System Configuration</h1>
        <p className="text-muted-foreground font-semibold text-sm">
          Optimize the Pulse Behavioral Engine and Nova protocols.
        </p>
      </div>

      <div className="space-y-12 pb-20">
        <SettingGroup 
          title="Nova Intelligence Protocol" 
          description="Adjust how Nova monitors and intervenes in your spending rhythm."
        >
          <SettingItem 
            icon={Cpu}
            label="Behavioral Mirroring"
            description="Allow Nova to analyze and mirror your spending patterns for deeper insight."
            rightElement={<Switch checked={mirroring} onCheckedChange={(v) => updateSetting("nova_mirroring", v, setMirroring, "Behavioral Mirroring")} />}
          />
          <SettingItem 
            icon={Zap}
            label="Proactive Intervention"
            description="Nova will automatically suggest spending pauses during high-velocity surges."
            rightElement={<Switch checked={intervention} onCheckedChange={(v) => updateSetting("nova_intervention", v, setIntervention, "Proactive Intervention")} />}
          />
          <SettingItem 
            icon={Monitor}
            label="Nova Tone"
            description={`Current Protocol: ${protocol}. Adjust the AI's communication style.`}
            rightElement={
              <Badge 
                variant="outline" 
                className="text-[9px] font-black uppercase tracking-[0.2em] border-primary/30 text-primary px-3 py-1 cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={toggleProtocol}
              >
                {protocol}
              </Badge>
            }
            border={false}
          />
        </SettingGroup>

        <SettingGroup 
          title="Security & Data Integrity" 
          description="Manage your DTE Ecosystem uplink and encryption protocols."
        >
          <SettingItem 
            icon={Shield}
            label="Bank-Grade Encryption"
            description="AES-256 bit encryption is active for all linked financial data."
            rightElement={<div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(45,237,156,0.5)]" />}
          />
          <SettingItem 
            icon={Database}
            label="Data Portability"
            description="Export your high-fidelity behavioral data as JSON or CSV."
            rightElement={<button className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline" onClick={() => toast({ title: "Data Export Requested", description: "Preparing encrypted archive..." })}>Export Data</button>}
          />
          <SettingItem 
            icon={User}
            label="Secret Key Management"
            description="Update your uplink credentials and multi-factor protocols."
            rightElement={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
            border={false}
          />
        </SettingGroup>

        <SettingGroup 
          title="Subscription & Access" 
          description="Manage your Pulse tier and ecosystem access."
        >
          <SettingItem 
            icon={CreditCard}
            label="Current Plan"
            description="Tier: Pulse Professional (High-Fidelity)."
            rightElement={
              <Badge className="bg-primary text-background text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1">
                Active
              </Badge>
            }
            border={false}
          />
        </SettingGroup>
      </div>
    </div>
  );
}

