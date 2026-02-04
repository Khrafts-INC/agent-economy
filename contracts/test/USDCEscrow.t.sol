// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/USDCEscrow.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract USDCEscrowTest is Test {
    USDCEscrow public escrow;
    MockUSDC public usdc;
    
    address public client = address(0x1);
    address public provider = address(0x2);
    
    uint256 constant AMOUNT = 100 * 10**6; // 100 USDC
    uint256 constant TIMEOUT = 7 days;
    
    function setUp() public {
        usdc = new MockUSDC();
        escrow = new USDCEscrow(address(usdc));
        
        // Fund client
        usdc.mint(client, 1000 * 10**6);
        
        // Approve escrow
        vm.prank(client);
        usdc.approve(address(escrow), type(uint256).max);
    }
    
    function test_CreateEscrow() public {
        vm.prank(client);
        bytes32 escrowId = escrow.createEscrow(provider, AMOUNT, "service-123", TIMEOUT);
        
        assertEq(usdc.balanceOf(address(escrow)), AMOUNT);
        assertTrue(escrow.isActive(escrowId));
        
        USDCEscrow.Escrow memory e = escrow.getEscrow(escrowId);
        assertEq(e.client, client);
        assertEq(e.provider, provider);
        assertEq(e.amount, AMOUNT);
        assertEq(e.serviceId, "service-123");
    }
    
    function test_Release() public {
        vm.prank(client);
        bytes32 escrowId = escrow.createEscrow(provider, AMOUNT, "service-123", TIMEOUT);
        
        uint256 providerBefore = usdc.balanceOf(provider);
        
        vm.prank(client);
        escrow.release(escrowId);
        
        assertEq(usdc.balanceOf(provider), providerBefore + AMOUNT);
        assertFalse(escrow.isActive(escrowId));
    }
    
    function test_RefundAfterDeadline() public {
        vm.prank(client);
        bytes32 escrowId = escrow.createEscrow(provider, AMOUNT, "service-123", TIMEOUT);
        
        uint256 clientBefore = usdc.balanceOf(client);
        
        // Warp past deadline
        vm.warp(block.timestamp + TIMEOUT + 1);
        
        vm.prank(client);
        escrow.refund(escrowId);
        
        assertEq(usdc.balanceOf(client), clientBefore + AMOUNT);
    }
    
    function test_ClaimAfterDeadline() public {
        vm.prank(client);
        bytes32 escrowId = escrow.createEscrow(provider, AMOUNT, "service-123", TIMEOUT);
        
        uint256 providerBefore = usdc.balanceOf(provider);
        
        // Warp past deadline
        vm.warp(block.timestamp + TIMEOUT + 1);
        
        vm.prank(provider);
        escrow.claim(escrowId);
        
        assertEq(usdc.balanceOf(provider), providerBefore + AMOUNT);
    }
    
    function test_RevertReleaseNotClient() public {
        vm.prank(client);
        bytes32 escrowId = escrow.createEscrow(provider, AMOUNT, "service-123", TIMEOUT);
        
        vm.prank(provider);
        vm.expectRevert(USDCEscrow.NotClient.selector);
        escrow.release(escrowId);
    }
    
    function test_RevertRefundBeforeDeadline() public {
        vm.prank(client);
        bytes32 escrowId = escrow.createEscrow(provider, AMOUNT, "service-123", TIMEOUT);
        
        vm.prank(client);
        vm.expectRevert(USDCEscrow.DeadlineNotReached.selector);
        escrow.refund(escrowId);
    }
    
    function test_RevertClaimBeforeDeadline() public {
        vm.prank(client);
        bytes32 escrowId = escrow.createEscrow(provider, AMOUNT, "service-123", TIMEOUT);
        
        vm.prank(provider);
        vm.expectRevert(USDCEscrow.DeadlineNotReached.selector);
        escrow.claim(escrowId);
    }
    
    function test_RevertDoubleRelease() public {
        vm.prank(client);
        bytes32 escrowId = escrow.createEscrow(provider, AMOUNT, "service-123", TIMEOUT);
        
        vm.prank(client);
        escrow.release(escrowId);
        
        vm.prank(client);
        vm.expectRevert(USDCEscrow.EscrowNotActive.selector);
        escrow.release(escrowId);
    }
}
