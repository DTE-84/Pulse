import { useState } from "react";
import { 
  Send, 
  Upload, 
  BarChart3, 
  ChevronRight, 
  Loader2, 
  Sparkles, 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

const CampaignCard = ({ title, status, recipients, openRate, clickRate }: any) => (
  <div className="bg-[#0A0907] border border-white/[0.03] rounded-3xl p-6 transition-all hover:bg-[#11100D] hover:border-white/10 group">
    <div className="flex justify-between items-start mb-6">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status === 'Active' ? 'bg-primary' : 'bg-muted-foreground/30')} />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{status}</span>
        </div>
      </div>
      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-white/5 bg-white/5 text-muted-foreground">
        {recipients} Leads
      </Badge>
    </div>

    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
      <div>
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Open Rate</div>
        <div className="text-xl font-black text-white">{openRate}%</div>
      </div>
      <div>
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Click Rate</div>
        <div className="text-xl font-black text-primary">{clickRate}%</div>
      </div>
    </div>
  </div>
);

import { API } from "@/lib/api";

export default function Outreach() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [leadsCount, setLeadsCount] = useState(0);

  const handleFileUpload = (_e: any) => {
    const count = Math.floor(Math.random() * 500) + 100; // Simulated count
    setLeadsCount(count);
    toast({
      title: "Leads Ingested",
      description: `Successfully mapped ${count} high-fidelity contacts.`,
    });
  };

  const deployBroadcast = async () => {
    if (!subject || !message) {
      toast({
        variant: "destructive",
        title: "Protocol Error",
        description: "Subject and Message body required for deployment.",
      });
      return;
    }
    
    setSending(true);
    try {
      // Sending a simulated list of leads for the staging backend
      const leads = Array.from({ length: leadsCount }, (_, i) => ({ email: `lead-${i}@dte.solutions` }));
      
      const res = await API.post("/api/outreach/broadcast", {
        subject,
        message,
        leads
      });

      toast({
        title: "Broadcast Deployed",
        description: `${res.data.message} Tracking ID: ${res.data.trackingId}`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Transmission Breach",
        description: "Could not establish uplink to the Broadcast Engine.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 pb-20">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          <span>Home</span>
          <ChevronRight className="w-3 h-3 opacity-30" />
          <span className="text-primary">Outreach</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">Broadcast Command</h1>
        <p className="text-muted-foreground font-semibold text-sm">
          Deploy high-fidelity messaging to your niche audience via Nova.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Tactical Editor */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0A0907] border border-white/[0.03] rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles size={100} className="text-primary" />
            </div>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Broadcast Subject</label>
                <input 
                  type="text" 
                  placeholder="e.g., Exclusive Opportunity: High-Fidelity Solutions"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 px-6 focus:outline-none focus:border-primary/40 transition-all font-bold text-white placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Broadcast Message</label>
                <textarea 
                  rows={8}
                  placeholder="Draft your high-sophistication message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-3xl py-6 px-6 focus:outline-none focus:border-primary/40 transition-all font-medium text-white placeholder:text-muted-foreground/30 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/5">
              <div className="flex-1 relative group">
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                />
                <button className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:bg-white/10 transition-all">
                  <Upload className="w-4 h-4" />
                  {leadsCount > 0 ? `${leadsCount} Leads Ready` : 'Upload Leads (.csv)'}
                </button>
              </div>
              <button 
                onClick={deployBroadcast}
                disabled={sending || !leadsCount}
                className="flex-[2] bg-primary text-background rounded-2xl py-4 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(45,237,156,0.2)] disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Deploying Transmission...' : 'Deploy Broadcast Protocol'}
              </button>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20 shadow-[0_0_20px_rgba(45,237,156,0.2)]">
               <div className="w-5 h-5 rounded-full bg-primary shadow-[0_0_15px_rgba(45,237,156,1)]" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Nova Analysis</span>
              <p className="text-xs text-white/80 font-medium leading-relaxed italic">
                "Subject line velocity is high. I recommend a 12% increase in professional-grade vernacular to optimize conversion among fiduciary audiences."
              </p>
            </div>
          </div>
        </div>

        {/* Right: Campaigns & Stats */}
        <div className="space-y-8">
          <div className="bg-[#0A0907] border border-white/[0.03] rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Global Telemetry
            </h3>
            <div className="grid gap-4">
              {[
                { label: "Total Deliveries", value: "12,450" },
                { label: "Open Frequency", value: "32.4%" },
                { label: "Conversion Lift", value: "+18%" }
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                  <span className="text-sm font-black text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Active Campaigns</h3>
            <CampaignCard 
              title="Wealth Transfer Early Access" 
              status="Active" 
              recipients="850" 
              openRate="42" 
              clickRate="12" 
            />
            <CampaignCard 
              title="Pulse Beta Launch" 
              status="Completed" 
              recipients="1,200" 
              openRate="38" 
              clickRate="9" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
