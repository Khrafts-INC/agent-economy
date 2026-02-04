// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title USDCEscrow
 * @author Oded (Agent Economy)
 * @notice Escrow contract for agent-to-agent USDC transactions
 * @dev Designed for Circle USDC Hackathon - Agentic Commerce track
 * 
 * Flow:
 * 1. Client agent creates escrow, locking USDC
 * 2. Provider agent delivers service
 * 3. Client releases funds OR dispute triggers timeout
 * 4. After timeout, provider can claim if client doesn't act
 */
contract USDCEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State ============
    
    IERC20 public immutable usdc;
    
    struct Escrow {
        address client;      // Agent paying for service
        address provider;    // Agent providing service
        uint256 amount;      // USDC amount (6 decimals)
        uint256 createdAt;
        uint256 deadline;    // Provider can claim after this if client MIA
        string serviceId;    // Reference to Agent Economy service
        EscrowStatus status;
    }
    
    enum EscrowStatus {
        Active,
        Released,    // Client released to provider
        Refunded,    // Client got refund (provider no-show)
        Claimed      // Provider claimed after timeout
    }
    
    mapping(bytes32 => Escrow) public escrows;
    
    // ============ Events ============
    
    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed client,
        address indexed provider,
        uint256 amount,
        string serviceId,
        uint256 deadline
    );
    
    event EscrowReleased(bytes32 indexed escrowId, address indexed provider, uint256 amount);
    event EscrowRefunded(bytes32 indexed escrowId, address indexed client, uint256 amount);
    event EscrowClaimed(bytes32 indexed escrowId, address indexed provider, uint256 amount);
    
    // ============ Errors ============
    
    error EscrowNotFound();
    error EscrowNotActive();
    error NotClient();
    error NotProvider();
    error DeadlineNotReached();
    error DeadlinePassed();
    error InvalidAmount();
    error InvalidDeadline();
    
    // ============ Constructor ============
    
    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create an escrow for an agent service
     * @param provider Address of the service provider agent
     * @param amount USDC amount to escrow (6 decimals)
     * @param serviceId Reference to Agent Economy service listing
     * @param timeoutSeconds Seconds until provider can claim if client MIA
     * @return escrowId Unique identifier for this escrow
     */
    function createEscrow(
        address provider,
        uint256 amount,
        string calldata serviceId,
        uint256 timeoutSeconds
    ) external nonReentrant returns (bytes32 escrowId) {
        if (amount == 0) revert InvalidAmount();
        if (timeoutSeconds < 1 hours || timeoutSeconds > 30 days) revert InvalidDeadline();
        
        escrowId = keccak256(abi.encodePacked(
            msg.sender,
            provider,
            amount,
            serviceId,
            block.timestamp
        ));
        
        escrows[escrowId] = Escrow({
            client: msg.sender,
            provider: provider,
            amount: amount,
            createdAt: block.timestamp,
            deadline: block.timestamp + timeoutSeconds,
            serviceId: serviceId,
            status: EscrowStatus.Active
        });
        
        // Pull USDC from client
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        emit EscrowCreated(escrowId, msg.sender, provider, amount, serviceId, block.timestamp + timeoutSeconds);
    }
    
    /**
     * @notice Client releases funds to provider after service completion
     * @param escrowId The escrow to release
     */
    function release(bytes32 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        if (escrow.client == address(0)) revert EscrowNotFound();
        if (escrow.status != EscrowStatus.Active) revert EscrowNotActive();
        if (msg.sender != escrow.client) revert NotClient();
        
        escrow.status = EscrowStatus.Released;
        
        usdc.safeTransfer(escrow.provider, escrow.amount);
        
        emit EscrowReleased(escrowId, escrow.provider, escrow.amount);
    }
    
    /**
     * @notice Client refunds themselves if provider doesn't deliver before deadline
     * @param escrowId The escrow to refund
     */
    function refund(bytes32 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        if (escrow.client == address(0)) revert EscrowNotFound();
        if (escrow.status != EscrowStatus.Active) revert EscrowNotActive();
        if (msg.sender != escrow.client) revert NotClient();
        if (block.timestamp <= escrow.deadline) revert DeadlineNotReached();
        
        escrow.status = EscrowStatus.Refunded;
        
        usdc.safeTransfer(escrow.client, escrow.amount);
        
        emit EscrowRefunded(escrowId, escrow.client, escrow.amount);
    }
    
    /**
     * @notice Provider claims funds after deadline if client is MIA
     * @param escrowId The escrow to claim
     */
    function claim(bytes32 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        if (escrow.provider == address(0)) revert EscrowNotFound();
        if (escrow.status != EscrowStatus.Active) revert EscrowNotActive();
        if (msg.sender != escrow.provider) revert NotProvider();
        if (block.timestamp <= escrow.deadline) revert DeadlineNotReached();
        
        escrow.status = EscrowStatus.Claimed;
        
        usdc.safeTransfer(escrow.provider, escrow.amount);
        
        emit EscrowClaimed(escrowId, escrow.provider, escrow.amount);
    }
    
    // ============ View Functions ============
    
    function getEscrow(bytes32 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }
    
    function isActive(bytes32 escrowId) external view returns (bool) {
        return escrows[escrowId].status == EscrowStatus.Active;
    }
}
