# VoicePay - Voice-Controlled Blockchain Micropayments

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/voicepay)

VoicePay is a revolutionary PWA that enables users to send and receive blockchain-backed micropayments through voice commands. Built with React, TypeScript, and powered by Algorand blockchain.

## 🚀 Features

- **Voice Commands**: Send money using natural language voice commands
- **Blockchain Security**: Powered by Algorand for fast, secure transactions
- **AI Assistant**: Tavus video avatar for balance and spending queries
- **Custodial Wallet**: Automatic wallet creation with encrypted seed storage
- **Monetization**: RevenueCat integration with Pro upgrade paywall
- **PWA Ready**: Offline-capable Progressive Web App
- **Mobile First**: Responsive design optimized for mobile devices

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons
- **React Query** for data fetching
- **Zustand** for state management

### Backend & Services
- **Supabase** (Postgres with RLS)
- **Algorand JS SDK** for blockchain integration
- **ElevenLabs API** for text-to-speech
- **Web Speech API** for speech recognition
- **Tavus API** for AI video avatar
- **RevenueCat** for subscription management

### Deployment
- **Netlify** for hosting
- **GitHub Actions** for CI/CD

## 📱 Core Features

### Voice Send Flow
1. User presses and holds the mic button
2. Says "send 2 dollars to Alice"
3. App parses intent and converts USD to µAlgos
4. Executes blockchain transaction
5. Provides voice confirmation

### Onboarding
- Email/password authentication via Supabase
- Automatic Algorand wallet creation
- Seed phrase encrypted with Supabase Vault

### Dashboard
- Real-time balance display
- Last 5 transactions
- Voice-activated send/receive buttons
- AI assistant integration

### Paywall
- $10 limit for free users
- RevenueCat integration for Pro upgrades
- Higher send limits for Pro users

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Algorand testnet access

### Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
VITE_TAVUS_API_KEY=your_tavus_key
VITE_REVENUECAT_API_KEY=your_revenuecat_key
VITE_ALGORAND_NODE_URL=https://testnet-api.algonode.cloud
VITE_ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud
VITE_ALGORAND_NODE_TOKEN=
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/voicepay.git
cd voicepay

# Install dependencies
npm install

# Start development server
npm run dev
```

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `schema.sql`
3. Enable Row Level Security
4. Configure authentication settings

### Algorand Testnet Setup

1. The app uses Algorand testnet by default
2. Testnet tokens can be obtained from the [Algorand Dispenser](https://testnet.algoexplorer.io/dispenser)
3. No additional setup required for testnet

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run linting
npm run lint
```

### Test Coverage

The project includes comprehensive tests for:
- Algorand service functions
- Voice intent parser
- Authentication flows
- Transaction handling

## 📦 Building for Production

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

## 🚀 Deployment

### Netlify (Recommended)

1. Click the "Deploy to Netlify" button above
2. Connect your GitHub repository
3. Set environment variables in Netlify dashboard
4. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy the dist folder to your hosting provider
```

## 🔧 Configuration

### PWA Configuration

The app is configured as a PWA with:
- Service worker for offline functionality
- Web app manifest for installation
- Caching strategies for optimal performance

### Voice Recognition

- Uses Web Speech API for speech-to-text
- Fallback to manual input if not supported
- Supports natural language commands

### Blockchain Integration

- Algorand testnet for development
- Mainnet ready for production
- Automatic wallet creation and management

## 📚 API Documentation

### Voice Commands

Supported voice commands:
- `"send [amount] dollars to [recipient]"`
- `"check my balance"`
- `"show my transaction history"`
- `"show my receive address"`

### Algorand Integration

Key functions:
- `createWallet()` - Generate new wallet
- `sendPayment()` - Send ALGO transaction
- `getBalance()` - Check wallet balance
- `getTransactionHistory()` - Fetch transaction history

## 🔒 Security

- Private keys encrypted with Supabase Vault
- Row Level Security (RLS) enabled
- HTTPS enforced in production
- No sensitive data in localStorage

## 🎯 Roadmap

- [ ] Multi-language voice support
- [ ] Additional blockchain networks
- [ ] Advanced voice commands
- [ ] Social payment features
- [ ] Merchant integration
- [ ] Advanced analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🙏 Acknowledgments

- Algorand Foundation for blockchain infrastructure
- Supabase for backend services
- ElevenLabs for voice synthesis
- Tavus for AI avatar technology
- RevenueCat for subscription management

---

Built with ❤️ using [Bolt.new](https://bolt.new)