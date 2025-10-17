import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTombSecret } from "@/hooks/useTombSecrets";
import { LogOut, Copy, Check, ChevronDown, Wallet } from "lucide-react";

export function WalletDisplay() {
  const { subAccount, connected, balance, isLoadingBalance, disconnectWallet } =
    useTombSecret();
  const [copied, setCopied] = useState(false);

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const handleCopyAddress = async () => {
    if (!subAccount?.address) return;

    try {
      await navigator.clipboard.writeText(subAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!connected || !subAccount) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="cyber-border bg-background/95 backdrop-blur hover:bg-primary/10 flex items-center gap-2 min-w-0"
        >
          <Wallet className="h-4 w-4 flex-shrink-0" />
          <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
            {formatAddress(subAccount.address)}
          </Badge>
          <ChevronDown className="h-3 w-3 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 bg-background/95 backdrop-blur border-primary/20"
        align="end"
      >
        <DropdownMenuLabel className="font-semibold text-primary">
          Wallet Details
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Address Section */}
        <div className="px-2 py-1.5">
          <div className="text-xs text-muted-foreground mb-1">Address</div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 break-all">
              {subAccount.address}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={handleCopyAddress}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Balance Section */}
        <div className="px-2 py-1.5">
          <div className="text-xs text-muted-foreground mb-1">Balance</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {isLoadingBalance ? "Loading..." : `${balance} ETH`}
            </span>
            {isLoadingBalance && (
              <div className="h-3 w-3 border border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Disconnect Button */}
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
