import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TombIcon from "@/components/TombIcon";
import { WalletButton } from "@/components/wallet/WalletButton";
import { HowToPlayModal } from "@/components/modals/HowToPlayModal";
import { HelpCircle } from "lucide-react";
import { useTombSecret } from "@/hooks/useTombSecrets";

export function Navbar() {
  const location = useLocation();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const { connectWallet, connected, subAccount, universalAddress } =
    useTombSecret();
  console.log(subAccount, universalAddress);

  return (
    <>
      <nav className="border-b-2 border-double border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <TombIcon />
            <span className="text-xl font-bold text-primary hover:text-primary/80 font-egyptian tracking-wider">
              TOMB RAIDERS
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => setShowHowToPlay(true)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 hover:bg-primary/10 font-serif tracking-wider"
              >
                <HelpCircle className="w-4 h-4" />
                The Challenge
              </Button>
            </nav>
            {connected ? (
              <div>
                <p>{subAccount?.address}</p>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                variant="outline"
                className="cyber-border bg-background hover:bg-primary/10"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </nav>

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </>
  );
}
