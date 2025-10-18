/**
 * Event Handler Service - Centralized Contract Event Router
 *
 * This service listens to all Vault Wars contract events and routes them
 * to appropriate UI updates and state changes.
 */

import { Contract, EventLog, Log } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Event type definitions
export interface ContractEvent {
  roomId: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface RoomCreatedEvent extends ContractEvent {
  creator: string;
  wager: string;
  token: string;
}

export interface RoomJoinedEvent extends ContractEvent {
  opponent: string;
}

export interface VaultSubmittedEvent extends ContractEvent {
  who: string;
}

export interface ResultComputedEvent extends ContractEvent {
  turnIndex: number;
  submitter: string;
  isWin: boolean; // This might be encrypted
  signedResult?: {
    breaches: number;
    signals: number;
    signature: string;
  };
}

export interface DecryptionRequestedEvent extends ContractEvent {
  requestId: string;
}

export interface WinnerDecryptedEvent extends ContractEvent {
  winner: string;
  signature?: string;
}

export interface GameFinishedEvent extends ContractEvent {
  winner: string;
  amount: string;
}

export interface RoomCancelledEvent extends ContractEvent {
  by: string;
}

// Event handler callbacks
export type EventHandlers = {
  onRoomCreated?: (event: RoomCreatedEvent) => void;
  onRoomJoined?: (event: RoomJoinedEvent) => void;
  onVaultSubmitted?: (event: VaultSubmittedEvent) => void;
  onResultComputed?: (event: ResultComputedEvent) => void;
  onDecryptionRequested?: (event: DecryptionRequestedEvent) => void;
  onWinnerDecrypted?: (event: WinnerDecryptedEvent) => void;
  onGameFinished?: (event: GameFinishedEvent) => void;
  onRoomCancelled?: (event: RoomCancelledEvent) => void;
};

class VaultWarsEventHandler {
  private contract: Contract | null = null;
  private handlers: EventHandlers = {};
  public isListening = false;
  private pollInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize event handling with contract instance
   */
  initialize(contract: Contract, handlers: EventHandlers = {}) {
    this.contract = contract;
    this.handlers = handlers;
    this.startListening();
  }

  /**
   * Update event handlers
   */
  updateHandlers(handlers: Partial<EventHandlers>) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Start listening to all contract events using polling instead of filters
   */
  private startListening() {
    if (!this.contract || this.isListening) return;

    console.log("[EventHandler] Starting to listen for contract events");
    this.isListening = true;

    // Use polling instead of filters to avoid filter management issues
    this.startPolling();
  }

  /**
   * Start polling for events instead of using filters
   */
  private startPolling() {
    if (!this.contract || !this.isListening) return;

    // Poll every 2 seconds for new events
    const pollInterval = setInterval(async () => {
      if (!this.isListening) {
        clearInterval(pollInterval);
        return;
      }

      try {
        await this.checkForNewEvents();
      } catch (error) {
        console.warn("[EventHandler] Error polling for events:", error);
      }
    }, 2000);

    // Store the interval ID for cleanup
    this.pollInterval = pollInterval;
  }

  /**
   * Check for new events by querying recent blocks
   */
  private async checkForNewEvents() {
    if (!this.contract) return;

    try {
      // Get the latest block number
      const latestBlock =
        await this.contract.runner!.provider!.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 10); // Check last 10 blocks

      // Query all events from recent blocks
      const allEvents = await this.contract.queryFilter(
        "*",
        fromBlock,
        latestBlock
      );

      for (const event of allEvents) {
        await this.processEvent(event as EventLog | Log);
      }
    } catch (error) {
      console.warn("[EventHandler] Error checking for events:", error);
    }
  }

  /**
   * Process a single event and route to appropriate handler
   */
  private async processEvent(event: EventLog | Log) {
    // Only process EventLog events (not raw Log events)
    if (!event || !("eventName" in event) || !event.eventName) return;

    const eventName = event.eventName;
    const args = event.args;

    try {
      switch (eventName) {
        case "RoomCreated": {
          const roomCreatedData: RoomCreatedEvent = {
            roomId: String(args.roomId),
            creator: String(args.creator),
            wager: String(args.wager),
            token: String(args.token),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] RoomCreated:", roomCreatedData);
          this.handlers.onRoomCreated?.(roomCreatedData);
          break;
        }

        case "RoomJoined": {
          const roomJoinedData: RoomJoinedEvent = {
            roomId: String(args.roomId),
            opponent: String(args.opponent),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] RoomJoined:", roomJoinedData);
          this.handlers.onRoomJoined?.(roomJoinedData);
          break;
        }

        case "VaultSubmitted": {
          const vaultSubmittedData: VaultSubmittedEvent = {
            roomId: String(args.roomId),
            who: String(args.who),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] VaultSubmitted:", vaultSubmittedData);
          this.handlers.onVaultSubmitted?.(vaultSubmittedData);
          break;
        }

        case "ResultComputed": {
          const resultComputedData: ResultComputedEvent = {
            roomId: String(args.roomId),
            turnIndex: Number(args.turnIndex),
            submitter: String(args.submitter),
            isWin: Boolean(args.isWin),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };

          // Extract breaches and signals directly from the updated ABI
          if (args.breaches !== undefined && args.signals !== undefined) {
            resultComputedData.signedResult = {
              breaches: Number(args.breaches),
              signals: Number(args.signals),
              signature: "", // Not provided in the updated ABI
            };
          }

          console.log("[EventHandler] ResultComputed:", resultComputedData);
          this.handlers.onResultComputed?.(resultComputedData);
          break;
        }

        case "DecryptionRequested": {
          const decryptionRequestedData: DecryptionRequestedEvent = {
            roomId: String(args.roomId),
            requestId: String(args.requestId),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log(
            "[EventHandler] DecryptionRequested:",
            decryptionRequestedData
          );
          this.handlers.onDecryptionRequested?.(decryptionRequestedData);
          break;
        }

        case "WinnerDecrypted": {
          const winnerDecryptedData: WinnerDecryptedEvent = {
            roomId: String(args.roomId),
            winner: String(args.winner),
            signature: String(args.signature || ""),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] WinnerDecrypted:", winnerDecryptedData);
          this.handlers.onWinnerDecrypted?.(winnerDecryptedData);
          break;
        }

        case "GameFinished": {
          const gameFinishedData: GameFinishedEvent = {
            roomId: String(args.roomId),
            winner: String(args.winner),
            amount: String(args.amount),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] GameFinished:", gameFinishedData);
          this.handlers.onGameFinished?.(gameFinishedData);
          break;
        }

        case "RoomCancelled": {
          const roomCancelledData: RoomCancelledEvent = {
            roomId: String(args.roomId),
            by: String(args.by),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] RoomCancelled:", roomCancelledData);
          this.handlers.onRoomCancelled?.(roomCancelledData);
          break;
        }
      }
    } catch (error) {
      console.warn(
        `[EventHandler] Error processing ${eventName} event:`,
        error
      );
    }
  }

  /**
   * Stop listening to contract events
   */
  stopListening() {
    if (!this.isListening) return;

    console.log("[EventHandler] Stopping contract event listeners");

    // Clear the polling interval
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.isListening = false;
  }

  /**
   * Get historical events for a room
   */
  async getHistoricalEvents(roomId: string, fromBlock = 0) {
    if (!this.contract) return [];

    try {
      const filter = this.contract.filters.ResultComputed(roomId);
      const events = await this.contract.queryFilter(filter, fromBlock);
      return events;
    } catch (error) {
      console.error("[EventHandler] Failed to fetch historical events:", error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopListening();
    this.contract = null;
    this.handlers = {};
  }
}

// Singleton instance
export const eventHandler = new VaultWarsEventHandler();

// React hook for using event handler in components
export function useContractEvents(handlers: EventHandlers) {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Enhance handlers with common UI patterns
  const enhancedHandlers: EventHandlers = {
    onRoomCreated: (event) => {
      toast({
        title: "⚡ Room Created",
        description: `Room ${event.roomId} created successfully!`,
      });
      handlers.onRoomCreated?.(event);
    },

    onRoomJoined: (event) => {
      toast({
        title: "🎯 Battle Begins",
        description: "Opponent joined! The vault war has started.",
      });
      handlers.onRoomJoined?.(event);
    },

    onResultComputed: (event) => {
      if (handlers.onResultComputed) {
        handlers.onResultComputed(event);
      } else {
        toast({
          title: "📊 Result Computed",
          description: `Probe #${event.turnIndex + 1} analyzed by FHE network.`,
        });
      }
    },

    onWinnerDecrypted: (event) => {
      toast({
        title: "🏆 Winner Revealed",
        description: "The vault has been breached! Revealing winner...",
      });
      handlers.onWinnerDecrypted?.(event);
    },

    onGameFinished: (event) => {
      toast({
        title: "🎉 Game Complete",
        description: `Payout of ${event.amount} ETH processed!`,
      });
      handlers.onGameFinished?.(event);
      // Auto-redirect after game completion
      setTimeout(() => navigate("/"), 3000);
    },

    onRoomCancelled: (event) => {
      toast({
        title: "❌ Room Cancelled",
        description: "The game room has been cancelled.",
        variant: "destructive",
      });
      handlers.onRoomCancelled?.(event);
      navigate("/");
    },

    // Pass through other handlers as-is
    onVaultSubmitted: handlers.onVaultSubmitted,
    onDecryptionRequested: handlers.onDecryptionRequested,
  };

  return enhancedHandlers;
}
