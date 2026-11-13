// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ALU Logo Token (ALUT)
/// @notice Splits ownership of the registered ALU logo into 1,000,000 fungible shares.
///         The logo owner receives every share at deployment and distributes them to
///         stakeholders.
contract ALULogoToken is ERC20, Ownable {
    /// @notice Total number of shares; it never changes after deployment.
    uint256 public constant TOTAL_SHARES = 1_000_000;

    event SharesDistributed(address indexed recipient, uint256 amount);

    /// @param logoOwner Wallet of the original logo owner, which receives all shares and owns the contract.
    constructor(address logoOwner) ERC20("ALU Logo Token", "ALUT") Ownable(logoOwner) {
        _mint(logoOwner, TOTAL_SHARES * 10 ** decimals());
    }

    /// @notice Shares are whole units, so one token is one share and amounts need no conversion.
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /// @notice Moves shares from the owner's balance to a stakeholder. Owner only.
    /// @param recipient Wallet receiving the shares.
    /// @param amount Number of ALUT shares to transfer.
    function distributeShares(address recipient, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        require(recipient != address(0), "Recipient cannot be the zero address");
        _transfer(owner(), recipient, amount);
        emit SharesDistributed(recipient, amount);
    }

    /// @notice Percentage of the logo a wallet owns, rounded down to a whole number.
    /// @return Percentage from 0 to 100, for example 50 for 500,000 shares.
    function ownershipPercentage(address holder) external view returns (uint256) {
        return (balanceOf(holder) * 100) / totalSupply();
    }
}
