import React, { useCallback, useState, useEffect } from 'react';
import { usePlaidLink, PlaidLinkOptions } from 'react-plaid-link';
import { plaidAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Link2, Loader2 } from 'lucide-react';

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({ onSuccess, className }) => {
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initPlaid = async () => {
      try {
        const { link_token } = await plaidAPI.createLinkToken();
        setToken(link_token);
      } catch (err: any) {
        console.error("Plaid Init Error:", err);
      }
    };
    initPlaid();
  }, []);

  const onPlaidSuccess = useCallback(async (public_token: string, metadata: any) => {
    setLoading(true);
    try {
      await plaidAPI.exchangeToken(public_token, metadata.institution?.name || "Bank");
      toast({
        title: "Telemetry Linked",
        description: "Your bank account is now part of the Pulse analytical network.",
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Linkage Failed",
        description: "Could not established analytical link to bank.",
      });
    } finally {
      setLoading(false);
    }
  }, [onSuccess, toast]);

  const config: PlaidLinkOptions = {
    token,
    onSuccess: onPlaidSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <Button
      onClick={() => open()}
      disabled={!ready || loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <Link2 className="w-4 h-4 mr-2" />
      )}
      Link Bank Account
    </Button>
  );
};
