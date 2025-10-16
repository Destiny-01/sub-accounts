import { Button } from "@/components/ui/button";
import { PapyrusCard } from "@/components/ui/papyrus-card";
import HieroglyphBackground from "@/components/HieroglyphBackground";
import TombIcon from "@/components/TombIcon";
import { Navbar } from "@/components/layout/Navbar";
import { useNavigate } from "react-router-dom";
import tombHeroImage from "@/assets/tomb-hero.jpg";
import { Shield, Zap, Eye, Github } from "lucide-react";


export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen desert-bg relative">
      <Navbar />
      <HieroglyphBackground />
      
      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Title */}
          <div className="mb-8 animate-fade-in">
            <h1 
              className="text-6xl md:text-8xl font-egyptian font-bold text-hieroglyph mb-4"
              data-text="TOMB RAIDERS"
            >
              TOMB RAIDERS
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-primary via-accent to-emerald mx-auto rounded-full animate-pulse glow-primary" />
          </div>

          {/* Hero Image */}
          <div className="mb-8 animate-fade-in delay-300">
            <div className="relative max-w-4xl mx-auto">
              <img 
                src={tombHeroImage} 
                alt="Ancient Egyptian Tomb Entrance"
                className="w-full h-auto rounded-xl border-2 border-double border-primary/30 glow-primary"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-xl" />
            </div>
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-foreground/80 mb-12 font-serif animate-fade-in delay-500">
            Duel for ancient treasures. Decipher sacred codes. Claim pharaoh's gold.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in delay-700">
            <Button
              onClick={() => navigate("/create-room")}
              size="lg"
              className="btn-egyptian-primary w-full sm:w-auto min-w-48"
            >
              <Shield className="w-5 h-5" />
              Begin Your Quest
            </Button>
            
            <Button
              onClick={() => navigate("/join-room")}
              variant="outline"
              size="lg"
              className="btn-egyptian-accent w-full sm:w-auto min-w-48"
            >
              <Zap className="w-5 h-5" />
              Join the Expedition
            </Button>
          </div>

          {/* Tomb Icons Demo */}
          <div className="flex justify-center items-center gap-8 mb-16 animate-fade-in delay-1000">
            <TombIcon />
            <div className="text-accent text-2xl animate-pulse font-egyptian">VS</div>
            <TombIcon />
          </div>

          {/* How it Works Section */}
          <section id="how-it-works" className="max-w-4xl mx-auto mb-16 animate-fade-in delay-1200">
            <h2 className="text-3xl font-egyptian font-bold text-primary mb-8 text-glow">
              The Sacred Challenge
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <PapyrusCard className="text-center p-6 hover-scale">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-lg flex items-center justify-center egyptian-border glow-primary">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-egyptian font-semibold text-primary mb-2">Seal Your Tomb</h3>
                <p className="text-muted-foreground">Choose your 4-digit sacred code and wager your gold</p>
              </PapyrusCard>
              
              <PapyrusCard className="text-center p-6 hover-scale">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-lg flex items-center justify-center egyptian-border glow-accent">
                  <Zap className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-egyptian font-semibold text-accent mb-2">Excavation Duel</h3>
                <p className="text-muted-foreground">Take turns deciphering each other's ancient seals</p>
              </PapyrusCard>
              
              <PapyrusCard className="text-center p-6 hover-scale">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald/20 rounded-lg flex items-center justify-center egyptian-border glow-success">
                  <Eye className="w-8 h-8 text-emerald" />
                </div>
                <h3 className="text-lg font-egyptian font-semibold text-emerald mb-2">Unlock & Triumph</h3>
                <p className="text-muted-foreground">First to reveal the secrets claims pharaoh's treasure</p>
              </PapyrusCard>
            </div>
          </section>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t-2 border-double border-primary/20 bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground font-serif">
                Ancient Blockchain Mystery
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#how-it-works" className="text-sm text-primary hover:text-accent transition-colors story-link font-serif">
                The Sacred Challenge
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors story-link font-serif"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t-2 border-double border-primary/10 text-center">
            <p className="text-xs text-muted-foreground font-serif">
              © 2024 Tomb Raiders. Uncover the mysteries of the ancients.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}