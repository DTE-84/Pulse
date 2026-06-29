import { 
  ShieldCheck, 
  FileText, 
  AlertCircle, 
  ChevronLeft 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Legal() {
  const navigate = useNavigate();

  const LegalSection = ({ title, icon: Icon, children }: any) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">{title}</h2>
      </div>
      <div className="bg-muted/50 border border-border rounded-[2.5rem] p-8 md:p-10 text-muted-foreground leading-relaxed text-sm space-y-4 font-medium">
        {children}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Legal Protocol</h1>
          <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-1">DTE Solutions LLC • Behavioral Integrity Standards</p>
        </div>
      </div>

      <LegalSection title="Privacy Policy" icon={ShieldCheck}>
        <p>Last Updated: March 20, 2026</p>
        <p>
          DTE Solutions LLC is committed to protecting your privacy across our ecosystem, including Pulse, SetLogic, and Fluff. 
          We collect identity data (name, email) and financial telemetry (transaction history via Plaid) to provide high-fidelity 
          behavioral insights.
        </p>
        <p>
          <strong>AI Processing:</strong> Your data is processed by Anthropic Claude models for "Nova" insights in secure, transient 
          sessions. We do not use your personal financial data to train global third-party AI models without explicit consent.
        </p>
        <p>
          <strong>Security:</strong> All analytical links are protected by industry-standard AES-256 encryption and SSL. 
          DTE Solutions does not store your banking credentials; all connectivity is handled via the Plaid secure handshake.
        </p>
      </LegalSection>

      <LegalSection title="Terms of Service" icon={FileText}>
        <p>Last Updated: March 20, 2026</p>
        <p>
          Use of Pulse constitutes agreement to these terms. All digital services are provided "as-is." While data integrity 
          is our highest priority, the absolute accuracy of AI-driven insights ("Nova") is not guaranteed.
        </p>
        <p>
          <strong>Intellectual Property:</strong> The Pulse interface, the Nova character logic, and all DTE branding are 
          exclusive property of DTE Solutions LLC. Reverse-engineering of our behavioral mapping protocols is strictly prohibited.
        </p>
        <p>
          <strong>Governing Law:</strong> These terms are governed by the laws of the State of Missouri, United States.
        </p>
      </LegalSection>

      <LegalSection title="Regulatory Disclaimer" icon={AlertCircle}>
        <p className="text-foreground font-bold italic">Pulse is a behavioral intelligence tool, not a licensed financial advisory service.</p>
        <p>
          Nova provides behavioral financial insights based on your spending rhythm. It does not provide regulated financial, 
          investment, tax, or legal advice. Pulse should not be used as the sole basis for high-stakes capital decisions.
        </p>
        <p>
          <strong>Limitation of Liability:</strong> DTE Solutions LLC is not liable for financial losses or data inaccuracies 
          resulting from the use of Nova guidance. Consult a certified financial professional for specific investment strategies.
        </p>
      </LegalSection>

      <div className="pt-12 border-t border-border flex flex-col items-center gap-4">
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
          © 2026 DTE Solutions LLC
        </div>
        <p className="text-[10px] text-white/20 italic text-center max-w-xs leading-relaxed">
          "Your financial rhythm isn't random — Pulse detects it, and Nova helps you understand it."
        </p>
      </div>
    </div>
  );
}
