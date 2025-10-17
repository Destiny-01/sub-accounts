import { SubAccount, RoomMetadata } from "@/contexts/TombSecretsProvider";
import { ProviderInterface } from "@base-org/account";
import { Contract } from "ethers";
import { createContext, useContext } from "react";

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

  connectWallet: () => Promise<void>;
  createSubAccount: () => Promise<void>;
  setIsLoading: (isLoading: boolean) => void;
  getRoom: (roomId: number) => Promise<RoomMetadata>;
  createRoom: (vaultCode: number[], wager: string) => Promise<string | null>;
  joinRoom: (
    roomId: string,
    vaultCode: number[],
    wager: string
  ) => Promise<string | null>;
  sendCallsFromUniversal: () => Promise<void>;
  disconnectWallet: () => void;
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
