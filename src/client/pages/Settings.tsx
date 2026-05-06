import { useState } from "react";
import {
  User,
  Shield,
  Zap,
  Database,
  CreditCard,
  ChevronRight,
  Monitor,
  Cpu,
  Heart,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "@/components/theme-provider";

const SettingGroup = ({ title, description, children }: any) => (
  <div className="space-y-6">
    <div className="space-y-1">
      <h3 className="text-xl font-bold text-foreground tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground font-medium">{description}</p>
    </div>
    <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
      {children}
    </div>
  </div>
);

const SettingItem = ({
  icon: Icon,
  label,
  description,
  rightElement,
  border = true,
}: any) => (
  <div
    className={cn(
      "flex items-center justify-between p-4 sm:p-6 gap-3 transition-colors hover:bg-muted/50",
      border && "border-b border-border",
    )}
  >
    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
      <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-foreground uppercase tracking-wider truncate">
          {label}
        </div>
        <div className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
          {description}
        </div>
      </div>
    </div>
    <div className="shrink-0">{rightElement}</div>
  </div>
);

const modeDescriptions: Record<string, string> = {
  Gentle: "Support me with calm encouragement.",
  Balanced: "Guide me with clarity and consistency.",
  Driven: "Push me with stronger accountability.",
};

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [protocol, setProtocol] = useState(
    localStorage.getItem("nova_protocol") || "Balanced",
  );
  const [mirroring, setMirroring] = useState(
    localStorage.getItem("nova_mirroring") !== "false",
  );
  const [intervention, setIntervention] = useState(
    localStorage.getItem("nova_intervention") !== "false",
  );

  const toggleProtocol = () => {
    const protocols = ["Gentle", "Balanced", "Driven"];
    const next =
      protocols[(protocols.indexOf(protocol) + 1) % protocols.length];
    setProtocol(next);
    localStorage.setItem("nova_protocol", next);
    toast({
      title: "Nova mode updated",
      description: `${next} mode is now active.`,
    });
  };

  const updateSetting = (
    key: string,
    val: boolean,
    setter: any,
    label: string,
  ) => {
    setter(val);
    localStorage.setItem(key, String(val));
    toast({
      title: "Settings updated",
      description: `${label} is now ${val ? "on" : "off"}.`,
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
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground font-semibold text-sm">
          Choose how Nova guides you and how Pulse handles your financial data.
        </p>
      </div>

      <div className="space-y-12 pb-20">
        <SettingGroup
          title="Visual protocol"
          description="Customize the interface to match your environment."
        >
          <div className="grid grid-cols-3 gap-0 divide-x divide-border border-b border-border">
            {[
              { id: "light", icon: Sun, label: "Light" },
              { id: "dark", icon: Moon, label: "Dark" },
              { id: "system", icon: Monitor, label: "System" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setTheme(m.id as any)}
                className={cn(
                  "flex flex-col items-center gap-3 py-8 transition-all hover:bg-muted/50",
                  theme === m.id ? "bg-muted text-primary" : "text-muted-foreground"
                )}
              >
                <m.icon className={cn("w-6 h-6", theme === m.id ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", theme === m.id ? "text-primary" : "text-muted-foreground")}>
                  {m.label}
                </span>
                {theme === m.id && (
                  <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(45,237,156,0.8)] mt-1" />
                )}
              </button>
            ))}
          </div>
        </SettingGroup>

        <SettingGroup
          title="Nova guidance"
          description="Adjust how Nova reads your patterns and how strongly she steps in."
        >
          <SettingItem
            icon={Cpu}
            label="Pattern awareness"
            description="Let Nova analyze spending behavior, category shifts, and repeated triggers."
            rightElement={
              <Switch
                checked={mirroring}
                onCheckedChange={(v) =>
                  updateSetting(
                    "nova_mirroring",
                    v,
                    setMirroring,
                    "Pattern awareness",
                  )
                }
              />
            }
          />
          <SettingItem
            icon={Zap}
            label="Proactive nudges"
            description="Allow Nova to surface timely reminders when spending patterns start to drift."
            rightElement={
              <Switch
                checked={intervention}
                onCheckedChange={(v) =>
                  updateSetting(
                    "nova_intervention",
                    v,
                    setIntervention,
                    "Proactive nudges",
                  )
                }
              />
            }
          />
          <SettingItem
            icon={Heart}
            label="Nova mode"
            description={
              modeDescriptions[protocol] || modeDescriptions.Balanced
            }
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
          title="Security & data"
          description="Your financial records should be durable, private, and easy to export when needed."
        >
          <SettingItem
            icon={Shield}
            label="Encryption"
            description="Sensitive financial data is protected with bank-grade security practices."
            rightElement={
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(45,237,156,0.5)]" />
            }
          />
          <SettingItem
            icon={Database}
            label="Export records"
            description="Download your financial data in a structured format for review or reporting."
            rightElement={
              <button
                className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                onClick={() =>
                  toast({
                    title: "Export started",
                    description: "Preparing your data for download...",
                  })
                }
              >
                Export data
              </button>
            }
          />
          <SettingItem
            icon={User}
            label="Account details"
            description="Manage your login information and future account preferences."
            rightElement={
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            }
            border={false}
          />
        </SettingGroup>

        <SettingGroup
          title="Billing"
          description="Manage your Pulse plan and account access."
        >
          <SettingItem
            icon={CreditCard}
            label="Current plan"
            description="Pulse Professional"
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
