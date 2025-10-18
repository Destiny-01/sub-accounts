import { SubAccount, RoomMetadata } from "@/contexts/TombSecretsProvider";
import { ProviderInterface } from "@base-org/account";
import { Contract } from "ethers";
import { createContext, useContext } from "react";
import { Guess } from "@/types/game";

interface TombSecretContextValue {
  provider: ProviderInterface | null;
  contract: Contract | null;
  subAccount: SubAccount | null;
  universalAddress: string;
  connected: boolean;
  isLoading: boolean;
  loadingUniversal: boolean;
  status: string;
  isProviderReady: boolean;
  playerWins: number;
  balance: string;
  isLoadingBalance: boolean;
  currentRoomId: string | null;
  roomData: RoomMetadata | null;
  roomGuesses: Guess[];
  isListeningToEvents: boolean;

  connectWallet: () => Promise<void>;
  createSubAccount: () => Promise<void>;
  setIsLoading: (isLoading: boolean) => void;
  getRoom: (roomId: number) => Promise<RoomMetadata>;
  loadRoomData: (roomId: number) => Promise<RoomMetadata>;
  createRoom: (vaultCode: number[], wager: string) => Promise<string | null>;
  joinRoom: (
    roomId: string,
    vaultCode: number[],
    wager: string
  ) => Promise<string | null>;
  submitGuess: (roomId: string, guess: number[]) => Promise<string>;
  sendCallsFromUniversal: () => Promise<void>;
  disconnectWallet: () => void;
  setCurrentRoom: (roomId: string | null) => void;
  addGuess: (guess: Guess) => void;
  removeGuess: (turnIndex: number) => void;
}

// ✅ Custom hook for easy consumption
export const TombSecretContext = createContext<TombSecretContextValue | null>(
  null
);

export const useTombSecret = () => {
  const context = useContext(TombSecretContext);
  if (!context) throw new Error("useTomb must be used within a TombProvider");
  return context;
};
