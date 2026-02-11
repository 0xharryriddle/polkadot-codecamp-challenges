# Polkadot Staking Agent 🚀

An AI-powered agent for managing Polkadot nomination pool staking operations with a beautiful chat interface.

## Features

- 🤖 **AI Chat Interface** - Natural language commands for staking operations
- 🔐 **LunoKit Integration** - Connect with Polkadot.js, SubWallet, Talisman, and Polkagate
- ⛓️ **Multi-Chain Support** - Works with Polkadot, Kusama, and Westend
- 🎯 **6 Staking Tools**:
  - Join nomination pools
  - Bond extra tokens
  - Unbond tokens
  - Withdraw unbonded funds
  - Claim staking rewards
  - Get pool information

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLET_CONNECT_ID=your_project_id_here

# Polkadot Private Key (for server-side agent operations)
# See "How to Get a Private Key" section below
POLKADOT_PRIVATE_KEY=0x...

# Optional: OpenAI API Key (for enhanced AI responses)
OPENAI_API_KEY=sk-...
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
pnpm build
pnpm start
```

## How to Get a Polkadot Private Key 🔑

### ⚠️ Important Security Notes

- **NEVER** commit real private keys to version control
- **ALWAYS** use test accounts for development
- **NEVER** use production accounts with significant funds
- Store private keys securely using environment variables

### Method 1: Using Polkadot.js Extension (Recommended for Testing)

1. **Install Polkadot.js Extension**
   - Chrome: https://chrome.google.com/webstore/detail/polkadot/mopnmbcafieddcagagdcbnhejhlodfdd
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/

2. **Create a New Account**
   - Click the extension icon
   - Click the "+" button to create a new account
   - **Select "Import account from pre-existing seed"**
   - Generate a new mnemonic seed phrase or use an existing one
   - **SAVE YOUR SEED PHRASE SECURELY**

3. **Export Private Key**
   - Click on the account you created
   - Click the three dots menu (⋮)
   - Select "Export Account"
   - Enter your password
   - Copy the JSON file content

4. **Extract Private Key from JSON**
   
   The exported JSON contains an encrypted private key. To get the raw private key:

   ```javascript
   // Using @polkadot/util-crypto
   const { cryptoWaitReady } = require('@polkadot/util-crypto');
   const { Keyring } = require('@polkadot/keyring');

   async function extractPrivateKey() {
     await cryptoWaitReady();
     const keyring = new Keyring({ type: 'sr25519' });
     
     // From mnemonic seed phrase
     const pair = keyring.addFromUri('your seed phrase here');
     console.log('Private Key:', '0x' + Buffer.from(pair.secretKey).toString('hex'));
   }
   ```

### Method 2: Using Polkadot.js Apps (Browser-Based)

1. Go to https://polkadot.js.org/apps/
2. Navigate to **Accounts → Add account**
3. Save your mnemonic seed phrase securely
4. Use the seed phrase with `@polkadot/keyring` to derive the private key

### Method 3: Programmatic Generation (For Development)

```javascript
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';

async function generateAccount() {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });
  
  // Generate a new account
  const pair = keyring.addFromUri('//Alice'); // For testing only!
  
  console.log('Address:', pair.address);
  console.log('Public Key:', pair.publicKey);
  console.log('Private Key:', '0x' + Buffer.from(pair.secretKey).toString('hex'));
}
```

### Method 4: Using Subkey Tool (Command Line)

```bash
# Install subkey
cargo install --force --git https://github.com/paritytech/substrate subkey

# Generate a new account
subkey generate

# Example output:
# Secret phrase: `word1 word2 ... word12`
# Network ID: substrate
# Secret seed: 0x...
# Public key (hex): 0x...
# Account ID: 0x...
# SS58 Address: 5...
```

## 🔐 Current Implementation Status

### Simulation Mode (Current)

The application is currently in **simulation mode**. This means:

✅ **What Works:**
- Chat interface with natural language processing
- Intent detection for staking commands
- Mock responses for all tools
- Response formatting and UI display
- Wallet connection via LunoKit

❌ **What Doesn't Execute:**
- **Real blockchain transactions** - The tools return simulated responses
- **No actual fund transfers** - No tokens are moved
- **No on-chain state changes** - Pool joins, bonds, unbonds are not executed

### Why Simulation Mode?

The current implementation uses mock tools because:

1. **Safety** - Prevents accidental fund loss during development
2. **Testing** - No need for real funds or gas fees
3. **Development Speed** - Fast iteration without blockchain delays
4. **No Private Key Required** - You can test the UI without exposing keys

### Enabling Real Transactions

To enable real blockchain transactions, you need to:

1. **Add Private Key**
   ```env
   POLKADOT_PRIVATE_KEY=0x...
   ```

2. **Update Tool Implementation**
   
   Modify the tool files in `lib/agent/tools/` to use `@polkadot/api`:

   ```typescript
   import { ApiPromise, WsProvider } from '@polkadot/api';
   import { Keyring } from '@polkadot/keyring';
   
   async function realJoinPool(poolId: number, amount: string) {
     const provider = new WsProvider('wss://rpc.polkadot.io');
     const api = await ApiPromise.create({ provider });
     
     const keyring = new Keyring({ type: 'sr25519' });
     const account = keyring.addFromUri(process.env.POLKADOT_PRIVATE_KEY!);
     
     const tx = api.tx.nominationPools.join(amount, poolId);
     const hash = await tx.signAndSend(account);
     
     return {
       success: true,
       txHash: hash.toHex(),
       // ... other data
     };
   }
   ```

3. **Add Transaction Monitoring**
   
   Track transaction status and finalization:

   ```typescript
   await tx.signAndSend(account, ({ status, events }) => {
     if (status.isInBlock) {
       console.log(`Transaction included in block ${status.asInBlock}`);
     }
     if (status.isFinalized) {
       console.log(`Transaction finalized in block ${status.asFinalized}`);
     }
   });
   ```

4. **Add Error Handling**
   
   Handle transaction failures, insufficient balance, etc.

## Example Commands

Try these natural language commands in the chat:

```
Join pool #1 with 10 DOT
Bond extra 5 DOT from my free balance
Unbond 3 DOT
Withdraw my unbonded funds
Claim my staking rewards
Get info about pool #1
What are the pools on Kusama?
Bond 2 KSM from my rewards
```

## Tool Details

### 1. Join Pool
Joins a nomination pool with specified tokens.

**Command:** "Join pool #1 with 10 DOT"

**Parameters:**
- `poolId` - Pool identifier (number)
- `amount` - Amount to bond (e.g., "10 DOT", "5.5 KSM")
- `chain` - Target chain (polkadot, kusama, westend)

### 2. Bond Extra
Adds more tokens to your existing pool stake.

**Command:** "Bond extra 5 DOT"

**Parameters:**
- `amount` - Additional amount to bond
- `bondType` - Source: "FreeBalance" or "Rewards"
- `chain` - Target chain

### 3. Unbond
Starts the unbonding period for tokens.

**Command:** "Unbond 3 DOT"

**Parameters:**
- `amount` - Amount to unbond
- `chain` - Target chain

**Note:** Unbonded funds have a waiting period (28 days on Polkadot) before withdrawal.

### 4. Withdraw Unbonded
Withdraws tokens after the unbonding period.

**Command:** "Withdraw unbonded funds"

**Parameters:**
- `chain` - Target chain

### 5. Claim Rewards
Claims accumulated staking rewards.

**Command:** "Claim my rewards"

**Parameters:**
- `chain` - Target chain

### 6. Get Pool Info
Retrieves detailed information about a pool.

**Command:** "Get info about pool #1"

**Parameters:**
- `poolId` - Pool identifier
- `chain` - Target chain

## Technology Stack

- **Next.js 15.4** - React framework with App Router
- **LunoKit** - Polkadot wallet integration
- **@polkadot/api** - Substrate chain interaction
- **Zod** - Schema validation
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── chat/         # Chat endpoint
│   │   └── tools/        # Direct tool execution
│   ├── page.tsx          # Main page
│   ├── layout.tsx        # Root layout
│   └── providers.tsx     # LunoKit provider config
├── components/            # React components
│   ├── ChatInterface.tsx # Chat UI
│   ├── WalletStatus.tsx  # Wallet connection
│   ├── ChainInfo.tsx     # Chain information
│   └── ToolsPanel.tsx    # Available tools list
├── lib/                   # Core logic
│   └── agent/            # Agent implementation
│       ├── index.ts      # Main agent module
│       ├── utils.ts      # Tool utilities
│       └── tools/        # Individual tool implementations
│           ├── join-pool.ts
│           ├── bond-extra.ts
│           ├── unbond.ts
│           ├── withdraw-unbonded.ts
│           ├── claim-rewards.ts
│           └── get-pool-info.ts
└── public/               # Static assets
```

## Development Notes

### Adding New Tools

1. Create a new tool file in `lib/agent/tools/`
2. Define the Zod schema for arguments
3. Implement the tool logic
4. Export using `createToolAction()`
5. Add to `lib/agent/index.ts`
6. Update intent detection in `app/api/chat/route.ts`

### Customizing Response Format

Edit the `formatToolResult()` function in `app/api/chat/route.ts` to customize how tool results are displayed.

### Adding More Chains

Update the chains array in `app/providers.tsx` to add support for more Substrate-based chains.

## Troubleshooting

### Issue: Build Fails with WebAssembly Errors

**Solution:** The project has been configured to avoid heavy WASM dependencies. If you add new packages that use WASM, you may need to update `next.config.ts`.

### Issue: Wallet Not Connecting

**Solution:** 
1. Ensure you have a Polkadot wallet extension installed
2. Check that WalletConnect ID is configured if using WalletConnect
3. Try refreshing the page and reconnecting

### Issue: Tool Execution Returns Simulation Data

**Solution:** This is expected behavior in the current implementation. See the "Enabling Real Transactions" section above to implement actual blockchain interactions.

### Issue: Type Errors with LunoKit

**Solution:** The project uses specific versions of LunoKit packages that have been tested. Avoid upgrading without testing.

## Security Best Practices

1. **Never** hardcode private keys in source code
2. **Never** commit `.env` file to version control
3. **Always** use test accounts for development
4. **Always** validate user inputs before executing transactions
5. **Always** implement proper error handling for transaction failures
6. **Consider** using hardware wallets for production
7. **Consider** implementing transaction limits and rate limiting
8. **Consider** adding multi-signature requirements for large transactions

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Resources

- [Polkadot Documentation](https://wiki.polkadot.network/)
- [Nomination Pools](https://wiki.polkadot.network/docs/learn-nomination-pools)
- [@polkadot/api Documentation](https://polkadot.js.org/docs/api/)
- [LunoKit Documentation](https://github.com/dedotdev/luno-kit)
