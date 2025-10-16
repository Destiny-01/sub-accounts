import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Zap, Target, Signal, Shield, Eye, Scroll } from "lucide-react";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed?: () => void;
  showProceedButton?: boolean;
}

export function HowToPlayModal({ isOpen, onClose, onProceed, showProceedButton = false }: HowToPlayModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-sm border-2 border-double egyptian-border border-primary/40 shadow-2xl shadow-primary/20">
        <DialogHeader className="relative">
          <DialogTitle className="text-3xl font-bold text-center font-egyptian tracking-wider text-primary mb-6 animate-fade-in">
            <Scroll className="inline-block w-8 h-8 text-yellow-400 mr-2 animate-pulse" />
            The Sacred Challenge
            <Scroll className="inline-block w-8 h-8 text-yellow-400 ml-2 animate-pulse" />
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-card/80 hover:bg-primary/20 border border-primary/30"
          >
            <X className="w-4 h-4 text-primary" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
          {/* Objective */}
          <div className="egyptian-border rounded-lg p-4 bg-primary/5 border-primary/20 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary font-egyptian">THE QUEST</h3>
            </div>
            <p className="text-sm text-muted-foreground font-serif leading-relaxed">
              You and your rival each seal a <span className="text-primary font-egyptian">4-digit sacred code</span>.
              Your quest: <span className="text-accent font-bold">decipher their tomb</span> before they unlock yours.
            </p>
          </div>

          {/* Turns */}
          <div className="egyptian-border rounded-lg p-4 bg-primary/5 border-primary/20 animate-fade-in delay-100">
            <div className="flex items-center gap-2 mb-3">
              <Signal className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-accent font-egyptian">EXCAVATION TURNS</h3>
            </div>
            <p className="text-sm text-muted-foreground font-serif leading-relaxed">
              Raiders take turns <span className="text-accent font-egyptian">excavating</span> (guessing a 4-digit code).
              After each dig, you'll receive <span className="text-primary font-bold">ancient hieroglyphic clues</span>.
            </p>
          </div>

          {/* Feedback Signals */}
          <div className="egyptian-border rounded-lg p-4 bg-primary/5 border-primary/20 animate-fade-in delay-200">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-yellow-400 font-egyptian">HIEROGLYPHIC CLUES</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400 shadow-green-500/20 shadow-sm font-mono text-xs font-bold">
                  B
                </span>
                <div>
                  <span className="text-green-400 font-semibold">Breached</span>
                  <span className="text-muted-foreground text-sm ml-2">→ Correct number, correct position</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 shadow-yellow-500/20 shadow-sm font-mono text-xs font-bold">
                  S
                </span>
                <div>
                  <span className="text-yellow-400 font-semibold">Signal Detected</span>
                  <span className="text-muted-foreground text-sm ml-2">→ Correct number, wrong position</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded bg-gray-500/20 border border-gray-500/30 text-gray-400 shadow-gray-500/20 shadow-sm font-mono text-xs font-bold">
                  E
                </span>
                <div>
                  <span className="text-gray-400 font-semibold">Encrypted</span>
                  <span className="text-muted-foreground text-sm ml-2">→ Number not in the vault code</span>
                </div>
              </div>
            </div>
          </div>

          {/* Winning */}
          <div className="egyptian-border rounded-lg p-4 bg-green-500/10 border-green-500/20 animate-fade-in delay-300">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-green-400 font-egyptian">CLAIMING VICTORY</h3>
            </div>
            <p className="text-sm text-muted-foreground font-serif leading-relaxed">
              Continue excavating until you uncover all <span className="text-green-400 font-egyptian">4 sacred digits</span>.
              The first to decipher the complete code <span className="text-green-400 font-bold">claims pharaoh's gold</span>.
            </p>
          </div>

          {/* Tips */}
          <div className="egyptian-border rounded-lg p-4 bg-accent/10 border-accent/20 animate-fade-in delay-400">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-accent font-egyptian">ANCIENT WISDOM</h3>
            </div>
            <ul className="text-sm text-muted-foreground font-serif space-y-1">
              <li>• Study the hieroglyphic clues to guide your next excavation</li>
              <li>• Watch your rival's attempts to gauge their progress</li>
              <li>• Remember: all 4 digits must be unique in your sacred code</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 justify-center pt-4 border-t border-primary/20">
          {showProceedButton && onProceed ? (
            <Button
              onClick={onProceed}
              className="min-w-40 egyptian-border bg-primary hover:bg-primary/90 shadow-primary/30 shadow-lg font-egyptian tracking-wider animate-pulse"
            >
              Begin the Quest!
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={onClose}
            className="min-w-32 egyptian-border border-primary/30 hover:bg-primary/10 font-serif"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}