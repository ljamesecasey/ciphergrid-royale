import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Swords, Target, Users, Radar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useBattleRoyaleActions } from "@/hooks/useBattleRoyaleActions";
import { useWallet } from "@/providers/WalletProvider";
import { useGameState } from "@/hooks/useBattleRoyaleState";
import { getReadOnlyBattleRoyaleContract } from "@/lib/battleRoyaleClient";

const Game = () => {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { movePlayer, attackPlayer, revealFoundPlayer, isBusy } = useBattleRoyaleActions();
  const gameState = useGameState();
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [safeZone, setSafeZone] = useState({ centerX: 0, centerY: 0, radius: 0 });
  const [playerStatus, setPlayerStatus] = useState<{ isAlive: boolean; hasJoined: boolean } | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [detectedPlayer, setDetectedPlayer] = useState<string | null>(null);

  const gridSize = 10;
  const playersRegistered = gameState.data?.playerAddresses.length;

  useEffect(() => {
    if (gameState.data?.safeZoneRadius != null) {
      setSafeZone((prev) => ({
        ...prev,
        radius: gameState.data.safeZoneRadius,
      }));
    }
  }, [gameState.data?.safeZoneRadius]);

  useEffect(() => {
    const contract = getReadOnlyBattleRoyaleContract();
    if (!contract || !address) {
      setPlayerStatus(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [isAliveValue, hasJoinedValue] = await contract.getPlayerStatus(address);
        if (!cancelled) {
          setPlayerStatus({ isAlive: isAliveValue, hasJoined: hasJoinedValue });
        }
      } catch {
        if (!cancelled) {
          setPlayerStatus(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, gameState.data?.playerAddresses]);

  const hasJoinedGame = playerStatus?.hasJoined === true;
  const isPlayerAlive = playerStatus?.isAlive === true;
  const canInteract = playerStatus == null ? true : hasJoinedGame && isPlayerAlive;

  const handleMove = async (direction: "up" | "down" | "left" | "right") => {
    let newX = playerPosition.x;
    let newY = playerPosition.y;

    switch(direction) {
      case 'up':
        newY = Math.max(0, newY - 1);
        break;
      case 'down':
        newY = Math.min(gridSize - 1, newY + 1);
        break;
      case 'left':
        newX = Math.max(0, newX - 1);
        break;
      case 'right':
        newX = Math.min(gridSize - 1, newX + 1);
        break;
    }

    try {
      await movePlayer(direction);
      setPlayerPosition({ x: newX, y: newY });
      addEventLog(`Submitted encrypted move ${direction} to (${newX}, ${newY})`);
      toast.success(`Encrypted move ${direction} sent`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to move");
    }
  };

  const handleAttack = async () => {
    if (!detectedPlayer) {
      toast.error("Scan for nearby players before attacking.");
      return;
    }
    try {
      await attackPlayer(detectedPlayer);
      addEventLog(`Attack dispatched towards ${detectedPlayer}`);
      toast.success("Attack launched!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Attack failed");
    }
  };

  const handleScan = async () => {
    try {
      const player = await revealFoundPlayer();
      if (player) {
        setDetectedPlayer(player);
        addEventLog(`Detected encrypted player handle decrypted to ${player}`);
        toast.success(`Detected player: ${player}`);
        return;
      }
      toast.info("No nearby players detected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reveal player");
    }
  };

  const addEventLog = (message: string) => {
    setEventLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 9)]);
  };

  const isInSafeZone = (x: number, y: number) => {
    const distance = Math.sqrt(
      Math.pow(x - safeZone.centerX, 2) + Math.pow(y - safeZone.centerY, 2)
    );
    return distance <= safeZone.radius;
  };

  const getCellColor = (x: number, y: number) => {
    if (x === playerPosition.x && y === playerPosition.y) {
      return "bg-primary shadow-glow";
    }
    if (!isInSafeZone(x, y)) {
      return "bg-destructive/20 border-destructive/50";
    }
    if (isInSafeZone(x, y) && Math.abs(x - safeZone.centerX) <= 1 && Math.abs(y - safeZone.centerY) <= 1) {
      return "bg-accent/20 border-accent/50";
    }
    return "bg-card/30 border-border/30";
  };

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">CipherGrid Royale</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant={
                playerStatus == null
                  ? "outline"
                  : !hasJoinedGame
                    ? "outline"
                    : isPlayerAlive
                      ? "default"
                      : "destructive"
              }
              className="text-sm"
            >
              {playerStatus == null
                ? "Status Unknown"
                : !hasJoinedGame
                  ? "Not Joined"
                  : isPlayerAlive
                    ? "Alive"
                    : "Eliminated"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              Exit
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Stats */}
          <div className="space-y-4">
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Game Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Players Registered</span>
                  <span className="text-xl font-bold text-accent">
                    {typeof playersRegistered === "number" ? playersRegistered : "--"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Safe Zone Radius</span>
                  <span className="text-xl font-bold text-primary">
                    {gameState.data?.safeZoneRadius != null ? gameState.data.safeZoneRadius : "--"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Next Shrink</span>
                  <span className="text-xl font-bold text-warning">--</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-secondary" />
                Your Position
              </h3>
              <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-3xl font-bold text-primary font-mono">
                  ({playerPosition.x}, {playerPosition.y})
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {isInSafeZone(playerPosition.x, playerPosition.y) 
                    ? "Inside Safe Zone" 
                    : "⚠️ Outside Safe Zone"}
                </div>
                {detectedPlayer && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Detected target: {detectedPlayer}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-3">Event Log</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {eventLog.map((event, index) => (
                  <div key={index} className="text-xs font-mono text-muted-foreground p-2 rounded bg-muted/20">
                    {event}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Center Panel - Grid */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-center mb-2">Battle Grid</h3>
                <p className="text-center text-sm text-muted-foreground">
                  <span className="text-primary">■</span> You • 
                  <span className="text-accent ml-2">■</span> Safe Zone • 
                  <span className="text-destructive ml-2">■</span> Danger Zone
                </p>
              </div>

              {/* 10x10 Grid */}
              <div className="aspect-square max-w-2xl mx-auto mb-6">
                <div className="grid grid-cols-10 gap-1 h-full">
                  {Array.from({ length: gridSize }).map((_, y) =>
                    Array.from({ length: gridSize }).map((_, x) => (
                      <div
                        key={`${x}-${y}`}
                        className={`aspect-square border rounded transition-all ${getCellColor(x, y)}`}
                      >
                        {x === playerPosition.x && y === playerPosition.y && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-primary-foreground animate-pulse" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={() => handleMove('up')}
                    disabled={!canInteract || isBusy || !address}
                    className="w-20 h-20"
                  >
                    <ArrowUp className="h-6 w-6" />
                  </Button>
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    size="lg"
                    onClick={() => handleMove('left')}
                    disabled={!canInteract || isBusy || !address}
                    className="w-20 h-20"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => handleMove('down')}
                    disabled={!canInteract || isBusy || !address}
                    className="w-20 h-20"
                  >
                    <ArrowDown className="h-6 w-6" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => handleMove('right')}
                    disabled={!canInteract || isBusy || !address}
                    className="w-20 h-20"
                  >
                    <ArrowRight className="h-6 w-6" />
                  </Button>
                </div>
                <div className="flex flex-col md:flex-row justify-center gap-4 pt-4">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleScan}
                    disabled={!canInteract || isBusy || !address}
                    className="w-48 h-16 text-lg"
                  >
                    <Radar className="mr-2 h-6 w-6" />
                    Scan Nearby
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={handleAttack}
                    disabled={!canInteract || isBusy || !address || !detectedPlayer}
                    className="w-48 h-16 text-lg"
                  >
                    <Swords className="mr-2 h-6 w-6" />
                    Attack Nearby
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
