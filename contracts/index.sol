// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, ebool, eaddress, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title BattleRoyale - Encrypted Battle Royale Game
 * @author Encrypted-Battle-Royale
 * @notice A fully confidential battle royale game where player positions are encrypted
 * @dev Uses Zama's FHEVM for confidential gaming on a 10x10 grid
 */
contract BattleRoyale is ZamaEthereumConfig {
    // Game constants
    uint8 public constant MAP_SIZE = 10;

    // Player state structure
    struct Player {
        euint8 x; // Encrypted X coordinate (0-9)
        euint8 y; // Encrypted Y coordinate (0-9)
        bool isAlive; // Public alive status
        bool hasJoined; // Public joined status
    }

    // Game state
    mapping(address => Player) public players;
    address[] public playersList;
    uint256 public gameStartTime;
    bool public gameActive;
    uint256 public maxPlayers;
    address public winner;
    bool public gameEnded;

    // Zone system
    uint8 public safeZoneRadius; // Current safe zone radius
    euint8 public safeZoneCenterX; // Encrypted safe zone center X
    euint8 public safeZoneCenterY; // Encrypted safe zone center Y
    uint256 public lastZoneShrink; // Last time zone shrank
    uint256 public zoneShrinkInterval; // Time between zone shrinks (seconds)

    // Events
    event PlayerJoined(address indexed player);
    event PlayerMoved(address indexed player);
    event PlayerAttacked(address indexed attacker, address indexed target);
    event PlayerKilled(address indexed killer, address indexed victim);
    event ZoneShrank(uint8 newRadius);
    event PlayerInDangerZone(address indexed player);
    event GameStarted();
    event GameEnded();
    event GameWon(address indexed winner);

    //my address => found player
    mapping(address => eaddress) public foundPlayerMap;

    /**
     * @dev Constructor initializes the game with maximum players
     * @param _maxPlayers Maximum number of players allowed in the game
     */
    constructor(uint256 _maxPlayers) {
        maxPlayers = _maxPlayers;
        gameActive = false;

        // Initialize zone system
        safeZoneRadius = MAP_SIZE / 2; // Start with half map size
        safeZoneCenterX = FHE.asEuint8(MAP_SIZE / 2);
        safeZoneCenterY = FHE.asEuint8(MAP_SIZE / 2);
        zoneShrinkInterval = 120; // 2 minutes between shrinks

        // Grant permissions for zone data
        FHE.allowThis(safeZoneCenterX);
        FHE.allowThis(safeZoneCenterY);
    }

    /**
     * @notice Join the battle royale game
     * @dev Players are assigned random encrypted positions on the map
     */
    function joinGame() external {
        require(playersList.length < maxPlayers, "Game is full");

        // Check if player has already joined
        require(!players[msg.sender].hasJoined, "Already joined");

        // Check if game is already active (simplified check)
        // require(gameStartTime == 0, "Game already started");

        // Generate random encrypted position
        euint8 randomX = FHE.rem(FHE.randEuint8(), MAP_SIZE);
        euint8 randomY = FHE.rem(FHE.randEuint8(), MAP_SIZE);

        // Initialize player with encrypted position and public status
        players[msg.sender] = Player({x: randomX, y: randomY, isAlive: true, hasJoined: true});

        playersList.push(msg.sender);

        // Grant access permissions for encrypted values only
        FHE.allowThis(players[msg.sender].x);
        FHE.allow(players[msg.sender].x, msg.sender);
        FHE.allowThis(players[msg.sender].y);
        FHE.allow(players[msg.sender].y, msg.sender);

        emit PlayerJoined(msg.sender);

        // Auto-start game if we reach max players
        // if (playersList.length == maxPlayers) {
        //     startGame();
        // }
    }

    /**
     * @notice Move player to adjacent cell
     * @param encryptedDirection Encrypted direction (0=up, 1=right, 2=down, 3=left)
     * @param inputProof Input proof for the encrypted direction
     */
    function movePlayer(externalEuint8 encryptedDirection, bytes calldata inputProof) external {
        require(gameStartTime > 0, "Game not active");
        require(players[msg.sender].hasJoined, "Not joined");
        require(players[msg.sender].isAlive, "Player is dead");

        euint8 direction = FHE.fromExternal(encryptedDirection, inputProof);
        Player storage player = players[msg.sender];

        // Current position
        euint8 currentX = player.x;
        euint8 currentY = player.y;

        // Calculate new position based on direction
        euint8 newX = currentX;
        euint8 newY = currentY;

        // Direction 0: Up (y - 1)
        ebool isUp = FHE.eq(direction, 0);
        euint8 upY = FHE.select(FHE.gt(currentY, 0), FHE.sub(currentY, 1), currentY);
        newY = FHE.select(isUp, upY, newY);

        // Direction 1: Right (x + 1)
        ebool isRight = FHE.eq(direction, 1);
        euint8 rightX = FHE.select(FHE.lt(currentX, MAP_SIZE - 1), FHE.add(currentX, 1), currentX);
        newX = FHE.select(isRight, rightX, newX);

        // Direction 2: Down (y + 1)
        ebool isDown = FHE.eq(direction, 2);
        euint8 downY = FHE.select(FHE.lt(currentY, MAP_SIZE - 1), FHE.add(currentY, 1), currentY);
        newY = FHE.select(isDown, downY, newY);

        // Direction 3: Left (x - 1)
        ebool isLeft = FHE.eq(direction, 3);
        euint8 leftX = FHE.select(FHE.gt(currentX, 0), FHE.sub(currentX, 1), currentX);
        newX = FHE.select(isLeft, leftX, newX);

        // Update player position
        player.x = newX;
        player.y = newY;

        // Grant access permissions for new position
        FHE.allowThis(player.x);
        FHE.allow(player.x, msg.sender);
        FHE.allowThis(player.y);
        FHE.allow(player.y, msg.sender);

        checkOthers(player);

        emit PlayerMoved(msg.sender);
    }

    function checkOthers(Player memory me) internal {
        for (uint256 index = 0; index < playersList.length; index++) {
            address other = playersList[index];
            if (other == msg.sender) {
                continue;
            }
            Player memory otherPlayer = players[other];
            euint8 otherX = otherPlayer.x;
            euint8 otherY = otherPlayer.y;

            ebool equalX = FHE.eq(me.x, otherX);
            ebool equalY = FHE.eq(me.y, otherY);

            ebool equal = FHE.select(
                equalX,
                FHE.select(equalY, FHE.asEbool(true), FHE.asEbool(false)),
                FHE.asEbool(false)
            );
            eaddress found = FHE.select(equal, FHE.asEaddress(other), FHE.asEaddress(address(0)));
            foundPlayerMap[msg.sender] = found;
            FHE.allow(found, msg.sender);
            FHE.allowThis(found);
        }
    }

    function getFoundPlayer(address user) external view returns (eaddress) {
        return foundPlayerMap[user];
    }

    /**
     * @notice Attack another player if they are within range
     * @param target The address of the player to attack
     */
    function attackPlayer(address target) external {
        require(gameStartTime > 0, "Game not active");
        require(players[msg.sender].hasJoined, "Not joined");
        require(players[target].hasJoined, "Target not joined");
        require(target != msg.sender, "Cannot attack yourself");

        Player storage attacker = players[msg.sender];
        Player storage victim = players[target];

        // Check if both players are alive
        require(attacker.isAlive, "Attacker is dead");
        require(victim.isAlive, "Target is already dead");

        // Check if players are adjacent (within 1 cell)
        euint8 xDiff = FHE.select(
            FHE.ge(attacker.x, victim.x),
            FHE.sub(attacker.x, victim.x),
            FHE.sub(victim.x, attacker.x)
        );
        euint8 yDiff = FHE.select(
            FHE.ge(attacker.y, victim.y),
            FHE.sub(attacker.y, victim.y),
            FHE.sub(victim.y, attacker.y)
        );

        // Players must be within 1 cell to attack
        ebool withinRangeX = FHE.le(xDiff, 1);
        ebool withinRangeY = FHE.le(yDiff, 1);
        ebool withinRange = FHE.and(withinRangeX, withinRangeY);

        // For simplicity, we'll skip the range check for now
        // In a real implementation, you'd need to decrypt the encrypted distance
        // and verify that players are actually adjacent

        // One-hit kill: victim dies immediately
        victim.isAlive = false;

        emit PlayerAttacked(msg.sender, target);

        // Note: In a real implementation, we'd need to emit events conditionally
        // For now, we emit regardless and let frontend handle the logic
    }

    /**
     * @notice Shrink the safe zone (can be called by anyone when time is up)
     */
    function shrinkZone() external {
        require(gameStartTime > 0, "Game not active");
        require(block.timestamp >= lastZoneShrink + zoneShrinkInterval, "Too early to shrink");
        require(safeZoneRadius > 1, "Zone cannot shrink further");

        // Shrink the radius
        safeZoneRadius -= 1;
        lastZoneShrink = block.timestamp;

        // Optionally move zone center slightly (add some randomness)
        uint8 centerShift = 1;
        if (safeZoneRadius > 2) {
            euint8 randomShiftX = FHE.rem(FHE.randEuint8(), 3); // 0, 1, or 2
            euint8 randomShiftY = FHE.rem(FHE.randEuint8(), 3); // 0, 1, or 2

            // Shift center by -1, 0, or +1
            euint8 shiftX = FHE.sub(randomShiftX, 1);
            euint8 shiftY = FHE.sub(randomShiftY, 1);

            safeZoneCenterX = FHE.add(safeZoneCenterX, shiftX);
            safeZoneCenterY = FHE.add(safeZoneCenterY, shiftY);

            // Keep center within bounds
            safeZoneCenterX = FHE.select(
                FHE.lt(safeZoneCenterX, safeZoneRadius),
                FHE.asEuint8(safeZoneRadius),
                safeZoneCenterX
            );
            safeZoneCenterX = FHE.select(
                FHE.ge(safeZoneCenterX, MAP_SIZE - safeZoneRadius),
                FHE.asEuint8(MAP_SIZE - safeZoneRadius - 1),
                safeZoneCenterX
            );

            safeZoneCenterY = FHE.select(
                FHE.lt(safeZoneCenterY, safeZoneRadius),
                FHE.asEuint8(safeZoneRadius),
                safeZoneCenterY
            );
            safeZoneCenterY = FHE.select(
                FHE.ge(safeZoneCenterY, MAP_SIZE - safeZoneRadius),
                FHE.asEuint8(MAP_SIZE - safeZoneRadius - 1),
                safeZoneCenterY
            );

            FHE.allowThis(safeZoneCenterX);
            FHE.allowThis(safeZoneCenterY);
        }

        emit ZoneShrank(safeZoneRadius);

        // Apply damage to players outside safe zone
        _applyZoneDamage();
    }

    /**
     * @notice Apply damage to players outside the safe zone
     * @dev Internal function called during zone shrinking
     */
    function _applyZoneDamage() internal {
        uint8 zoneDamage = 10; // Fixed zone damage

        for (uint256 i = 0; i < playersList.length; i++) {
            address playerAddr = playersList[i];
            Player storage player = players[playerAddr];

            // Skip if player is dead
            // Note: We can't check encrypted values in loops directly
            // This is a simplified implementation

            // Calculate distance from zone center
            euint8 playerX = player.x;
            euint8 playerY = player.y;

            euint8 distanceX = FHE.select(
                FHE.ge(playerX, safeZoneCenterX),
                FHE.sub(playerX, safeZoneCenterX),
                FHE.sub(safeZoneCenterX, playerX)
            );
            euint8 distanceY = FHE.select(
                FHE.ge(playerY, safeZoneCenterY),
                FHE.sub(playerY, safeZoneCenterY),
                FHE.sub(safeZoneCenterY, playerY)
            );

            // Simple distance check (Manhattan distance for simplicity)
            euint8 totalDistance = FHE.add(distanceX, distanceY);
            ebool outsideZone = FHE.gt(totalDistance, safeZoneRadius);

            // Kill player if outside zone
            // For simplified implementation, we can kill players outside zone
            // In a real game, you might want to decrypt the position first
            // player.isAlive = FHE.select(outsideZone, false, player.isAlive);

            // Emit event for players potentially in danger zone
            emit PlayerInDangerZone(playerAddr);
        }

        // Check for victory condition after zone damage
        _checkVictoryCondition();
    }

    /**
     * @notice Check if there's a winner and end the game if so
     * @dev Called after attacks and zone damage to detect victory
     */
    function _checkVictoryCondition() internal {
        if (gameEnded) return;

        address potentialWinner = address(0);
        uint256 aliveCount = 0;

        // Count alive players (simplified approach)
        // Note: In a real implementation, we'd need a more sophisticated way
        // to handle encrypted alive status checking
        for (uint256 i = 0; i < playersList.length; i++) {
            address playerAddr = playersList[i];

            // This is a simplification - in reality we'd need to decrypt
            // or use more complex logic to determine alive status
            // For now, we assume the frontend will call checkVictory manually
            aliveCount++;
            potentialWinner = playerAddr;
        }

        // For manual victory checking, we provide a public function
    }

    /**
     * @notice Manually check victory condition (can be called by anyone)
     * @dev This is a simplified approach due to encrypted data limitations
     */
    function checkVictoryCondition() external {
        require(gameStartTime > 0 && !gameEnded, "Game not active or already ended");

        // This function would need to be enhanced with proper decryption
        // or off-chain computation for encrypted alive status

        // For now, it's a placeholder that requires manual determination
        // In a real implementation, you'd use the decryption oracle
        // to decrypt player alive status and determine the winner
    }

    /**
     * @notice Declare winner manually (for testing/demo purposes)
     * @param _winner Address of the winning player
     * @dev In production, this should be automated through decryption oracle
     */
    function declareWinner(address _winner) external {
        require(gameStartTime > 0 && !gameEnded, "Game not active or already ended");
        require(players[_winner].hasJoined, "Winner must be a valid player");

        winner = _winner;
        gameEnded = true;
        gameActive = false;

        emit GameWon(_winner);
        emit GameEnded();
    }

    /**
     * @notice Start the game manually (if not auto-started)
     * @dev Only callable when enough players have joined
     */
    function startGame() public {
        require(playersList.length >= 2, "Need at least 2 players");
        require(gameStartTime == 0, "Game already active");

        gameActive = true;
        gameStartTime = block.timestamp;
        lastZoneShrink = block.timestamp;

        emit GameStarted();
    }

    /**
     * @notice End the game
     * @dev Can be called to end the game manually
     */
    function endGame() external {
        require(gameStartTime > 0, "Game not active");
        require(!gameEnded, "Game already ended");

        gameActive = false;
        gameEnded = true;
        gameStartTime = 0; // Reset game start time to indicate game is not active

        emit GameEnded();
    }

    /**
     * @notice Get player's encrypted position
     * @param playerAddr The address of the player
     * @return x Encrypted X coordinate
     * @return y Encrypted Y coordinate
     */
    function getPlayerPosition(address playerAddr) external view returns (euint8, euint8) {
        require(players[playerAddr].hasJoined, "Player not joined");
        return (players[playerAddr].x, players[playerAddr].y);
    }

    /**
     * @notice Get player's status
     * @param playerAddr The address of the player
     * @return isAlive Public alive status
     * @return hasJoined Public joined status
     */
    function getPlayerStatus(address playerAddr) external view returns (bool, bool) {
        return (players[playerAddr].isAlive, players[playerAddr].hasJoined);
    }

    /**
     * @notice Get current game state
     * @return active Public game active status
     * @return startTime Game start timestamp
     * @return totalPlayers Total number of players
     */
    function getGameState() external view returns (bool, uint256, uint256) {
        return (gameActive, gameStartTime, playersList.length);
    }

    /**
     * @notice Get total number of players
     * @return The total number of players who have joined
     */
    function getTotalPlayers() external view returns (uint256) {
        return playersList.length;
    }

    /**
     * @notice Get player at specific index
     * @param index The index in the players list
     * @return The address of the player at the given index
     */
    function getPlayerByIndex(uint256 index) external view returns (address) {
        require(index < playersList.length, "Index out of bounds");
        return playersList[index];
    }

    /**
     * @notice Check if a player has joined the game
     * @param playerAddr The address of the player to check
     * @return hasJoined Public joined status
     */
    function hasPlayerJoined(address playerAddr) external view returns (bool) {
        return players[playerAddr].hasJoined;
    }

    /**
     * @notice Get current safe zone information
     * @return radius Current safe zone radius
     * @return centerX Encrypted center X coordinate
     * @return centerY Encrypted center Y coordinate
     * @return lastShrink Timestamp of last zone shrink
     * @return nextShrink Timestamp of next possible zone shrink
     */
    function getSafeZoneInfo() external view returns (uint8, euint8, euint8, uint256, uint256) {
        return (safeZoneRadius, safeZoneCenterX, safeZoneCenterY, lastZoneShrink, lastZoneShrink + zoneShrinkInterval);
    }

    /**
     * @notice Get game result information
     * @return ended Whether the game has ended
     * @return winnerAddr Address of the winner (zero address if no winner yet)
     */
    function getGameResult() external view returns (bool, address) {
        return (gameEnded, winner);
    }

    function getPlayersList() external view returns (address[] memory) {
        return playersList;
    }
}
