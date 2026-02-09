# Chain Usage Guide

This document clarifies when to use Relay chains vs Asset Hub chains in the Polkadot Agent Kit.

## Quick Reference

| Operation Type | Chain Format | Examples |
|---------------|--------------|----------|
| **Staking Operations** | Asset Hub chains | `polkadot_asset_hub`, `westend_asset_hub`, `kusama_asset_hub`, `paseo_asset_hub` |
| **List Pools** | Relay chains | `polkadot`, `westend`, `kusama`, `paseo` |
| **Transfers** | Either format | Depends on the transfer type |
| **Swaps** | Specific DEX chain | `hydration` for Hydration DEX |

## Staking Operations (Asset Hub Required)

All nomination pool staking operations **MUST** use Asset Hub chains:

### Tools Requiring Asset Hub:
- `join_pool` - Join a nomination pool
- `bond_extra` - Bond additional tokens
- `unbond` - Start unbonding tokens
- `withdraw_unbonded` - Withdraw unbonded tokens
- `claim_rewards` - Claim staking rewards

### Examples:

```typescript
// ✅ CORRECT - Using Asset Hub chain
join_pool({
  poolId: 1,
  amount: "10",
  chain: "polkadot_asset_hub"
})

// ✅ CORRECT - Paseo Asset Hub
join_pool({
  poolId: 1,
  amount: "10",
  chain: "paseo_asset_hub"
})

// ❌ WRONG - Using relay chain
join_pool({
  poolId: 1,
  amount: "10",
  chain: "polkadot"  // Will fail!
})
```

## Pool Information (Relay Chain Required)

The `list_nomination_pools` tool queries pool data from relay chains:

### Examples:

```typescript
// ✅ CORRECT - Using relay chain
list_nomination_pools({
  chain: "paseo"
})

// ✅ CORRECT - Westend relay
list_nomination_pools({
  chain: "westend"
})

// ❌ WRONG - Using Asset Hub
list_nomination_pools({
  chain: "paseo_asset_hub"  // May not work as expected
})
```

## Network Mappings

| Relay Chain | Asset Hub Chain |
|-------------|-----------------|
| `polkadot` | `polkadot_asset_hub` |
| `kusama` | `kusama_asset_hub` |
| `westend` | `westend_asset_hub` or `west_asset_hub` |
| `paseo` | `paseo_asset_hub` |

## Common User Queries

### "Join pool #1 with 10 DOT"
```typescript
// Agent should call:
join_pool({
  poolId: 1,
  amount: "10",
  chain: "polkadot_asset_hub"  // Note: Asset Hub!
})
```

### "Join pool #1 with 10 PAS on AssetHub Paseo"
```typescript
// Agent should call:
join_pool({
  poolId: 1,
  amount: "10",
  chain: "paseo_asset_hub"  // User explicitly mentioned Asset Hub
})
```

### "List pools on Paseo"
```typescript
// Agent should call:
list_nomination_pools({
  chain: "paseo"  // Note: Relay chain!
})
```

### "Check pool #5 on Westend"
```typescript
// Agent should call:
list_nomination_pools({
  chain: "westend",  // Relay chain for listing
  poolId: 5
})
```

## Error Handling

If you get this error:
```
Staking operations are only supported on Asset Hub chains. 
The provided chain 'paseo' is not an Asset Hub chain.
```

**Solution:** Change from relay chain to Asset Hub chain:
- `paseo` → `paseo_asset_hub`
- `polkadot` → `polkadot_asset_hub`
- `westend` → `westend_asset_hub`
- `kusama` → `kusama_asset_hub`

## Why This Distinction?

**Asset Hub chains** are system parachains optimized for:
- Asset management and transfers
- Staking operations
- Cross-chain messaging (XCM)

**Relay chains** hold:
- Validator and nomination data
- Governance
- Pool metadata

This separation allows for better scalability and specialization in the Polkadot ecosystem.

## Implementation in Code

The system prompt includes these instructions:

```typescript
// From createStakingSystemPrompt.ts
`
3. CHAIN PARAMETER RULES:
   - For STAKING operations (join_pool, bond_extra, unbond, etc.): Use ASSET HUB chains
     Examples: "polkadot_asset_hub", "westend_asset_hub", "kusama_asset_hub", "paseo_asset_hub"
   - For LISTING pools (list_nomination_pools): Use RELAY chains
     Examples: "polkadot", "westend", "kusama", "paseo"
`
```

## Troubleshooting

### Issue: Agent keeps using wrong chain format

**Check:**
1. System prompt is properly configured
2. LLM model is capable (gpt-4o-mini, gpt-5-nano, llama3.1:8b recommended)
3. No custom instructions overriding the chain rules

### Issue: "Unknown error occurred" on join_pool

**Common causes:**
1. Using relay chain instead of Asset Hub chain
2. Chain API not initialized - call `ensure_chain_api` first
3. Insufficient balance
4. Pool doesn't exist or is full

**Solution:**
```typescript
// 1. Initialize chain API
await ensure_chain_api({ chainId: "paseo_asset_hub" });

// 2. Then retry staking operation
await join_pool({
  poolId: 1,
  amount: "10",
  chain: "paseo_asset_hub"
});
```

## References

- [Polkadot Wiki - Nomination Pools](https://wiki.polkadot.network/docs/learn-nomination-pools)
- [Polkadot JS Apps - Asset Hub](https://polkadot.js.org/apps/#/explorer)
- [Polkadot Agent Kit SDK](https://github.com/kodadot/polkadot-agent-kit)
