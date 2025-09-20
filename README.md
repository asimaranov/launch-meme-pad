# 🚀 Meme Launchpad

Deployed at: https://launch-meme-pad.vercel.app/

The platform for launching and trading meme tokens on Solana. Create, discover, and trade the hottest meme coins with real-time updates and seamless wallet integration. Developed with Next.js, Tailwind CSS, and Solana Web3.js.

## ✨ Features

### 🎯 Core Features

- **Token Launchpad** - Create and launch meme tokens on Solana with custom metadata
- **Real-time Trading** - Live token prices and trading with WebSocket integration
- **Portfolio Management** - Track your token holdings and trading history
- **Social Features** - Token-specific chat rooms and community interaction
- **Rewards System** - Earn rewards for platform participation
- **Wallet Integration** - Seamless Solana wallet connection with Privy authentication

### 🔧 Technical Features

- **Responsive Design** - Mobile-first design with desktop optimization
- **Real-time Updates** - Live price feeds and chat via Centrifugo WebSocket
- **State Management** - Zustand stores for efficient state management
- **Type Safety** - Full TypeScript coverage with comprehensive type definitions
- **Error Handling** - Centralized error management with user-friendly messages
- **Performance** - Optimized with Next.js 15 and Turbopack

## 🏗️ Architecture

### Frontend Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand with persistence
- **Authentication**: Privy for wallet authentication
- **Blockchain**: Solana Web3.js and SPL Token libraries
- **Real-time**: Centrifugo WebSocket client
- **Icons**: Lucide React

### Project Structure

```
meme-launchpad/
├── app/
│   ├── components/           # React components
│   │   ├── LaunchpadPage/   # Main app components
│   │   │   ├── pages/       # Page components
│   │   │   └── ...          # UI components
│   │   └── DashboardPage/   # Dashboard components
│   ├── context/             # React contexts
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utility libraries
│   ├── sdk/                 # Solana SDK wrapper
│   ├── store/               # Zustand stores
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
└── ...                     # Config files
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Solana wallet (Phantom, Solflare, etc.)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/meme-launchpad.git
   cd meme-launchpad
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=https://api.memetoken.com
   NEXT_PUBLIC_WS_URL=wss://ws.memetoken.com

   # Solana Network Configuration
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

   # Privy Configuration
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

   # Optional: Custom configurations
   NEXT_PUBLIC_APP_NAME="Meme Launchpad"
   NEXT_PUBLIC_APP_DESCRIPTION="Launch and trade meme tokens on Solana"
   ```

4. **Start the development server**

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 Usage

### For Token Creators

1. **Connect Wallet** - Use any Solana-compatible wallet
2. **Launch Token** - Navigate to the Launch page
3. **Configure Token** - Set name, symbol, supply, and metadata
4. **Upload Assets** - Add token logo and description
5. **Deploy** - Create your token on Solana blockchain
6. **Trade** - Start trading immediately after deployment

### For Traders

1. **Browse Tokens** - Explore trending and new tokens
2. **View Details** - Check token information and charts
3. **Trade** - Buy and sell tokens with real-time pricing
4. **Track Portfolio** - Monitor your holdings and performance
5. **Chat** - Engage with token communities

### For Developers

1. **SDK Integration** - Use the built-in Solana SDK wrapper
2. **Custom Hooks** - Leverage pre-built hooks for common operations
3. **State Management** - Access global state via Zustand stores
4. **API Client** - Use the typed API client for backend integration

## 🔌 API Integration

The platform includes a comprehensive API integration layer:

### Key Components

- **HTTP Client** (`app/lib/api.ts`) - Type-safe API wrapper
- **Zustand Stores** - Reactive state management
- **WebSocket Client** - Real-time updates via Centrifugo
- **Error Handling** - Centralized error management

## 🛠️ Development

### Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 🔧 Configuration

### Environment Variables

| Variable                     | Description                          | Required |
| ---------------------------- | ------------------------------------ | -------- |
| `NEXT_PUBLIC_API_URL`        | Backend API endpoint                 | Yes      |
| `NEXT_PUBLIC_WS_URL`         | WebSocket server URL                 | Yes      |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana network (mainnet-beta/devnet) | Yes      |
| `NEXT_PUBLIC_RPC_ENDPOINT`   | Solana RPC endpoint                  | Yes      |
| `NEXT_PUBLIC_PRIVY_APP_ID`   | Privy authentication app ID          | Yes      |

### Solana Networks

- **Mainnet**: Production environment
- **Devnet**: Development and testing
- **Testnet**: Testing environment

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository** - Link your GitHub repository
2. **Configure Environment** - Add environment variables
3. **Deploy** - Automatic deployment on push to main

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with proper TypeScript types
4. **Test your changes** thoroughly
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- Follow existing code patterns and conventions
- Add TypeScript types for all new code
- Update documentation for new features
- Test components and integration points
- Keep commits focused and descriptive

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

