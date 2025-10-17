import { useEffect, useState, useCallback } from "react";
import { createBaseAccountSDK, ProviderInterface } from "@base-org/account";
import { baseSepolia } from "viem/chains";
import { TombSecretContext } from "@/hooks/useTombSecrets";
import {
  BytesLike,
  Interface,
  parseEther,
  TransactionReceipt,
  Contract,
} from "ethers";
import { ABI } from "@/lib/abi";
import { formatEther } from "ethers";
import { RoomPhase } from "@/types/game";

// Enhanced room metadata type
export interface RoomMetadata {
  creator: string;
  opponent: string;
  wager: string;
  phase: RoomPhase;
  turnCount: number;
  encryptedWinner?: string;
  createdAt: number;
  lastActiveAt: number;
  winner?: string; // Decrypted winner when available
}

// Probe metadata type
export interface ProbeMetadata {
  submitter: string;
  encryptedGuess: string;
  encryptedBreaches?: string;
  encryptedSignals?: string;
  isWinningProbe: boolean;
  timestamp: number;
  // Decrypted results (when available)
  breaches?: number;
  signals?: number;
}

export interface SubAccount {
  address: `0x${string}`;
  factory?: `0x${string}`;
  factoryData?: `0x${string}`;
}

interface GetSubAccountsResponse {
  subAccounts: SubAccount[];
}

interface WalletAddSubAccountResponse {
  address: `0x${string}`;
  factory?: `0x${string}`;
  factoryData?: `0x${string}`;
}

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

export const TombSecretProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [provider, setProvider] = useState<ProviderInterface | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [subAccount, setSubAccount] = useState<SubAccount | null>(null);
  const [universalAddress, setUniversalAddress] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTombSecret, setLoadingTombSecret] = useState(false);
  const [loadingUniversal, setLoadingUniversal] = useState(false);
  const [status, setStatus] = useState("");
  const [isProviderReady, setIsProviderReady] = useState(false);
  const [playerWins, setPlayerWins] = useState(0);
  const [balance, setBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Initialize SDK
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const sdkInstance = createBaseAccountSDK({
          appName: "Tomb Secrets",
          appChainIds: [baseSepolia.id],
          subAccounts: {
            creation: "on-connect",
            defaultAccount: "sub",
          },
        });
        const providerInstance = sdkInstance.getProvider();
        setProvider(providerInstance);

        // Create contract instance for encoding/decoding (read-only operations)
        const contractInstance = new Contract(contractAddress!, ABI);
        setContract(contractInstance);

        setIsProviderReady(true);
        setStatus("SDK initialized - ready to connect");
      } catch (error) {
        console.error("SDK initialization failed:", error);
        setStatus("SDK initialization failed");
      }
    };

    initializeSDK();
  }, []);

  // Auto-load subAccount if user is already connected
  useEffect(() => {
    const autoConnect = async () => {
      if (!provider || connected) return;

      try {
        // Check if user is already connected
        const accounts = (await provider.request({
          method: "eth_accounts",
          params: [],
        })) as string[];

        if (accounts && accounts.length > 0) {
          const universalAddr = accounts[0];
          setUniversalAddress(universalAddr);
          setConnected(true);

          // Get existing sub accounts
          const response = (await provider.request({
            method: "wallet_getSubAccounts",
            params: [
              { account: universalAddr, domain: window.location.origin },
            ],
          })) as { subAccounts: SubAccount[] };

          const existing = response.subAccounts[0];
          if (existing) {
            setSubAccount(existing);
            setStatus("Auto-connected! Existing Sub Account found");
          } else {
            // Create new sub account if none exists
            const newSubAccount = (await provider.request({
              method: "wallet_addSubAccount",
              params: [
                {
                  account: {
                    type: "create",
                  },
                },
              ],
            })) as SubAccount;
            setSubAccount(newSubAccount);
            setStatus("Auto-connected! New Sub Account created");
          }
        }
      } catch (error) {
        console.error("Auto-connect failed:", error);
        // Don't set error status here as it's not critical
      }
    };

    autoConnect();
  }, [provider, connected]);

  // Fetch balance when subAccount changes
  useEffect(() => {
    if (subAccount?.address) {
      const fetchBalanceEffect = async () => {
        console.log("start fetch");
        if (!provider || !subAccount?.address) {
          setBalance("0");
          return;
        }

        setIsLoadingBalance(true);
        try {
          console.log(subAccount.address);
          const balanceHex = await provider.request({
            method: "eth_getBalance",
            params: [subAccount.address, "latest"],
          });
          console.log(balanceHex);

          const balanceWei = BigInt(String(balanceHex));
          const balanceEth = formatEther(balanceWei);
          setBalance(parseFloat(balanceEth).toFixed(3));
        } catch (error) {
          console.error("Failed to fetch balance:", error);
          setBalance("0");
        } finally {
          setIsLoadingBalance(false);
        }
      };

      fetchBalanceEffect();
    }
  }, [subAccount?.address, provider]);

  const createSubAccount = async () => {
    if (!provider) {
      setStatus("Provider not initialized");
      return;
    }

    setLoadingTombSecret(true);
    setStatus("Creating Sub Account...");

    try {
      const newSubAccount = (await provider.request({
        method: "wallet_addSubAccount",
        params: [
          {
            account: {
              type: "create",
            },
          },
        ],
      })) as WalletAddSubAccountResponse;

      setSubAccount(newSubAccount);
      setStatus("Sub Account created successfully!");
    } catch (error) {
      console.error("Sub Account creation failed:", error);
      setStatus("Sub Account creation failed");
    } finally {
      setLoadingTombSecret(false);
    }
  };

  const connectWallet = async () => {
    if (!provider) {
      setStatus("Provider not initialized");
      return;
    }

    setLoadingTombSecret(true);
    setStatus("Connecting wallet...");

    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
        params: [],
      })) as string[];

      const universalAddr = accounts[0];
      setUniversalAddress(universalAddr);
      setConnected(true);

      const response = (await provider.request({
        method: "wallet_getSubAccounts",
        params: [{ account: universalAddr, domain: window.location.origin }],
      })) as GetSubAccountsResponse;

      const existing = response.subAccounts[0];
      if (existing) {
        setSubAccount(existing);
        setStatus("Connected! Existing Sub Account found");
      } else {
        createSubAccount();
        setStatus("Connected! No existing Sub Account found");
      }
    } catch (error) {
      console.error("Connection failed:", error);
      setStatus("Connection failed");
    } finally {
      setLoadingTombSecret(false);
    }
  };

  const sendCalls = useCallback(
    async (
      calls: Array<{ to: string; data: string; value: string }>,
      from: string,
      setLoadingState: (loading: boolean) => void
    ) => {
      if (!provider) {
        setStatus("Provider not available");
        return;
      }

      setLoadingState(true);
      setStatus("Sending calls...");
      console.log("Sending calls...", calls, from);

      try {
        const callsId = (await provider.request({
          method: "wallet_sendCalls",
          params: [
            {
              version: "2.0",
              atomicRequired: true,
              chainId: `0x${baseSepolia.id.toString(16)}`,
              from,
              calls,
            },
          ],
        })) as string;
        console.log(callsId);

        setStatus(`Calls sent! Calls ID: ${callsId}`);
        return callsId;
      } catch (error) {
        console.error("Send calls failed:", error);
        setStatus("Send calls failed");
      } finally {
        setLoadingState(false);
      }
    },
    [provider]
  );

  async function getRoom(roomId: number): Promise<RoomMetadata> {
    if (!provider) {
      console.warn("Provider not available yet, waiting...");
      // Wait for provider to be available
      return new Promise((resolve, reject) => {
        const checkProvider = () => {
          if (provider) {
            getRoomWithProvider(roomId).then(resolve).catch(reject);
          } else {
            setTimeout(checkProvider, 100);
          }
        };
        checkProvider();
      });
    }

    return getRoomWithProvider(roomId);
  }

  async function getRoomWithProvider(roomId: number): Promise<RoomMetadata> {
    if (!provider) {
      throw new Error("Provider not available");
    }

    try {
      console.log(roomId);
      const iface = new Interface(ABI);
      const data = iface.encodeFunctionData("getRoom", [roomId]);

      const result = await provider.request({
        method: "eth_call",
        params: [{ to: contractAddress, data }, "latest"],
      });

      const decoded = iface.decodeFunctionResult(
        "getRoom",
        result as BytesLike
      );

      // Convert the decoded result to RoomMetadata format
      const roomData: RoomMetadata = {
        creator: decoded[0],
        opponent: decoded[1],
        wager: formatEther(decoded[2]),
        phase: Number(decoded[3]) as RoomPhase,
        turnCount: Number(decoded[4]),
        encryptedWinner: decoded[5],
        createdAt: Number(decoded[6]) * 1000,
        lastActiveAt: Number(decoded[7]) * 1000,
        winner: decoded[5] || undefined,
      };

      return roomData;
    } catch (error) {
      console.error("Error fetching room:", error);
      throw error;
    }
  }

  const createRoom = useCallback(
    async (vaultCode: number[], wager: string) => {
      if (!subAccount || !contract || !isProviderReady) {
        setStatus("Sub account, contract, or provider not ready");
        return;
      }

      try {
        setIsLoading(true);
        setStatus("Creating room...");

        // Encode the function call data
        const data = contract.interface.encodeFunctionData("createRoom", [
          vaultCode,
        ]);

        // Send transaction using provider
        const txHash = await provider.request({
          method: "eth_sendTransaction",
          params: [
            {
              to: contractAddress,
              data,
              value: `0x${parseEther(wager).toString(16)}`,
              from: subAccount.address,
            },
          ],
        });

        setStatus("Transaction submitted, waiting for confirmation...");

        // Wait for transaction receipt
        let receipt;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout

        while (attempts < maxAttempts) {
          receipt = await provider.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          });

          if (receipt) break;

          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }

        if (!receipt) {
          throw new Error("Transaction receipt not found after timeout");
        }

        console.log("Transaction receipt:", receipt);

        // Parse RoomCreated event from logs
        const roomCreatedEvent = (receipt as TransactionReceipt)?.logs?.find(
          (log) => {
            try {
              const parsedLog = contract.interface.parseLog(log);
              return parsedLog?.name === "RoomCreated";
            } catch {
              return false;
            }
          }
        );

        if (roomCreatedEvent) {
          const parsedEvent = contract.interface.parseLog(roomCreatedEvent);
          const roomId = parsedEvent?.args.roomId.toString();
          const creator = parsedEvent?.args.creator;
          const wagerAmount = parsedEvent?.args.wager.toString();
          const token = parsedEvent?.args.token;

          console.log("RoomCreated event:", {
            roomId,
            creator,
            wagerAmount,
            token,
          });

          setStatus(`Room created successfully! Room ID: ${roomId}`);
          return roomId;
        } else {
          setStatus("Room created but event not found");
          return null;
        }
      } catch (error) {
        console.error("Error creating room:", error);
        setStatus("Failed to create room");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, subAccount, provider, isProviderReady]
  );

  const joinRoom = useCallback(
    async (roomId: string, vaultCode: number[], wager: string) => {
      if (!subAccount || !contract || !isProviderReady) {
        setStatus("Sub account, contract, or provider not ready");
        return;
      }

      try {
        setIsLoading(true);
        setStatus("Joining room...");
        setStatus("Submitting transaction...");

        // Encode the function call data
        const data = contract.interface.encodeFunctionData("joinRoom", [
          BigInt(roomId),
          vaultCode,
        ]);

        // Send transaction using provider
        const txHash = await provider.request({
          method: "eth_sendTransaction",
          params: [
            {
              to: contractAddress,
              data,
              value: `0x${parseEther(wager).toString(16)}`,
              from: subAccount.address,
            },
          ],
        });

        setStatus("Transaction submitted, waiting for confirmation...");

        // Wait for transaction receipt
        let receipt;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout

        while (attempts < maxAttempts) {
          receipt = await provider.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          });

          if (receipt) break;

          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }

        if (!receipt) {
          throw new Error("Transaction receipt not found after timeout");
        }

        console.log("Transaction receipt:", receipt);

        // Parse RoomJoined event from logs
        const roomJoinedEvent = (receipt as TransactionReceipt)?.logs?.find(
          (log) => {
            try {
              const parsedLog = contract.interface.parseLog(log);
              return parsedLog?.name === "RoomJoined";
            } catch {
              return false;
            }
          }
        );

        if (roomJoinedEvent) {
          const parsedEvent = contract.interface.parseLog(roomJoinedEvent);
          const joinedRoomId = parsedEvent?.args.roomId.toString();
          const opponent = parsedEvent?.args.opponent;

          console.log("RoomJoined event:", {
            roomId: joinedRoomId,
            opponent,
          });

          setStatus(`Joined room successfully! Room ID: ${joinedRoomId}`);
          return joinedRoomId;
        } else {
          setStatus("Room joined but event not found");
          return null;
        }
      } catch (error) {
        console.error("Error joining room:", error);
        setStatus("Failed to join room");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, subAccount, provider, isProviderReady]
  );

  const submitGuess = useCallback(
    async (roomId: string, guess: number[]): Promise<string> => {
      if (!subAccount || !contract || !isProviderReady) {
        setStatus("Sub account, contract, or provider not ready");
        throw new Error("Sub account, contract, or provider not ready");
      }

      try {
        setIsLoading(true);
        setStatus("Submitting guess...");

        // Encode the function call data
        const data = contract.interface.encodeFunctionData("submitGuess", [
          BigInt(roomId),
          guess,
        ]);

        // Send transaction using provider
        const txHash = (await provider.request({
          method: "eth_sendTransaction",
          params: [
            {
              to: contractAddress,
              data,
              value: "0x0",
              from: subAccount.address,
            },
          ],
        })) as string;

        setStatus("Guess submitted, waiting for confirmation...");

        // Wait for transaction receipt
        let receipt;
        let attempts = 0;
        const maxAttempts = 30;

        while (attempts < maxAttempts) {
          receipt = await provider.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          });

          if (receipt) break;

          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }

        if (!receipt) {
          throw new Error("Transaction receipt not found after timeout");
        }

        console.log("Guess submitted:", receipt);
        setStatus("Guess submitted successfully!");
        return txHash;
      } catch (error) {
        console.error("Error submitting guess:", error);
        setStatus("Failed to submit guess");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, subAccount, provider, isProviderReady]
  );

  const sendCallsFromUniversal = useCallback(async () => {
    if (!universalAddress) {
      setStatus("Universal account not available");
      return;
    }

    const calls = [
      {
        to: "0x4bbfd120d9f352a0bed7a014bd67913a2007a878",
        data: "0x9846cd9e",
        value: "0x0",
      },
    ];

    await sendCalls(calls, universalAddress, setLoadingUniversal);
  }, [sendCalls, universalAddress]);

  const disconnectWallet = useCallback(() => {
    // Reset all wallet-related states
    setSubAccount(null);
    setUniversalAddress("");
    setConnected(false);
    setIsLoading(false);
    setLoadingTombSecret(false);
    setLoadingUniversal(false);
    setStatus("Disconnected");
    setPlayerWins(0);
    setBalance("0");
    setIsLoadingBalance(false);
  }, []);

  return (
    <TombSecretContext.Provider
      value={{
        provider,
        contract,
        subAccount,
        universalAddress,
        connected,
        isLoading,
        loadingUniversal,
        status,
        isProviderReady,
        playerWins,
        balance,
        isLoadingBalance,
        connectWallet,
        createSubAccount,
        getRoom,
        setIsLoading,
        createRoom,
        joinRoom,
        submitGuess,
        sendCallsFromUniversal,
        disconnectWallet,
      }}
    >
      {children}
    </TombSecretContext.Provider>
  );
};
