# zBlog - Encrypted Blog Platform

[![License](https://img.shields.io/badge/License-BSD%203--Clause--Clear-blue.svg)](LICENSE)
[![FHEVM](https://img.shields.io/badge/FHEVM-v0.8-green.svg)](https://docs.zama.ai/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

zBlog is a fully encrypted blog platform built on FHEVM (Fully Homomorphic Encryption Virtual Machine) technology, enabling complete privacy protection for content creation and sharing.

## 🔐 Key Features

- **Complete Encryption**: All content encrypted using FHEVM technology
- **Permission Management**: Support for public, friends, specific users, and paid access levels
- **Privacy Statistics**: Authors can decrypt view counts and engagement metrics
- **Category Management**: Support for 10 different blog categories
- **Mock Mode**: Local development with @fhevm/mock-utils
- **Live Deployment**: Real FHEVM integration on Sepolia testnet

## 🎯 Live Demo

- **GitHub Repository**: https://github.com/sarugmaklp8/zblog-fhevm-demo
- **Sepolia Contract**: [0x7816D51427c5Fa663425Bdb7c86361BD2d0a244B](https://sepolia.etherscan.io/address/0x7816D51427c5Fa663425Bdb7c86361BD2d0a244B#code)

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- MetaMask wallet
- Sepolia ETH (for testnet usage)

### Installation
```bash
# Clone repository
git clone https://github.com/sarugmaklp8/zblog-fhevm-demo.git
cd zblog-fhevm-demo

# Install smart contract dependencies
cd fhevm-hardhat-template && npm install

# Install frontend dependencies  
cd ../frontend && npm install
```

### Development Mode
```bash
# Start local Hardhat node
cd fhevm-hardhat-template
npx hardhat node --verbose

# Deploy contracts (new terminal)
npx hardhat deploy --network localhost

# Start frontend in mock mode
cd ../frontend
npm run dev:mock
# Visit: http://localhost:3000
```

### Production Mode (Sepolia)
```bash
# Generate ABI files
cd frontend
npm run genabi

# Start frontend
npm run dev
# Visit: http://localhost:3000
# Switch MetaMask to Sepolia network
```

## 🏗️ Architecture

### Smart Contracts (FHEVM)
- **Location**: `fhevm-hardhat-template/contracts/ZBlog.sol`
- **Features**: Encrypted blog data, permission control, statistics
- **Technology**: Solidity + FHEVM v0.8

### Frontend Application (Next.js)
- **Location**: `frontend/`
- **Tech Stack**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **FHEVM Integration**: @zama-fhe/relayer-sdk for encryption interactions

## 🔧 Usage

### Creating Blog Posts
1. Connect MetaMask wallet
2. Switch to "Create Post" tab
3. Enter article content
4. Select category, access level, and price
5. Click "Create Post" to encrypt and publish

### Reading Posts
1. View posts in "My Posts" tab
2. Click "📄 View Details" for full article view
3. Click "🔓 Decrypt Content" to decrypt and read content
4. Use "👁️ View" and "❤️ Like" for interactions

### Access Management
1. Switch to "Manage Access" tab
2. Enter post ID and reader address
3. Click "Grant Access" to authorize specific users

## 🔐 FHEVM Integration

### Text Encryption Process
```typescript
// 1. Encode text to numeric parts
const encodedContent = encodeTextToParts(content);

// 2. Create encrypted inputs
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add32(encodedContent.part1);
input.add32(encodedContent.part2);
input.add32(encodedContent.part3);
input.add32(encodedContent.length);

// 3. Encrypt and submit
const encryptedInput = await input.encrypt();
await contract.createPost(...encryptedInput.handles, encryptedInput.inputProof);
```

### Decryption Process
```typescript
// 1. Get encrypted data from contract
const [encPart1, encPart2, encPart3, encLength] = await contract.getEncryptedContent(postId);

// 2. Create decryption signature
const sig = await FhevmDecryptionSignature.loadOrSign(...);

// 3. Decrypt values
const results = await instance.userDecrypt([...], sig.privateKey, ...);

// 4. Reconstruct original text
const decodedText = decodeTextFromParts(results[...]);
```

## 🌐 Network Support

### Localhost (Chain ID: 31337)
- **Purpose**: Development and testing
- **FHEVM**: Mock mode using @fhevm/mock-utils
- **Speed**: Instant transactions
- **Cost**: Free

### Sepolia (Chain ID: 11155111)  
- **Purpose**: Testnet deployment
- **FHEVM**: Real FHEVM Relayer services
- **Speed**: 15-30 seconds per transaction
- **Cost**: Sepolia ETH required

## 📁 Project Structure

```
zblog-fhevm-demo/
├── fhevm-hardhat-template/          # Smart contract development
│   ├── contracts/ZBlog.sol         # Main zBlog contract
│   ├── deploy/deployZBlog.ts       # Deployment script
│   ├── tasks/ZBlog.ts              # Hardhat CLI tasks
│   └── test/                       # Contract tests
├── frontend/                        # Next.js frontend
│   ├── components/ZBlogDemo.tsx    # Main UI component
│   ├── components/PostDetail.tsx   # Article detail modal
│   ├── hooks/useZBlog.tsx          # Contract interaction hooks
│   ├── abi/                        # Generated contract ABIs
│   ├── fhevm/                      # FHEVM integration logic
│   └── utils/                      # Text encoding utilities
└── docs/                           # Documentation
```

## 🛠️ Available Commands

### Smart Contract Commands
```bash
cd fhevm-hardhat-template

# Compile contracts
npx hardhat compile

# Deploy to localhost
npx hardhat deploy --network localhost

# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Check total posts
npx hardhat zblog:get-total-posts --contract 0x7816D51427c5Fa663425Bdb7c86361BD2d0a244B --network sepolia
```

### Frontend Commands
```bash
cd frontend

# Development with mock FHEVM
npm run dev:mock

# Development with real FHEVM
npm run dev

# Build static files
npm run build:static

# Generate contract ABIs
npm run genabi
```

## 🔍 Security Features

- **Complete Privacy**: All sensitive data encrypted with FHEVM
- **Access Control**: Granular permissions for each post
- **Decentralized**: Data stored immutably on blockchain
- **Client-side Decryption**: No server can access private content
- **Cryptographic Proofs**: All operations verifiable

## 📊 Technical Details

### Encryption Capabilities
- **Text Content**: First 12 characters encrypted on-chain
- **Statistics**: Views, likes encrypted
- **Categories**: Post categories encrypted
- **Permissions**: Access rights encrypted

### Storage Architecture
- **On-chain**: Encrypted metadata and permissions
- **IPFS Ready**: Architecture supports IPFS for full content
- **Local Cache**: Optimized user experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Zama](https://zama.ai/) for FHEVM technology
- [Hardhat](https://hardhat.org/) for development framework
- [Next.js](https://nextjs.org/) for frontend framework

## 📚 Learn More

- [FHEVM Documentation](https://docs.zama.ai/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**zBlog** - Privacy-first content creation in the Web3 era 🔐✍️
