import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HieroglyphBackground from "@/components/HieroglyphBackground";
import { Navbar } from "@/components/layout/Navbar";
import { HowToPlayModal } from "@/components/modals/HowToPlayModal";
import { RoomMetadata } from "@/contexts/TombSecretsProvider";
import { useContractEvents } from "@/services/eventHandler";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, HelpCircle } from "lucide-react";
import { useTombSecret } from "@/hooks/useTombSecrets";

interface GuessData {
  turnIndex: number;
  digits: string[];
  result?: {
    breached: number;
    injured: number;
  };
  timestamp: number;
}

export default function GameScreen() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { toast } = useToast();

  const { getRoom, isProviderReady, submitGuess, contract, subAccount } = useTombSecret();

  // State for room data
  const [roomData, setRoomData] = useState<RoomMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  const [gameEndModal, setGameEndModal] = useState<{
    isOpen: boolean;
    outcome?: "won" | "lost";
    claimed?: boolean;
  }>({ isOpen: false });
  const [selectedDigits, setSelectedDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Real game data from contract
  const [playerGuesses, setPlayerGuesses] = useState<GuessData[]>([]);
  const [opponentGuesses, setOpponentGuesses] = useState<GuessData[]>([]);

  // Setup event handlers
  const eventHandlers = useContractEvents({
    onProbeSubmitted: (event) => {
      console.log("Probe submitted:", event);
      // Don't add yet, wait for result
    },
    onResultComputed: (event) => {
      console.log("Result computed:", event);
      if (event.roomId !== roomId) return;

      const guessData: GuessData = {
        turnIndex: event.turnIndex,
        digits: [], // Will be filled from somewhere
        result: event.signedResult
          ? {
              breached: event.signedResult.breaches,
              injured: event.signedResult.signals,
            }
          : undefined,
        timestamp: event.timestamp,
      };

      // Determine if this is player or opponent guess
      const isPlayerGuess = event.submitter.toLowerCase() === subAccount?.address.toLowerCase();
      
      if (isPlayerGuess) {
        setPlayerGuesses((prev) => {
          const existing = prev.find((g) => g.turnIndex === event.turnIndex);
          if (existing) {
            return prev.map((g) =>
              g.turnIndex === event.turnIndex
                ? { ...g, result: guessData.result }
                : g
            );
          }
          return [...prev, guessData];
        });
      } else {
        setOpponentGuesses((prev) => {
          const existing = prev.find((g) => g.turnIndex === event.turnIndex);
          if (existing) {
            return prev.map((g) =>
              g.turnIndex === event.turnIndex
                ? { ...g, result: guessData.result }
                : g
            );
          }
          return [...prev, guessData];
        });
      }
    },
  });

  // Initialize event listeners
  useEffect(() => {
    if (contract) {
      const { eventHandler } = require("@/services/eventHandler");
      eventHandler.initialize(contract, eventHandlers);
      
      return () => {
        eventHandler.stopListening();
      };
    }
  }, [contract, eventHandlers]);

  // Load room data on mount
  useEffect(() => {
    const loadRoomData = async () => {
      if (!roomId || !isProviderReady) return;

      try {
        setLoading(true);
        const data = await getRoom(Number(roomId));
        console.log(data);
        if (!data) {
          toast({
            title: "❌ Room not found",
            description: "This room does not exist or has expired.",
            variant: "destructive",
          });
          navigate("/");
        } else {
          setRoomData(data as RoomMetadata);
        }
      } catch (error) {
        console.error("Failed to load room:", error);
        toast({
          title: "❌ Failed to load room",
          description: "Could not connect to the game room.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [roomId, getRoom, toast, navigate, isProviderReady]);

  const handleDigitSelect = (digit: string) => {
    const emptyIndex = selectedDigits.findIndex((d) => !d);
    if (emptyIndex !== -1 && !selectedDigits.includes(digit)) {
      const newDigits = [...selectedDigits];
      newDigits[emptyIndex] = digit;
      setSelectedDigits(newDigits);
    }
  };

  const handleDeleteLast = () => {
    for (let i = selectedDigits.length - 1; i >= 0; i--) {
      if (selectedDigits[i] !== "") {
        const newDigits = [...selectedDigits];
        newDigits[i] = "";
        setSelectedDigits(newDigits);
        break;
      }
    }
  };

  const handleClear = () => {
    setSelectedDigits(["", "", "", ""]);
  };

  const handleSubmit = useCallback(async () => {
    if (selectedDigits.some((digit) => !digit)) {
      toast({
        title: "Incomplete guess",
        description: "Select all 4 hieroglyphs",
        variant: "destructive",
      });
      return;
    }

    if (new Set(selectedDigits).size !== 4) {
      toast({
        title: "Invalid guess",
        description: "All hieroglyphs must be unique",
        variant: "destructive",
      });
      return;
    }

    if (!roomId) return;

    try {
      setIsSubmitting(true);

      // Add optimistic update
      const newGuess: GuessData = {
        turnIndex: playerGuesses.length,
        digits: [...selectedDigits],
        timestamp: Date.now(),
      };

      setPlayerGuesses((prev) => [...prev, newGuess]);

      // Submit to blockchain
      const guess = selectedDigits.map(Number);
      await submitGuess(roomId, guess);

      setSelectedDigits(["", "", "", ""]);

      toast({
        title: "Excavation launched!",
        description: "Probing tomb defenses...",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again.",
        variant: "destructive",
      });
      // Remove optimistic update on error
      setPlayerGuesses((prev) => prev.slice(0, -1));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDigits, playerGuesses.length, toast, roomId, submitGuess]);

  const handleReturnHome = () => {
    navigate("/");
  };

  const handleClaimWager = () => {
    setGameEndModal((prev) => ({ ...prev, claimed: true }));
    toast({
      title: "Wager claimed!",
      description: "Transaction successful",
    });
  };

  const copyInvitationLink = () => {
    const url = `${window.location.origin}/join?room=${roomId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Invitation link copied!",
      description: "Share with your opponent",
    });
  };

  // Determine game state - force player turn for testing
  const isPlayerTurn = true;

  const isComplete = selectedDigits.every((digit) => digit !== "");
  const canSubmit = isComplete && !isSubmitting && isPlayerTurn;

  // Listen for Enter key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && canSubmit) {
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [canSubmit, handleSubmit]);

  const getPhaseText = (phase: number) => {
    switch (phase) {
      case 0:
        return "Waiting for opponent";
      case 1:
        return "Battle in progress";
      case 2:
        return "Battle completed";
      case 3:
        return "Room cancelled";
      default:
        return "Unknown status";
    }
  };

  if (loading || !roomData || !isProviderReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        <Navbar />
        <HieroglyphBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-primary font-serif">
              {!isProviderReady
                ? "Awakening ancient powers..."
                : "Loading tomb chamber..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show waiting state if no opponent
  if (roomData.phase === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        <Navbar />
        <HieroglyphBackground />
        <div className="relative z-10 container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="p-8 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20">
              <h1 className="text-3xl font-bold text-primary font-serif mb-4">
                TOMB {roomId}
              </h1>
              <div className="space-y-4">
                <div className="text-lg text-accent font-serif">
                  {getPhaseText(roomData.phase)}
                </div>
                <div className="animate-pulse text-primary">
                  Awaiting rival explorer...
                </div>
                <div className="text-sm text-muted-foreground">
                  Wager: {roomData?.wager || "0"} ETH
                </div>
                <Button onClick={() => navigate("/")} variant="outline">
                  Return to Temple
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden pb-32">
      <Navbar />
      <HieroglyphBackground />

      <div className="relative z-10 container mx-auto px-4 py-4">
        {/* Room Info Header */}
        <div className="mb-4 p-4 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-primary font-serif">
                TOMB {roomId}
              </h1>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-accent font-serif">
                  WAGER: {roomData.wager} ETH
                </span>
                <span className="text-primary font-serif">
                  STATUS: {getPhaseText(roomData.phase)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyInvitationLink}
                className="flex items-center gap-2 hover:shadow-primary/30 hover:shadow-lg transition-all"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHowToPlay(true)}
                className="w-8 h-8 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 hover:shadow-primary/30 hover:shadow-lg transition-all animate-pulse"
              >
                <HelpCircle className="w-4 h-4 text-primary" />
              </Button>
            </div>
          </div>
        </div>

        {/* Split Screen Battle Layout */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Left Side - My Excavations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary font-serif">
                MY EXCAVATIONS → OPPONENT TOMB
              </h2>
              {isPlayerTurn && (
                <span className="text-xs text-primary animate-pulse font-serif">
                  YOUR TURN
                </span>
              )}
            </div>

            <div className="space-y-2">
              {/* Previous Guesses */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {playerGuesses.map((guess) => (
                  <div
                    key={guess.turnIndex}
                    className="rounded-lg p-3 bg-card/30 border border-primary/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {guess.digits.map((digit, index) => (
                          <div
                            key={index}
                            className="w-12 h-12 rounded border border-primary/30 bg-primary/10 flex items-center justify-center font-serif font-bold text-xl text-primary"
                          >
                            {digit}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1 text-xs font-serif">
                        {guess.result ? (
                          <>
                            <span className="px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/30 text-green-400">
                              B:{guess.result.breached}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
                              S:{guess.result.injured}
                            </span>
                          </>
                        ) : (
                          <span className="px-1.5 py-0.5 text-muted-foreground">
                            Computing...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Input Row */}
              <div
                className={`rounded-lg p-3 transition-all ${
                  isPlayerTurn
                    ? "bg-primary/10 border border-primary/40"
                    : "bg-card/20 border border-muted/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {selectedDigits.map((digit, index) => (
                      <div
                        key={index}
                        className={`w-12 h-12 rounded border-2 border-dashed flex items-center justify-center font-serif font-bold text-xl transition-all ${
                          isPlayerTurn
                            ? "border-primary/50 bg-primary/5 text-primary"
                            : "border-muted/30 bg-muted/5 text-muted-foreground"
                        }`}
                      >
                        {digit || "•"}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs font-serif">
                    {isPlayerTurn ? (
                      <span className="text-primary animate-pulse">
                        READY
                      </span>
                    ) : (
                      <span className="text-accent animate-pulse">
                        WAIT...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Opponent's Excavations */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-accent font-serif">
              OPPONENT EXCAVATIONS → MY TOMB
            </h2>

            <div className="space-y-2">
              {/* Opponent's Active Row */}
              <div className="rounded-lg p-3 bg-card/20 border border-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="w-10 h-10 rounded border-2 border-dashed border-accent/30 bg-accent/5 flex items-center justify-center font-serif font-bold text-lg text-accent"
                      >
                        •
                      </div>
                    ))}
                  </div>
                  <div className="text-xs font-serif">
                    <span className="text-muted-foreground">
                      AWAITING
                    </span>
                  </div>
                </div>
              </div>

              {/* Opponent's Previous Guesses */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {opponentGuesses.map((guess) => (
                  <div
                    key={guess.turnIndex}
                    className="rounded-lg p-3 bg-card/30 border border-accent/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {guess.digits.map((digit, index) => (
                          <div
                            key={index}
                            className="w-12 h-12 rounded border border-accent/30 bg-accent/10 flex items-center justify-center font-serif font-bold text-xl text-accent"
                          >
                            {digit}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1 text-xs font-serif">
                        {guess.result && (
                          <>
                            <span className="px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/30 text-green-400">
                              B:{guess.result.breached}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
                              S:{guess.result.injured}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Input Keypad Overlay */}
        {isPlayerTurn && (
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/95 via-background/90 to-transparent backdrop-blur-sm">
            <div className="container mx-auto max-w-md">
              {/* Number Grid */}
              <div className="grid grid-cols-5 gap-2 mb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((number) => (
                  <Button
                    key={number}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDigitSelect(number.toString())}
                    disabled={
                      selectedDigits.includes(number.toString()) ||
                      selectedDigits.every((d) => d !== "")
                    }
                    className="h-10 text-lg font-serif bg-primary/5 hover:bg-primary/20 border-primary/30 text-primary"
                  >
                    {number}
                  </Button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteLast}
                  disabled={selectedDigits.every((d) => d === "")}
                  className="font-serif text-xs"
                >
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={selectedDigits.every((d) => d === "")}
                  className="font-serif text-xs"
                >
                  Clear
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="min-w-28 font-serif bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "EXCAVATE"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game End Modal */}
      {gameEndModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-card/90 backdrop-blur-sm p-8 rounded-lg border text-center max-w-md mx-4 shadow-2xl">
            <h2
              className={`text-3xl font-bold font-serif mb-6 ${
                gameEndModal.outcome === "won"
                  ? "text-green-400 drop-shadow-[0_0_10px_rgb(34,197,94)]"
                  : "text-red-400 drop-shadow-[0_0_10px_rgb(239,68,68)]"
              }`}
            >
              {gameEndModal.outcome === "won"
                ? "TOMB BREACHED"
                : "YOUR TOMB HAS BEEN PLUNDERED"}
            </h2>
            <div className="mb-8">
              <p
                className={`text-xl font-serif ${
                  gameEndModal.outcome === "won"
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {gameEndModal.outcome === "won" ? "Victory is yours!" : ""}
              </p>
              <p className="text-lg font-serif text-muted-foreground mt-2">
                Wager: {roomData?.wager || "0"} ETH
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              {gameEndModal.outcome === "won" ? (
                gameEndModal.claimed ? (
                  <Button
                    onClick={handleReturnHome}
                    className="min-w-32"
                  >
                    Exit to Temple
                  </Button>
                ) : (
                  <Button
                    onClick={handleClaimWager}
                    className="min-w-32 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Claim Treasure
                  </Button>
                )
              ) : (
                <Button
                  onClick={handleReturnHome}
                  className="min-w-32"
                >
                  Exit to Temple
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </div>
  );
}
