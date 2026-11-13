// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title ALU Asset Registry
/// @notice Registers a digital file, such as the ALU logo, as an ERC-721 token and keeps
///         the SHA-256 fingerprint of the file, so anyone can later check whether a copy
///         of the file is the registered original.
contract ALUAssetRegistry is ERC721 {
    struct AssetMetadata {
        string name;
        string fileType;
        bytes32 contentHash;
        address registeredBy;
        uint256 registeredAt;
    }

    uint256 private assetCount;

    /// @notice Registration details of each token ID.
    mapping(uint256 => AssetMetadata) public assets;

    /// @notice True once a file with this SHA-256 hash has been registered.
    mapping(bytes32 => bool) public isHashRegistered;

    event AssetRegistered(
        uint256 indexed tokenId,
        address indexed registeredBy,
        bytes32 indexed contentHash,
        string name,
        string fileType,
        uint256 registeredAt
    );

    constructor() ERC721("ALU Asset Registry", "ALUAR") {}

    /// @notice Registers a file by its SHA-256 hash and mints an NFT for it to the caller.
    /// @param name Name of the asset, for example "ALU Official Logo".
    /// @param fileType Media type of the file, for example "image/png".
    /// @param contentHash SHA-256 hash of the file's bytes.
    /// @return tokenId The ID of the newly minted token.
    function registerAsset(string calldata name, string calldata fileType, bytes32 contentHash)
        external
        returns (uint256 tokenId)
    {
        require(bytes(name).length > 0, "Asset name cannot be empty");
        require(bytes(fileType).length > 0, "File type cannot be empty");
        require(contentHash != bytes32(0), "Content hash cannot be empty");
        require(!isHashRegistered[contentHash], "This file has already been registered");

        assetCount += 1;
        tokenId = assetCount;

        // State is saved before _safeMint, because _safeMint calls onERC721Received
        // on a contract receiver, which could otherwise call registerAsset again
        // with the same hash before it is marked as used.
        isHashRegistered[contentHash] = true;
        assets[tokenId] = AssetMetadata({
            name: name,
            fileType: fileType,
            contentHash: contentHash,
            registeredBy: msg.sender,
            registeredAt: block.timestamp
        });

        _safeMint(msg.sender, tokenId);
        emit AssetRegistered(tokenId, msg.sender, contentHash, name, fileType, block.timestamp);
    }

    /// @notice Checks whether a file's hash matches the hash registered for a token. Free to call.
    /// @param tokenId The registered asset to check against.
    /// @param contentHash SHA-256 hash of the file being checked.
    /// @return isAuthentic True when the hashes match.
    /// @return message "Logo is authentic." or "Warning: logo does not match."
    function verifyLogoIntegrity(uint256 tokenId, bytes32 contentHash)
        external
        view
        returns (bool isAuthentic, string memory message)
    {
        requireRegistered(tokenId);
        if (assets[tokenId].contentHash == contentHash) {
            return (true, "Logo is authentic.");
        }
        return (false, "Warning: logo does not match.");
    }

    /// @notice Returns the registration details of a token.
    function getAsset(uint256 tokenId) external view returns (AssetMetadata memory) {
        requireRegistered(tokenId);
        return assets[tokenId];
    }

    /// @notice Number of assets registered so far; token IDs run from 1 to this number.
    function totalAssets() external view returns (uint256) {
        return assetCount;
    }

    function requireRegistered(uint256 tokenId) private view {
        require(tokenId > 0 && tokenId <= assetCount, "No asset is registered with this token ID");
    }
}
