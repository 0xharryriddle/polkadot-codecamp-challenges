/**
 * Test Examples for Polkadot Agent Tools
 *
 * This file contains example commands you can use to test each tool.
 * Copy these commands into the chat interface or use the test API endpoint.
 */

// ===========================
// STAKING TOOLS
// ===========================

/**
 * 1. JOIN POOL
 * Join a nomination pool to start staking
 */
const joinPoolExamples = [
  "Join pool #1 with 10 DOT",
  "I want to join pool 5 with 25 DOT on Polkadot",
  "Add me to pool number 3 with 50 DOT",
  "Join kusama pool 1 with 5 KSM",
];

/**
 * 2. BOND EXTRA
 * Add more tokens to your existing stake
 */
const bondExtraExamples = [
  "Bond extra 5 DOT to my stake",
  "Add 10 more DOT from my free balance",
  "Bond 3 DOT from my rewards",
  "Compound my rewards by bonding them",
];

/**
 * 3. UNBOND
 * Start the unbonding process (28 days on Polkadot)
 */
const unbondExamples = [
  "Unbond 10 DOT from my pool",
  "I want to unbond 5 DOT",
  "Remove 15 DOT from staking",
  "Start unbonding 3 KSM on Kusama",
];

/**
 * 4. WITHDRAW UNBONDED
 * Withdraw tokens after unbonding period completes
 */
const withdrawExamples = [
  "Withdraw my unbonded funds",
  "Withdraw unbonded tokens",
  "Get my unbonded DOT back",
  "Withdraw from Kusama",
];

/**
 * 5. CLAIM REWARDS
 * Claim your accumulated staking rewards
 */
const claimRewardsExamples = [
  "Claim my staking rewards",
  "Claim rewards",
  "Get my rewards from the pool",
  "Claim my Kusama rewards",
];

/**
 * 6. GET POOL INFO
 * Research pool information before joining
 */
const getPoolInfoExamples = [
  "Get information about pool #1",
  "Show me details for pool 5",
  "What's the status of pool 3?",
  "Check pool 10 on Kusama",
];

// ===========================
// SWAP TOOLS
// ===========================

/**
 * 7. SWAP TOKENS
 * Execute XCM cross-chain token swaps
 */
const swapTokensExamples = [
  // DOT to Stablecoins
  "Swap 10 DOT for USDT on Hydration",
  "Exchange 5 DOT to USDC",
  "Convert 20 DOT to DAI with 2% slippage",

  // Stablecoins to DOT
  "Swap 100 USDT for DOT",
  "Exchange 50 USDC to DOT on Hydration",

  // DOT to other tokens
  "Swap 15 DOT for HDX",
  "Exchange 10 DOT to ASTR",

  // Stablecoin swaps
  "Swap 100 USDT for USDC",
  "Convert 50 DAI to USDT",

  // With custom slippage
  "Swap 10 DOT to USDT with 0.5% slippage",
  "Exchange 100 USDT for DOT with 3% slippage tolerance",
];

// ===========================
// COMPLEX WORKFLOWS
// ===========================

/**
 * COMPOUND REWARDS WORKFLOW
 * Claim rewards → Bond them back to increase stake
 */
const compoundWorkflow = [
  "Claim my rewards",
  // Then after seeing rewards:
  "Bond my rewards to compound them",
];

/**
 * LIQUIDITY MANAGEMENT WORKFLOW
 * Research → Join → Monitor → Claim
 */
const liquidityWorkflow = [
  "Show me information about pool #1",
  // After researching:
  "Join pool #1 with 20 DOT",
  // Later:
  "Claim my rewards from the pool",
  // Optionally:
  "Bond extra 10 DOT from rewards",
];

/**
 * EXIT WORKFLOW
 * Unbond → Wait 28 days → Withdraw
 */
const exitWorkflow = [
  "Unbond 15 DOT from my pool",
  // Wait 28 days on Polkadot, then:
  "Withdraw my unbonded funds",
];

/**
 * SWAP & STAKE WORKFLOW
 * Swap stablecoins → Stake DOT
 */
const swapAndStakeWorkflow = [
  "Swap 100 USDT for DOT on Hydration",
  // After swap completes:
  "Join pool #1 with 10 DOT",
];

// ===========================
// EXPORT FOR USE
// ===========================

export const testExamples = {
  staking: {
    join_pool: joinPoolExamples,
    bond_extra: bondExtraExamples,
    unbond: unbondExamples,
    withdraw_unbonded: withdrawExamples,
    claim_rewards: claimRewardsExamples,
    get_pool_info: getPoolInfoExamples,
  },
  swap: {
    swap_tokens: swapTokensExamples,
  },
  workflows: {
    compound: compoundWorkflow,
    liquidity: liquidityWorkflow,
    exit: exitWorkflow,
    swap_and_stake: swapAndStakeWorkflow,
  },
};

// ===========================
// USAGE INSTRUCTIONS
// ===========================

/**
 * HOW TO USE THESE EXAMPLES:
 *
 * 1. **In Chat Interface:**
 *    - Copy any example command above
 *    - Paste it into the chat interface
 *    - Press Enter to execute
 *
 * 2. **Via API:**
 *    ```bash
 *    curl -X POST http://localhost:3000/api/chat \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "messages": [
 *          {"role": "user", "content": "Join pool #1 with 10 DOT"}
 *        ]
 *      }'
 *    ```
 *
 * 3. **Test Sequence:**
 *    - Start with get_pool_info to research
 *    - Use join_pool to start staking
 *    - Regularly claim_rewards
 *    - Use bond_extra to compound
 *    - Try swap_tokens for DeFi operations
 *
 * 4. **Safety Tips:**
 *    - Start with small amounts
 *    - Test on Westend testnet first
 *    - Understand unbonding periods
 *    - Check pool information before joining
 *    - Verify slippage for large swaps
 */

export default testExamples;
