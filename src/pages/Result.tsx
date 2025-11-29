import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Home, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGameState } from "@/hooks/useBattleRoyaleState";
import { useWallet } from "@/providers/WalletProvider";

const Result = () => {
  const navigate = useNavigate();
  const { data: gameState } = useGameState();
  const { address } = useWallet();

  const winnerAddress = gameState?.winner ?? null;
  const totalPlayers = gameState?.playersRegistered;
  const isWinner = winnerAddress && address
    ? winnerAddress.toLowerCase() === address.toLowerCase()
    : false;

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Victory Banner */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Trophy className="h-24 w-24 text-warning animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-cyber bg-clip-text text-transparent">
            {gameState?.gameEnded ? "Game Over" : "Awaiting Results"}
          </h1>
          <p className="text-xl text-muted-foreground">
            {gameState?.gameEnded ? "The battle has concluded" : "Game is still active"}
          </p>
        </div>

        {/* Winner Card */}
        <Card className="p-8 bg-card/50 backdrop-blur-sm glow-border text-center space-y-4">
          <div className="inline-block p-4 rounded-full bg-warning/20 border-2 border-warning">
            <Trophy className="h-12 w-12 text-warning" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {isWinner ? "You Won!" : gameState?.gameEnded ? "Victory Royale" : "Pending Winner"}
            </h2>
            <p className="text-muted-foreground mb-4">Winner</p>
            <div className="text-3xl font-mono font-bold text-primary">
              {winnerAddress ?? "—"}
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-6 text-center bg-card/30 backdrop-blur-sm">
            <div className="text-3xl font-bold text-primary mb-1">
              {typeof totalPlayers === "number" ? totalPlayers : "—"}
            </div>
            <div className="text-sm text-muted-foreground">Total Players</div>
          </Card>
          <Card className="p-6 text-center bg-card/30 backdrop-blur-sm">
            <div className="text-3xl font-bold text-accent mb-1">—</div>
            <div className="text-sm text-muted-foreground">Your Rank</div>
          </Card>
          <Card className="p-6 text-center bg-card/30 backdrop-blur-sm">
            <div className="text-3xl font-bold text-secondary mb-1">—</div>
            <div className="text-sm text-muted-foreground">Eliminations</div>
          </Card>
        </div>

        {/* Your Performance */}
        <Card className="p-6 bg-card/30 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4">Your Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Survival Time</span>
              <span className="font-bold">—</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Moves Made</span>
              <span className="font-bold">—</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Attacks Launched</span>
              <span className="font-bold">—</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Final Position</span>
              <span className="font-bold font-mono">—</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            size="lg" 
            className="flex-1"
            onClick={() => navigate("/lobby")}
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Play Again
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/")}
          >
            <Home className="mr-2 h-5 w-5" />
            Return Home
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Thanks for playing CipherGrid Royale!
        </p>
      </div>
    </div>
  );
};

export default Result;
