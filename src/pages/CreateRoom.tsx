import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PapyrusCard } from "@/components/ui/papyrus-card";
import HieroglyphBackground from "@/components/HieroglyphBackground";
import VaultDisplay from "@/components/game/VaultDisplay";
import { Navbar } from "@/components/layout/Navbar";
import { ConnectWalletModal } from "@/components/wallet/ConnectWalletModal";
import { RoomCreatedModal } from "@/components/modals/RoomCreatedModal";
import { HowToPlayModal } from "@/components/modals/HowToPlayModal";
import { useContractEvents } from "@/services/eventHandler";
import { useToast } from "@/hooks/use-toast";
import { Home, Shuffle } from "lucide-react";
import { useTombSecret } from "@/hooks/useTombSecrets";

export default function CreateRoom() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  // Contract integration with event handlers
  const eventHandlers = useContractEvents({
    onRoomCreated: (event) => {
      if (event.creator.toLowerCase() === address?.toLowerCase()) {
        setCreatedRoomId(event.roomId);
        setShowRoomCreatedModal(true);
      }
    },
  });

  const { createRoom, getRoom, isLoading } = useTombSecret();

  const [wager, setWager] = useState("");
  const [vaultCode, setVaultCode] = useState<string[]>(["", "", "", ""]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showRoomCreatedModal, setShowRoomCreatedModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Show how to play modal first, then proceed with room creation
  useEffect(() => {
    setShowHowToPlay(true);
  }, []);

  const proceedWithCreation = () => {
    setShowHowToPlay(false);
  };

  const handleVaultCodeChange = (index: number, value: string) => {
    if (value === "" || (/^\d$/.test(value) && !vaultCode.includes(value))) {
      const newCode = [...vaultCode];
      newCode[index] = value;
      setVaultCode(newCode);
    }
  };

  const generateRandomCode = () => {
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    const randomCode = shuffled.slice(0, 4).map(String);
    setVaultCode(randomCode);
  };

  const clearVaultCode = () => {
    setVaultCode(["", "", "", ""]);
  };

  const isVaultComplete = vaultCode.every((digit) => digit !== "");
  const MIN_WAGER = 0.0001;
  const isWagerValid = wager !== "" && parseFloat(wager) >= MIN_WAGER;
  const isFormValid = isVaultComplete && isWagerValid;

  const handleCreateRoom = async () => {
    // Show How to Play modal first if user clicked create room directly
    if (showHowToPlay) {
      setShowHowToPlay(true);
      return;
    }

    if (!isConnected) {
      setShowConnectModal(true);
      return;
    }

    if (!isFormValid) {
      toast({
        title: "❌ Invalid input",
        description:
          "Please enter a valid wager and complete 4-digit sacred code.",
        variant: "destructive",
      });
      return;
    }
    // console.log(await getRoom(5));

    try {
      setIsCreating(true);

      // Convert string array to number array
      const vaultNumbers = vaultCode.map(Number);

      toast({
        title: "🏺 Sealing your tomb...",
        description: "Locking your sacred code on the ancient blockchain.",
      });

      const roomId = await createRoom(vaultNumbers, wager);

      if (roomId) {
        // Redirect to game page immediately
        navigate(`/game/${roomId}`);
      }
    } catch (error: unknown) {
      console.error("Failed to create room:", error);
      // Error toast already shown by contract hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseRoomCreatedModal = () => {
    setShowRoomCreatedModal(false);
    setCreatedRoomId("");
  };

  const handleGoToGame = () => {
    navigate(`/game/${createdRoomId}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden desert-bg">
      <HieroglyphBackground />

      <Navbar />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <PapyrusCard className="p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold font-egyptian bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ☥ Seal Your Tomb ☥
                </h1>
                <p className="text-muted-foreground font-serif">
                  Wager your gold and lock your sacred 4-digit code
                </p>
              </div>

              {/* Wager Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="wager"
                  className="text-lg font-egyptian font-semibold"
                >
                  Gold Wager (ETH)
                </Label>
                <Input
                  id="wager"
                  type="number"
                  step="0.01"
                  min={MIN_WAGER}
                  placeholder={`${MIN_WAGER} (minimum)`}
                  value={wager}
                  onChange={(e) => setWager(e.target.value)}
                  className="text-lg h-12"
                />
                <p className="text-sm text-muted-foreground">
                  Minimum wager: {MIN_WAGER} ETH
                </p>
              </div>

              {/* Tomb Code Section */}
              <div className="space-y-4">
                <Label className="text-lg font-egyptian font-semibold">
                  Your Sacred Code
                </Label>

                {/* Vault Display */}
                <VaultDisplay
                  isOwner={true}
                  vaultDigits={vaultCode}
                  masked={false}
                  breachedIndices={[]}
                  label="Your Tomb"
                />

                {/* Number Keypad */}
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                    <Button
                      key={num}
                      variant="outline"
                      onClick={() => {
                        const emptyIndex = vaultCode.findIndex(
                          (digit) => digit === ""
                        );
                        if (
                          emptyIndex !== -1 &&
                          !vaultCode.includes(String(num))
                        ) {
                          handleVaultCodeChange(emptyIndex, String(num));
                        }
                      }}
                      disabled={vaultCode.includes(String(num))}
                      className="h-12 text-lg font-bold"
                    >
                      {num}
                    </Button>
                  ))}
                </div>

                {/* Utility Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearVaultCode}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    onClick={generateRandomCode}
                    className="flex-1"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Random
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  onClick={handleCreateRoom}
                  disabled={!isFormValid || isCreating || isLoading}
                  className="w-full h-12 text-lg font-bold btn-egyptian-primary"
                >
                  {isCreating || isLoading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Sealing Tomb...
                    </>
                  ) : (
                    "☥ Seal Tomb & Begin Quest ☥"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Return Home
                </Button>
              </div>
            </div>
          </PapyrusCard>
        </div>
      </div>

      {/* Modals */}
      <ConnectWalletModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
      />

      <RoomCreatedModal
        open={showRoomCreatedModal}
        onOpenChange={handleCloseRoomCreatedModal}
        roomId={createdRoomId}
      />

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        onProceed={proceedWithCreation}
        showProceedButton={true}
      />
    </div>
  );
}
