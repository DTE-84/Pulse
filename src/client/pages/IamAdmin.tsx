import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, User, Activity, AlertCircle, ChevronDown, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { API } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function IamAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Note: For a true RBAC implementation on frontend, we should ideally get the role in the user object. 
  // We'll enforce at the API level but still show the dashboard if they navigate here.
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, logsRes] = await Promise.all([
        API.get("/api/iam/users"),
        API.get("/api/iam/audit")
      ]);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have Administrator privileges.",
        });
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await API.patch(`/api/iam/users/${userId}/role`, { role: newRole });
      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}.`,
      });
      fetchData();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.response?.data?.message || "Could not update role.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <ShieldAlert className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-black tracking-tight">IAM Portal</h1>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Centralized Identity and Access Management. Monitor organizational identities, access logs, and enforce role-based access control.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Identity Directory */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center space-x-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold tracking-tight">Identity Directory</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 space-y-3">
              {users.map((u) => (
                <div key={u.user_id} className="flex items-center justify-between p-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{u.user_name || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${
                      u.subscription_status === 'terminated' ? 'text-destructive border-destructive' : 'text-primary border-primary'
                    }`}>
                      {u.subscription_status || 'active'}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-colors">
                        <span>{u.system_role}</span>
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRoleChange(u.user_id, 'user')}>
                          User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(u.user_id, 'auditor')}>
                          Auditor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(u.user_id, 'admin')}>
                          Administrator
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold tracking-tight">Access Audit Logs</h2>
              </div>
              <Badge className="bg-muted text-muted-foreground text-[9px] uppercase tracking-wider">Live Monitoring</Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 space-y-3">
              {logs.map((log) => (
                <div key={log.log_id} className="p-4 rounded-xl bg-background border border-border flex flex-col space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="font-bold text-xs uppercase tracking-widest text-primary">{log.action}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium">{log.user_email || `ID: ${log.user_id}`}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">IP: {log.ip_address}</span>
                  </div>
                  
                  {Object.keys(log.details || {}).length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-muted border border-border overflow-x-auto">
                      <pre className="text-[9px] text-muted-foreground font-mono m-0">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
              
              {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mb-3 text-muted-foreground/30" />
                  <p className="text-sm">No recent access anomalies detected.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
