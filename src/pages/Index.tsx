import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, Users, Shield, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/providers/WalletProvider";
import { toast } from "sonner";
import { useGameState } from "@/hooks/useBattleRoyaleState";

const Index = () => {
  const navigate = useNavigate();
  const { address, connect, isConnecting } = useWallet();
  const { data: gameState } = useGameState();

  const walletConnected = Boolean(address);

  const handleConnectWallet = async () => {
    try {
      await connect();
      toast.success("Wallet connected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect wallet");
    }
  };

  const handleEnterLobby = () => {
    navigate("/lobby");
  };

  const shortenAddress = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scan-line w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">CipherGrid Royale</h1>
          </div>
          <Button 
            onClick={walletConnected ? undefined : handleConnectWallet}
            variant={walletConnected ? "outline" : "default"}
            className="glow-border"
            disabled={isConnecting}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {walletConnected ? shortenAddress(address || "") : isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center mb-16 space-y-6">
          <h2 className="text-6xl font-bold bg-gradient-cyber bg-clip-text text-transparent">
            Battle in the Encrypted Grid
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enter a 10×10 battlefield where your position is encrypted using FHE technology. 
            Survive the shrinking safe zone and be the last player standing.
          </p>
          
          {walletConnected ? (
            <Button 
              size="lg" 
              onClick={handleEnterLobby}
              className="text-lg px-8 py-6 pulse-glow"
            >
              Enter Game Lobby
            </Button>
          ) : (
            <Button 
              size="lg" 
              onClick={handleConnectWallet}
              className="text-lg px-8 py-6 pulse-glow"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet to Play
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 bg-card/50 backdrop-blur-sm glow-border hover:shadow-glow-strong transition-all">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Encrypted Positions</h3>
            <p className="text-muted-foreground">
              Your location on the grid is fully encrypted using FHE technology. 
              No one can see where you are.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm glow-border hover:shadow-glow-strong transition-all">
            <Swords className="h-12 w-12 text-secondary mb-4" />
            <h3 className="text-xl font-bold mb-2">Tactical Combat</h3>
            <p className="text-muted-foreground">
              Move strategically and attack enemies when you discover them. 
              Each move counts in the encrypted battlefield.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm glow-border hover:shadow-glow-strong transition-all">
            <Users className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-bold mb-2">Battle Royale</h3>
            <p className="text-muted-foreground">
              The safe zone shrinks over time. Stay inside or take damage. 
              Last survivor wins the match.
            </p>
          </Card>
        </div>

        {/* Game Stats */}
        <div className="mt-20 max-w-3xl mx-auto">
          <Card className="p-8 bg-card/30 backdrop-blur-sm border-primary/30">
            <h3 className="text-2xl font-bold mb-6 text-center">Current Game Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {gameState ? (gameState.isActive ? "Active" : gameState.gameEnded ? "Finished" : "Waiting") : "--"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Game Status</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">
                  {typeof gameState?.playersRegistered === "number" ? gameState.playersRegistered : "--"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Players Registered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">
                  {gameState?.safeZoneRadius != null ? gameState.safeZoneRadius : "--"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Zone Radius</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning">--</div>
                <div className="text-sm text-muted-foreground mt-1">Next Shrink</div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Powered by FHE Technology • Built on Blockchain</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
