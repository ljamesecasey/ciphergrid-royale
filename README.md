# 🎮 CipherGrid Royale
Video URL：
> **Encrypted Battle Royale on Blockchain** - A fully confidential battle royale game where player positions are encrypted using Zama's FHEVM technology.
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/solidity-0.8.24-orange.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)

## 📖 Overview

**CipherGrid Royale** is a Web3 battle royale game built on Ethereum (Sepolia testnet) that leverages **Fully Homomorphic Encryption (FHE)** to ensure complete privacy of player positions. Players battle on a 10×10 encrypted grid battlefield where their coordinates are hidden from other players and observers, even on the public blockchain.

### Key Innovation

Unlike traditional battle royale games where positions are visible, CipherGrid Royale uses **Zama FHEVM** to encrypt player positions on-chain. This means:
- 🔐 **Complete Privacy**: Your position is encrypted and only you can decrypt it
- 🎯 **Fair Play**: No one can see your location, preventing cheating
- ⛓️ **On-Chain Verification**: All game logic is verified on the blockchain
- 🛡️ **Transparent Yet Private**: Game rules are transparent, but positions remain secret

## ✨ Features

### Core Gameplay
- **10×10 Grid Battlefield**: Navigate a 10×10 encrypted grid
- **Encrypted Positions**: Player coordinates (x, y) are stored as `euint8` (encrypted uint8)
- **Movement System**: Move in 4 directions (up, down, left, right) with encrypted direction inputs
- **Attack System**: Attack other players when you detect them
- **Safe Zone**: A shrinking safe zone that eliminates players outside its radius
- **Last Player Standing**: The last survivor wins the game

### Technical Features
- 🔒 **FHEVM Integration**: Uses Zama's FHEVM SDK 0.3.0-5 for encryption
- ⚡ **Real-time Updates**: React-based frontend with live game state
- 🎨 **Modern UI**: Built with shadcn-ui and Tailwind CSS
- 🔗 **Web3 Integration**: Seamless wallet connection and blockchain interaction
- 📊 **Game State Management**: Efficient state management with React Query

## 🏗️ Architecture

### Smart Contract

The `BattleRoyale` contract implements the core game logic:

```solidity
contract BattleRoyale is ZamaEthereumConfig {
    uint8 public constant MAP_SIZE = 10;
    
    struct Player {
        euint8 x;        // Encrypted X coordinate
        euint8 y;        // Encrypted Y coordinate
        bool isAlive;    // Public alive status
        bool hasJoined;  // Public joined status
    }
    
    // Zone system with encrypted center coordinates
    euint8 public safeZoneCenterX;
    euint8 public safeZoneCenterY;
    uint8 public safeZoneRadius;
}
```

### Frontend Architecture

```
src/
├── pages/
│   ├── Index.tsx      # Landing page
│   ├── Lobby.tsx      # Game lobby (join/wait)
│   ├── Game.tsx       # Main game interface
│   └── Result.tsx    # Game results
├── hooks/
│   ├── useBattleRoyaleActions.ts  # Game actions (move, attack, etc.)
│   └── useBattleRoyaleState.ts     # Game state management
├── lib/
│   ├── battleRoyaleClient.ts       # Contract interaction
│   ├── fhevm.ts                    # FHEVM SDK wrapper
│   └── providers.ts               # Web3 providers
└── components/                     # UI components
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH (for gas fees)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ciphergrid-royale-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # For contract deployment
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   
   # For frontend
   VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 📦 Smart Contract Deployment

### Compile Contract

```bash
npm run hh:compile
```

This compiles the contract using Hardhat with Solidity 0.8.24.

### Deploy to Sepolia

1. **Configure deployment**
   
   Ensure your `.env` file has:
   - `SEPOLIA_RPC_URL`: Your Sepolia RPC endpoint
   - `PRIVATE_KEY`: Your deployer wallet private key (with 0x prefix)

2. **Optional: Configure max players**
   
   Edit `scripts/deploy.cjs` to set `MAX_PLAYERS` (default is 16).

3. **Deploy**
   ```bash
   npm run hh:deploy
   ```

   The console will output the deployed contract address.

4. **Update frontend**
   
   Copy the deployed contract address to `VITE_CONTRACT_ADDRESS` in your `.env` file, then restart the frontend.

### Verify Contract (Optional)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <MAX_PLAYERS>
```

## 🎮 How to Play

### 1. Join the Game

1. Connect your wallet (MetaMask, OKX, etc.)
2. Navigate to the **Lobby** page
3. Click **Join Game** to enter the battle royale
4. You'll be assigned a random encrypted position on the grid

### 2. Gameplay

Once the game starts:

- **Move**: Use arrow buttons to move in 4 directions
  - Your movement direction is encrypted before submission
  - Your position remains encrypted on-chain
  
- **Attack**: Attack other players when you detect them
  - Use the attack system to eliminate opponents
  
- **Safe Zone**: Stay within the shrinking safe zone
  - The safe zone shrinks every 2 minutes
  - Players outside the zone are eliminated

### 3. Win Condition

- **Last Player Standing**: Be the last survivor to win!

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Smart Contract
npm run hh:compile       # Compile contracts
npm run hh:test          # Run tests
npm run hh:deploy        # Deploy to Sepolia

# Code Quality
npm run lint             # Run ESLint
```

### Project Structure

```
ciphergrid-royale-main/
├── contracts/              # Solidity smart contracts
│   └── index.sol          # BattleRoyale contract
├── scripts/                # Deployment scripts
│   ├── deploy.cjs         # Hardhat deployment script
│   └── deploy.ts          # TypeScript deployment script
├── src/
│   ├── pages/             # React pages/routes
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and clients
│   ├── components/        # Reusable UI components
│   └── providers/         # React context providers
├── public/                # Static assets
├── artifacts/              # Compiled contracts
├── cache/                 # Hardhat cache
├── hardhat.config.cjs     # Hardhat configuration
├── vite.config.ts         # Vite configuration
└── tailwind.config.ts     # Tailwind CSS configuration
```

### Technology Stack

#### Frontend
- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool
- **Tailwind CSS 3.4.17** - Styling
- **shadcn-ui** - UI component library
- **React Router 6.30.1** - Routing
- **React Query 5.83.0** - Data fetching
- **Ethers.js 6.13.4** - Ethereum interaction

#### Blockchain
- **Hardhat 2.22.4** - Development environment
- **Solidity 0.8.24** - Smart contract language
- **FHEVM Solidity 0.9.1** - FHE library
- **FHEVM Hardhat Plugin 0.1.0** - FHEVM integration

#### Encryption
- **Zama FHEVM Relayer SDK 0.3.0-5** - FHE encryption SDK

## 🔐 Security & Privacy

### Encryption Details

- **Player Positions**: Encrypted using `euint8` (encrypted uint8)
- **Movement Directions**: Encrypted before submission to contract
- **On-Chain Privacy**: Positions remain encrypted on the blockchain
- **Client-Side Decryption**: Only the player can decrypt their own position

### Permissions System

The contract uses FHEVM's permission system:
- Players can decrypt their own positions
- Contract can perform encrypted computations
- Other players cannot see your position

## 📝 Contract Functions

### Public Functions

- `joinGame()` - Join the battle royale game
- `movePlayer(externalEuint8 direction, bytes proof)` - Move player
- `attackPlayer(address target)` - Attack another player
- `revealFoundPlayer(address target)` - Reveal a detected player
- `startGame()` - Start the game (requires min players)
- `shrinkZone()` - Manually trigger zone shrink

### View Functions

- `getPlayerStatus(address)` - Get player alive/joined status
- `getPlayerPosition(address)` - Get encrypted player position (only for owner)
- `playersList` - List of all players
- `gameActive` - Check if game is active
- `safeZoneRadius` - Current safe zone radius

## 🐛 Troubleshooting

### Common Issues

1. **"Relayer SDK not loaded"**
   - Ensure the FHEVM SDK script is loaded in `index.html`
   - Check browser console for CDN loading errors

2. **"Game not active"**
   - Ensure at least 2 players have joined
   - Check that `startGame()` has been called

3. **"Failed to initialize wallet"**
   - Ensure MetaMask or compatible wallet is installed
   - Check that you're connected to Sepolia testnet

4. **Contract deployment fails**
   - Verify `SEPOLIA_RPC_URL` is correct
   - Ensure deployer wallet has Sepolia ETH
   - Check `PRIVATE_KEY` format (must start with 0x)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Zama** for the FHEVM technology
- **Hardhat** for the development framework
- **shadcn-ui** for the beautiful UI components

## 🔗 Links

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [React Documentation](https://react.dev)

---

**Built with ❤️ using FHE & Web3**

