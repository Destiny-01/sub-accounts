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
  JsonRpcProvider,
} from "ethers";
import { ABI } from "@/lib/abi";
import { formatEther } from "ethers";
import { RoomPhase, Guess } from "@/types/game";
import { eventHandler } from "@/services/eventHandler";

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

  // Room state management
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomMetadata | null>(null);
  const [roomGuesses, setRoomGuesses] = useState<Guess[]>([]);
  const [isListeningToEvents, setIsListeningToEvents] = useState(false);

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
        // We'll connect it to a provider for events when needed
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

  const getRoomWithProvider = useCallback(
    async (roomId: number): Promise<RoomMetadata> => {
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
    },
    [provider]
  );

  const getRoom = useCallback(
    async (roomId: number): Promise<RoomMetadata> => {
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
    },
    [provider, getRoomWithProvider]
  );

  const loadRoomData = useCallback(
    async (roomId: number) => {
      try {
        const data = await getRoom(roomId);
        setRoomData(data);
        return data;
      } catch (error) {
        console.error("Failed to load room data:", error);
        setRoomData(null);
        throw error;
      }
    },
    [getRoom]
  );

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
        setStatus("Submitting probe...");

        // Encode the function call data using the correct function name
        const data = contract.interface.encodeFunctionData("submitProbe", [
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

        setStatus("Probe submitted, waiting for confirmation...");

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

        console.log("Probe submitted:", receipt);

        // Parse ProbeSubmitted event from logs
        const probeSubmittedEvent = (receipt as TransactionReceipt)?.logs?.find(
          (log) => {
            try {
              const parsedLog = contract.interface.parseLog(log);
              return parsedLog?.name === "ProbeSubmitted";
            } catch {
              return false;
            }
          }
        );

        if (probeSubmittedEvent) {
          const parsedEvent = contract.interface.parseLog(probeSubmittedEvent);
          const submittedRoomId = parsedEvent?.args.roomId.toString();
          const turnIndex = parsedEvent?.args.turnIndex.toString();
          const submitter = parsedEvent?.args.submitter;

          console.log("ProbeSubmitted event:", {
            roomId: submittedRoomId,
            turnIndex,
            submitter,
          });

          setStatus("Probe submitted successfully!");
          return txHash;
        } else {
          setStatus("Probe submitted but event not found");
          return txHash;
        }
      } catch (error) {
        console.error("Error submitting probe:", error);
        setStatus("Failed to submit probe");
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

  // Event handling functions
  const handleRoomJoined = useCallback(
    (event: { roomId: string }) => {
      console.log("Room joined event:", event, currentRoomId);
      if (event.roomId === currentRoomId?.toString()) {
        setStatus("Opponent joined! Game starting...");
        // Load updated room data when opponent joins
        loadRoomData(parseInt(event.roomId));
      }
    },
    [currentRoomId, loadRoomData]
  );

  const handleResultComputed = useCallback(
    async (event: {
      roomId: string;
      turnIndex: number;
      submitter: string;
      signedResult?: { breaches: number; signals: number };
    }) => {
      console.log("Result computed event:", event, currentRoomId);
      if (event.roomId === currentRoomId?.toString()) {
        const isPlayerResult =
          event.submitter.toLowerCase() === subAccount?.address.toLowerCase();

        // Fetch the actual probe data from the contract
        try {
          const iface = new Interface(ABI);
          const data = iface.encodeFunctionData("getProbe", [
            BigInt(event.roomId),
            BigInt(event.turnIndex),
          ]);

          const result = await provider!.request({
            method: "eth_call",
            params: [{ to: contractAddress, data }, "latest"],
          });

          const decoded = iface.decodeFunctionResult(
            "getProbe",
            result as BytesLike
          );
          const actualGuess = decoded[1]; // The guess array (uint8[4])
          const guessDigits = actualGuess.map((digit: number) =>
            digit.toString()
          );

          setRoomGuesses((prev) => {
            console.log("ResultComputed: Current guesses:", prev);
            console.log(
              "ResultComputed: Looking for turnIndex:",
              event.turnIndex
            );
            console.log("ResultComputed: Fetched guess digits:", guessDigits);

            const existingGuess = prev.find(
              (guess) => guess.turnIndex === event.turnIndex
            );
            console.log("ResultComputed: Found existing guess:", existingGuess);

            if (existingGuess) {
              // Update existing guess with result and actual digits
              return prev.map((guess) =>
                guess.turnIndex === event.turnIndex
                  ? {
                      ...guess,
                      digits: guessDigits,
                      result: event.signedResult
                        ? {
                            breached: event.signedResult.breaches,
                            injured: event.signedResult.signals,
                          }
                        : undefined,
                      pending: false,
                    }
                  : guess
              );
            } else {
              // Create new guess with result and actual digits
              console.log(
                "ResultComputed: Creating new guess for turnIndex:",
                event.turnIndex
              );
              const newGuess: Guess = {
                turnIndex: event.turnIndex,
                digits: guessDigits,
                timestamp: Date.now(),
                pending: false,
                result: event.signedResult
                  ? {
                      breached: event.signedResult.breaches,
                      injured: event.signedResult.signals,
                    }
                  : undefined,
              };

              return [...prev, newGuess];
            }
          });
        } catch (error) {
          console.error("Failed to fetch probe data:", error);
          // Fallback to the old behavior if fetching fails
          setRoomGuesses((prev) => {
            const existingGuess = prev.find(
              (guess) => guess.turnIndex === event.turnIndex
            );

            if (existingGuess) {
              return prev.map((guess) =>
                guess.turnIndex === event.turnIndex
                  ? {
                      ...guess,
                      result: event.signedResult
                        ? {
                            breached: event.signedResult.breaches,
                            injured: event.signedResult.signals,
                          }
                        : undefined,
                      pending: false,
                    }
                  : guess
              );
            } else {
              const newGuess: Guess = {
                turnIndex: event.turnIndex,
                digits: [],
                timestamp: Date.now(),
                pending: false,
                result: event.signedResult
                  ? {
                      breached: event.signedResult.breaches,
                      injured: event.signedResult.signals,
                    }
                  : undefined,
              };

              return [...prev, newGuess];
            }
          });
        }

        if (isPlayerResult) {
          setStatus("Your probe result computed!");
        } else {
          setStatus("Opponent's probe result computed!");
        }

        // Refresh room data to get updated turn count and phase
        if (currentRoomId) {
          loadRoomData(parseInt(currentRoomId));
        }
      }
    },
    [currentRoomId, subAccount?.address, loadRoomData, provider]
  );

  const handleWinnerDecrypted = useCallback(
    (event: { roomId: string; winner: string }) => {
      console.log("Winner decrypted event:", event);
      if (event.roomId === currentRoomId.toString()) {
        setStatus(`Winner: ${event.winner}`);
        // Refresh room data to get final state
        if (currentRoomId) {
          getRoom(parseInt(currentRoomId));
        }
      }
    },
    [currentRoomId, getRoom]
  );

  const handleGameFinished = useCallback(
    (event: { roomId: string; winner: string; amount: string }) => {
      console.log("Game finished event:", event, currentRoomId);
      if (event.roomId === currentRoomId.toString()) {
        setStatus(
          `Game finished! Winner: ${event.winner}, Amount: ${event.amount}`
        );
        // Refresh room data to get final state
        if (currentRoomId) {
          getRoom(parseInt(currentRoomId));
        }
      }
    },
    [currentRoomId, getRoom]
  );

  // Initialize event listeners when contract is ready
  useEffect(() => {
    if (contract && isProviderReady && !isListeningToEvents) {
      console.log("Initializing event listeners...");

      // Create a contract instance with a provider that supports event subscription
      // We'll use a JsonRpcProvider connected to the Base Sepolia RPC
      const eventProvider = new JsonRpcProvider("https://sepolia.base.org");
      const contractWithProvider = new Contract(
        contractAddress!,
        ABI,
        eventProvider
      );

      eventHandler.initialize(contractWithProvider, {
        onRoomJoined: handleRoomJoined,
        onResultComputed: handleResultComputed,
        onWinnerDecrypted: handleWinnerDecrypted,
        onGameFinished: handleGameFinished,
      });

      setIsListeningToEvents(true);
    }

    return () => {
      if (isListeningToEvents) {
        eventHandler.stopListening();
        setIsListeningToEvents(false);
      }
    };
  }, [
    contract,
    isProviderReady,
    isListeningToEvents,
    handleRoomJoined,
    handleResultComputed,
    handleWinnerDecrypted,
    handleGameFinished,
  ]);

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

    // Reset room state
    setCurrentRoomId(null);
    setRoomGuesses([]);
    if (isListeningToEvents) {
      eventHandler.stopListening();
      setIsListeningToEvents(false);
    }
  }, [isListeningToEvents]);

  // Room state management functions
  const setCurrentRoom = useCallback((roomId: string | null) => {
    setCurrentRoomId(roomId);
    if (!roomId) {
      setRoomGuesses([]);
    }
  }, []);

  const addGuess = useCallback((guess: Guess) => {
    console.log("addGuess: Adding guess:", guess);
    setRoomGuesses((prev) => {
      console.log("addGuess: Current guesses before:", prev);
      const existing = prev.find((g) => g.turnIndex === guess.turnIndex);
      if (existing) {
        console.log("addGuess: Updating existing guess");
        return prev.map((g) =>
          g.turnIndex === guess.turnIndex ? { ...g, ...guess } : g
        );
      }
      console.log("addGuess: Adding new guess");
      return [...prev, guess];
    });
  }, []);

  const removeGuess = useCallback((turnIndex: number) => {
    setRoomGuesses((prev) => prev.filter((g) => g.turnIndex !== turnIndex));
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
        currentRoomId,
        roomData,
        roomGuesses,
        isListeningToEvents,
        loadRoomData,
        connectWallet,
        createSubAccount,
        getRoom,
        setIsLoading,
        createRoom,
        joinRoom,
        submitGuess,
        sendCallsFromUniversal,
        disconnectWallet,
        setCurrentRoom,
        addGuess,
        removeGuess,
      }}
    >
      {children}
    </TombSecretContext.Provider>
  );
};
