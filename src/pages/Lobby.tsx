import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Play, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMemo } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { useBattleRoyaleActions } from "@/hooks/useBattleRoyaleActions";
import { useLobbyState } from "@/hooks/useBattleRoyaleState";
import { hasBattleRoyaleContract } from "@/lib/battleRoyaleClient";

const Lobby = () => {
  const navigate = useNavigate();
  const { address } = useWallet();
  const lobbyQuery = useLobbyState();
  const { joinGame, startGame, isBusy } = useBattleRoyaleActions();

  const players = lobbyQuery.data?.players ?? [];
  const maxPlayers = lobbyQuery.data?.maxPlayers ?? 16;
  const minPlayers = 2;
  const contractConfigured = hasBattleRoyaleContract();

  const hasJoined = useMemo(() => {
    if (!address) return false;
    return players.some((player) => player.address.toLowerCase() === address.toLowerCase());
  }, [address, players]);

  const handleJoinGame = async () => {
    try {
      await joinGame();
      toast.success("Successfully joined the game!");
      lobbyQuery.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join game";
      toast.error(message);
    }
  };

  const handleStartGame = async () => {
    if (players.length < minPlayers) {
      toast.error(`Need at least ${minPlayers} players to start`);
      return;
    }
    try {
      await startGame();
      toast.success("Game starting...");
      setTimeout(() => navigate("/game"), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start game");
    }
  };

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">CipherGrid Royale</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Exit Lobby
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Lobby Header */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold bg-gradient-cyber bg-clip-text text-transparent">
              Game Lobby
            </h2>
            <p className="text-muted-foreground">
              Waiting for players to join the encrypted battlefield
            </p>
          </div>

          {/* Player Count */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm glow-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <span className="text-xl font-semibold">Players</span>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {players.length} / {maxPlayers}
              </Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-cyber transition-all duration-500"
                style={{ width: `${(players.length / maxPlayers) * 100}%` }}
              />
            </div>
            {!contractConfigured && (
              <p className="mt-4 text-sm text-muted-foreground">
                Set <code>VITE_CONTRACT_ADDRESS</code> to see live lobby data from the Battle Royale contract.
              </p>
            )}
          </Card>

          {/* Join/Status Card */}
          {!hasJoined ? (
            <Card className="p-8 bg-card/30 backdrop-blur-sm border-primary/30 text-center space-y-4">
              <h3 className="text-2xl font-bold">Ready to Enter?</h3>
              <p className="text-muted-foreground">
                Join the game and wait for other players. You'll need at least {minPlayers} players to start.
              </p>
              <Button 
                size="lg" 
                onClick={handleJoinGame}
                className="pulse-glow text-lg px-8"
                disabled={!contractConfigured || lobbyQuery.isLoading || isBusy}
              >
                {contractConfigured ? "Join Game" : "Contract Missing"}
              </Button>
            </Card>
          ) : (
            <Card className="p-8 bg-accent/10 backdrop-blur-sm border-accent/30 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-accent">
                <Clock className="h-6 w-6 animate-pulse" />
                <h3 className="text-2xl font-bold">You're In!</h3>
              </div>
              <p className="text-muted-foreground">
                Waiting for more players or game start...
              </p>
            </Card>
          )}

          {/* Players List */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Connected Players
            </h3>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="font-mono text-sm">{player.address}</span>
                  </div>
                  <Badge variant="secondary">{player.hasJoined ? "Joined" : "Pending"}</Badge>
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, index) => (
                <div 
                  key={`empty-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-dashed border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted" />
                    <span className="font-mono text-sm text-muted-foreground">Waiting for player...</span>
                  </div>
                  <Badge variant="outline" className="opacity-50">Empty</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Start Game Button */}
          {hasJoined && (
            <div className="text-center">
              <Button 
                size="lg" 
                onClick={handleStartGame}
                disabled={players.length < minPlayers || isBusy}
                className="text-lg px-12 py-6"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Game
              </Button>
              {players.length < minPlayers && (
                <p className="text-sm text-muted-foreground mt-3">
                  Need at least {minPlayers} players to start
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
