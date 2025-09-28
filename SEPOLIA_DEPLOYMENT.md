# zBlog Sepolia Testnet Deployment

## ✅ Deployment Successful!

zBlog has been successfully deployed to Sepolia testnet with full verification.

### 📄 Contract Information

**ZBlog Contract**:
- **Address**: `0x7816D51427c5Fa663425Bdb7c86361BD2d0a244B`
- **Network**: Sepolia Testnet (Chain ID: 11155111)
- **Verification**: ✅ Verified on Etherscan
- **Explorer**: https://sepolia.etherscan.io/address/0x7816D51427c5Fa663425Bdb7c86361BD2d0a244B#code

**FHECounter Contract** (for reference):
- **Address**: `0xb430aA98707cE449f014f1F029279aB56D934774`
- **Network**: Sepolia Testnet (Chain ID: 11155111)

### 🔧 How to Use Sepolia Network

#### 1. **Switch MetaMask to Sepolia**
- Open MetaMask
- Click network dropdown (currently showing "Localhost 8545" or similar)
- Select "Sepolia test network"
- Or add manually:
  - **Network Name**: Sepolia test network
  - **RPC URL**: https://sepolia.infura.io/v3/78e2c8be8a32466cae545f06ebc780c1
  - **Chain ID**: 11155111
  - **Currency Symbol**: SepoliaETH
  - **Block Explorer**: https://sepolia.etherscan.io

#### 2. **Get Sepolia ETH**
You'll need Sepolia ETH for transactions:
- **Faucet 1**: https://sepoliafaucet.com/
- **Faucet 2**: https://www.alchemy.com/faucets/ethereum-sepolia
- **Faucet 3**: https://sepolia-faucet.pk910.de/

#### 3. **Use zBlog on Sepolia**
- Visit: http://localhost:3000
- Connect MetaMask (make sure you're on Sepolia network)
- The app will automatically detect Sepolia and use the correct contract address
- Create encrypted blog posts on the real testnet!

### 🌟 **Advantages of Using Sepolia**

- ✅ **Real Blockchain**: Experience real blockchain interactions
- ✅ **Real FHEVM**: Connect to actual FHEVM Relayer services
- ✅ **Persistence**: Your posts persist across sessions
- ✅ **Shareable**: Others can access your posts with proper permissions
- ✅ **Verified Contract**: Code is publicly verified on Etherscan

### 📊 **Testing on Sepolia**

```bash
# Check total posts on Sepolia
cd fhevm-hardhat-template
npx hardhat zblog:get-total-posts --contract 0x7816D51427c5Fa663425Bdb7c86361BD2d0a244B --network sepolia

# Check your posts (replace with your address)
npx hardhat zblog:get-user-posts --contract 0x7816D51427c5Fa663425Bdb7c86361BD2d0a244B --user 0xYourAddress --network sepolia

# Grant access to another user
npx hardhat zblog:grant-access --contract 0x7816D51427c5Fa663425Bdb7c86361BD2d0a244B --postid 1 --reader 0xReaderAddress --network sepolia
```

### ⚠️ **Important Notes**

1. **Testnet ETH Required**: You need Sepolia ETH for transactions
2. **Transaction Speed**: Sepolia transactions take longer than local (15-30 seconds)
3. **Real Costs**: Each transaction uses real testnet ETH
4. **FHEVM Relayer**: Uses real FHEVM Relayer services, not mock

### 🔄 **Switch Between Networks**

The frontend automatically detects which network you're connected to:
- **Localhost (31337)**: Uses mock FHEVM for fast development
- **Sepolia (11155111)**: Uses real FHEVM Relayer services

### 🎯 **Current Deployment Status**

- ✅ **Localhost**: Ready for development
- ✅ **Sepolia**: Ready for testnet usage
- 🔄 **Frontend**: Supports both networks automatically

---

**🎉 Your zBlog is now live on Sepolia testnet!**

Try switching your MetaMask to Sepolia and experience real FHEVM encryption on a live blockchain network!
