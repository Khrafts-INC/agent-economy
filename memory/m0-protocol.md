# M0 Protocol - Technical Understanding

*Last updated: 2026-01-30*

## Overview

M0 is an EVM-compatible, immutable protocol for minting/burning the **$M** stablecoin. Key features:
- **Multi-issuance model** - Multiple minters can mint $M against collateral
- **Yield-bearing** - $M earners receive yield via continuous indexing
- **Two Token Governance (TTG)** - $ZERO token holders govern the protocol
- **Natively multichain** - Same yield capabilities across chains

## Core Contracts (protocol repo)

### MToken.sol - "M is for Money"
- ERC20 token with **6 decimals**
- **Continuous indexing** for yield accrual
- Two types of holders:
  - **Earners**: Approved by TTG, receive yield, balance stored as principal
  - **Non-earners**: Standard balance, no yield
- Only MinterGateway can mint/burn
- Functions: `startEarning()`, `stopEarning()`, `mint()`, `burn()`

### MinterGateway.sol - "Where money is born"
- Controls all minting/burning of $M
- **Minters** deposit collateral and propose mints
- **Validators** approve mints with signatures
- Key mechanics:
  - Mint proposals with delay
  - Collateral tracking and retrieval
  - Penalty and freeze mechanisms
  - Owed M tracking (principal-based for active minters)
- Governed by TTG Registrar

### Rate Models
- **EarnerRateModel**: Calculates safe earner rate based on total owed M vs earning supply
- **MinterRateModel**: Rate charged to minters on their owed M

### TTG Registrar
- Stores all governance-approved parameters
- Manages lists: approved minters, validators, earners
- Source of truth for protocol configuration

## M Extensions (evm-m-extensions repo)

Framework for wrapped $M variants that handle yield differently:

### Extension Types

| Extension | Yield Distribution | Key Features |
|-----------|-------------------|--------------|
| **MYieldToOne** | All to single recipient | Blacklist support, handles earner status loss |
| **MYieldToOneForcedTransfer** | Same as above | + Forced transfers for compliance/recovery |
| **MEarnerManager** | Redistributed to all holders | Whitelist enforced, per-address fee rate |
| **MYieldFee** | Same rate to all users | Global fee rate, claim recipient redirection |
| **MSpokeYieldFee** | For sidechains | Index updates via bridging, external rate oracle |
| **JMIExtension** | All to single recipient | "Just Mint It" - accepts $M or other collateral |

### SwapFacility
- **Exclusive router** for all wrap/unwrap/swap operations
- `swap()` - Switch between extensions
- `swapInM()` - Wrap $M into extension
- `swapOutM()` - Unwrap to $M (whitelisted only)

### UniswapV3SwapAdapter
- Helper for Uniswap V3 swaps
- Multi-hop path support
- Token whitelist controlled by admin

## M Portal Lite (m-portal-lite repo)

Cross-chain bridging using Hyperlane - makes $M natively multichain.

### Architecture: Hub-and-Spoke

```
                    ┌─────────────┐
                    │  Ethereum   │
                    │  (Hub)      │
                    │  HubPortal  │
                    └──────┬──────┘
                           │ Hyperlane
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │Arbitrum │       │Optimism │       │  Base   │
   │SpokePort│       │SpokePort│       │SpokePort│
   └─────────┘       └─────────┘       └─────────┘
```

### HubPortal (Ethereum)
- **Lock-and-release** mechanism
- Locks $M when bridging out, releases when bridging back
- Propagates:
  - M token earning index
  - TTG Registrar values
  - List statuses (earners, etc.)
- Tracks `bridgedPrincipal` per spoke chain

### SpokePortal (L2s/Sidechains)
- **Mint-and-burn** mechanism
- Mints spoke $M when receiving from Hub
- Burns spoke $M when sending to Hub
- Receives and applies:
  - Index updates
  - Registrar key updates
  - List status updates
- **Cannot bridge between spokes** - must go through Hub

### HyperlaneBridge
- Uses Hyperlane protocol for cross-chain messaging
- Handles message encoding/decoding
- Quote system for gas fees

### Key Functions
- `sendMTokenIndex()` - Propagate current index to spoke
- `sendRegistrarKey()` - Propagate governance parameter
- `sendRegistrarListStatus()` - Propagate list membership

## Integration Points (Khrafts' domain)

As Integrations Engineer, key areas:

1. **Extension Integration**
   - Partners choosing which yield model fits their use case
   - SwapFacility integration for wrapping/unwrapping
   - Whitelist/blacklist management

2. **Cross-chain Integration**
   - Setting up portal deployments on new chains
   - Index propagation timing
   - Gas fee management for cross-chain messages

3. **DeFi Integration**
   - UniswapV3SwapAdapter for DEX integration
   - Composability with non-rebasing wrappers
   - Yield claiming mechanisms

## Implementation Details

### Protocol Contract Patterns
- **ContinuousIndexing**: Abstract contract for yield accrual math
- **ContinuousIndexingMath**: Library for index calculations
- **TTGRegistrarReader**: Helper to read governance parameters
- **ERC712Extended**: For typed signatures (validator collateral updates)

### Extension Contract Patterns
- **Upgradeable proxies** (ERC7201 storage layout)
- **Hook system**: `_beforeWrap`, `_beforeUnwrap`, `_beforeTransfer`, `_beforeApprove`
- **Freezable**: Account freeze capability for compliance
- **Pausable**: Emergency pause functionality
- **ReentrancyLock**: Protection on SwapFacility

### MYieldToOne Implementation
```solidity
// All yield goes to single yieldRecipient
function claimYield() → transfers excess $M to yieldRecipient
function yield() → balance(this) - totalSupply (the delta is yield)

// Roles:
YIELD_RECIPIENT_MANAGER_ROLE - can change yield recipient
DEFAULT_ADMIN_ROLE - full admin
```

### Portal Message Types (PayloadType enum)
1. **Transfer**: Token bridging
2. **Index**: $M earning index propagation
3. **Key**: Registrar key/value propagation
4. **List**: List membership updates (earners, etc.)

### Cross-Chain Flow Example
```
User on Ethereum wants $M on Arbitrum:
1. User calls HubPortal.sendM(arbitrumChainId, amount, recipient)
2. HubPortal locks $M, calculates principal, encodes payload
3. HyperlaneBridge sends message to Arbitrum
4. SpokePortal receives, updates index if needed
5. SpokePortal mints spoke $M to recipient
```

## Deployed Addresses (Mainnet)

- **$M Token**: `0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b`
- **Wrapped M Token**: `0x437cc33344a0B27A429f795ff6B469C72698B291`
- **Registrar**: `0x119FbeeDD4F4f4298Fb59B720d5654442b81ae2c`

## Supported Chains

**Mainnet:**
- Ethereum (1) - Hub
- Arbitrum (42161)
- Optimism (10)
- Base (8453)
- BSC (56)
- Plume (98866)
- Mantra (5888)
- Soneium (1868)
- Sei (1329)
- And more...

**Testnet:**
- Sepolia (11155111)
- Arbitrum Sepolia (421614)
- Optimism Sepolia (11155420)
- Base Sepolia (84532)

## Deployment Patterns

### CREATE3 Deterministic Addresses
Uses **CreateX Factory** (`0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed`) for deterministic deployments across all chains.

**Salt computation:**
```solidity
function _computeSalt(address deployer_, string memory contractName_) internal pure returns (bytes32) {
    return bytes32(
        abi.encodePacked(
            bytes20(deployer_),           // permissioned deploy protection
            bytes1(0),                     // disable cross-chain redeploy protection  
            bytes11(keccak256(bytes(contractName_)))
        )
    );
}
```

**Predicted address verification:**
```solidity
// Set PREDICTED_ADDRESS env var, then deploy script verifies:
address computedAddress = _getCreate3Address(deployer, _computeSalt(deployer, contractName));
require(computedAddress == predictedAddress, "Address mismatch!");
```

### Persisted Addresses (`deployments/`)
Each repo maintains `deployments/{chainId}.json` files:

**evm-m-extensions:**
```json
{
  "extensionAddresses": ["0x...", "0x..."],
  "extensionNames": ["MEarnerManager", "MYieldToOne"],
  "swapAdapter": "0x...",
  "swapFacility": "0x..."
}
```

**m-portal-lite:**
```json
{
  "bridge": "0x...",
  "m_token": "0x...",
  "portal": "0x...",
  "registrar": "0x...",
  "vault": "0x...",
  "wrapped_m": "0x..."
}
```

### Deployment Flow
1. **Compute predicted address** using deployer + contractName salt
2. **Verify** against `PREDICTED_ADDRESS` env var (optional)
3. **Deploy** via `_deployCreate3()` or `_deployCreate3TransparentProxy()`
4. **Persist** to `deployments/{chainId}.json` via `_writeDeployment()`
5. **Read** in future scripts via `_readDeployment()` or `_getSwapFacility()`

### Cross-Chain Consistency
- Same deployer address = same contract addresses across chains
- SwapFacility: `0xB6807116b3B1B321a390594e31ECD6e0076f6278` (all chains)
- SwapAdapter: `0x023bd2F0A95373C55FC8D1c5F8e60cC3B9Bc4f4b` (all chains)

## Extension Config Patterns

Each extension deployment needs:
```solidity
struct YieldToOneConfig {
    string contractName;      // For salt computation
    string extensionName;     // ERC20 name
    string symbol;            // ERC20 symbol
    address yieldRecipient;   // Where yield goes
    address admin;            // DEFAULT_ADMIN_ROLE
    address freezeManager;    // FREEZE_MANAGER_ROLE
    address yieldRecipientManager; // Can change recipient
    address pauser;           // PAUSER_ROLE
}
```

## Useful Links

- Protocol: https://github.com/m0-foundation/protocol
- EVM Extensions: https://github.com/m0-foundation/evm-m-extensions  
- Portal Lite: https://github.com/m0-foundation/m-portal-lite
- TTG: https://github.com/m0-foundation/ttg
- Wrapped M Token: https://github.com/m0-foundation/wrapped-m-token
