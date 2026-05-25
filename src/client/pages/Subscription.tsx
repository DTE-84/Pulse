import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export default function SubscriptionPage() {
  const { user } = useAuth();
  
  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-black mb-4">SUBSCRIPTION PROTOCOL</h1>
      <p className="mb-4">User: {user?.name || "Guest"}</p>
      <Link to="/" className="text-primary hover:underline">Return to Dashboard</Link>
    </div>
  );
}
