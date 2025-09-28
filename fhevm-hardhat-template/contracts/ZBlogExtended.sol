// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, ebool, externalEuint32, externalEuint8, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title zBlog Extended - Support longer text encryption
/// @notice Extended version supporting up to 64 characters of encrypted text
contract ZBlogExtended is SepoliaConfig {
    
    // Extended blog post structure with more content fields
    struct BlogPost {
        uint256 postId;
        address author;
        // Support up to 64 characters (16 × 4 chars)
        euint32 encryptedContentPart1;   // Chars 1-4
        euint32 encryptedContentPart2;   // Chars 5-8
        euint32 encryptedContentPart3;   // Chars 9-12
        euint32 encryptedContentPart4;   // Chars 13-16
        euint32 encryptedContentPart5;   // Chars 17-20
        euint32 encryptedContentPart6;   // Chars 21-24
        euint32 encryptedContentPart7;   // Chars 25-28
        euint32 encryptedContentPart8;   // Chars 29-32
        euint32 encryptedContentPart9;   // Chars 33-36
        euint32 encryptedContentPart10;  // Chars 37-40
        euint32 encryptedContentPart11;  // Chars 41-44
        euint32 encryptedContentPart12;  // Chars 45-48
        euint32 encryptedContentPart13;  // Chars 49-52
        euint32 encryptedContentPart14;  // Chars 53-56
        euint32 encryptedContentPart15;  // Chars 57-60
        euint32 encryptedContentPart16;  // Chars 61-64
        euint32 encryptedContentLength;  // Original length
        euint8 category;                 // Category (1-10)
        euint8 accessLevel;              // Access level
        euint32 price;                   // Price
        uint256 createdAt;
        euint32 viewCount;               // View count
        euint32 likeCount;               // Like count
        ebool isActive;                  // Active status
    }
    
    // State variables
    uint256 private _postCounter;
    mapping(uint256 => BlogPost) private _posts;
    mapping(address => uint256[]) private _userPosts;
    
    // Events
    event PostCreated(uint256 indexed postId, address indexed author, uint256 createdAt);
    
    /// @notice Create post with extended content (up to 64 characters)
    function createExtendedPost(
        externalEuint32[16] calldata contentParts, // 16 parts for 64 characters
        externalEuint32 contentLengthInput,
        externalEuint8 categoryInput,
        externalEuint8 accessLevelInput,
        externalEuint32 priceInput,
        bytes calldata inputProof
    ) external {
        // Convert all external inputs
        euint32[16] memory encryptedParts;
        for (uint i = 0; i < 16; i++) {
            encryptedParts[i] = FHE.fromExternal(contentParts[i], inputProof);
        }
        
        euint32 encryptedLength = FHE.fromExternal(contentLengthInput, inputProof);
        euint8 encryptedCategory = FHE.fromExternal(categoryInput, inputProof);
        euint8 encryptedAccessLevel = FHE.fromExternal(accessLevelInput, inputProof);
        euint32 encryptedPrice = FHE.fromExternal(priceInput, inputProof);
        
        _postCounter++;
        uint256 newPostId = _postCounter;
        
        // Create new blog post with all 16 parts
        _posts[newPostId] = BlogPost({
            postId: newPostId,
            author: msg.sender,
            encryptedContentPart1: encryptedParts[0],
            encryptedContentPart2: encryptedParts[1],
            encryptedContentPart3: encryptedParts[2],
            encryptedContentPart4: encryptedParts[3],
            encryptedContentPart5: encryptedParts[4],
            encryptedContentPart6: encryptedParts[5],
            encryptedContentPart7: encryptedParts[6],
            encryptedContentPart8: encryptedParts[7],
            encryptedContentPart9: encryptedParts[8],
            encryptedContentPart10: encryptedParts[9],
            encryptedContentPart11: encryptedParts[10],
            encryptedContentPart12: encryptedParts[11],
            encryptedContentPart13: encryptedParts[12],
            encryptedContentPart14: encryptedParts[13],
            encryptedContentPart15: encryptedParts[14],
            encryptedContentPart16: encryptedParts[15],
            encryptedContentLength: encryptedLength,
            category: encryptedCategory,
            accessLevel: encryptedAccessLevel,
            price: encryptedPrice,
            createdAt: block.timestamp,
            viewCount: FHE.asEuint32(0),
            likeCount: FHE.asEuint32(0),
            isActive: FHE.asEbool(true)
        });
        
        // Set permissions for all parts
        for (uint i = 0; i < 16; i++) {
            FHE.allowThis(_getContentPart(newPostId, i));
            FHE.allow(_getContentPart(newPostId, i), msg.sender);
        }
        
        FHE.allowThis(_posts[newPostId].encryptedContentLength);
        FHE.allow(_posts[newPostId].encryptedContentLength, msg.sender);
        
        _userPosts[msg.sender].push(newPostId);
        
        emit PostCreated(newPostId, msg.sender, block.timestamp);
    }
    
    /// @notice Get all encrypted content parts
    function getAllEncryptedContent(uint256 postId) 
        external 
        view 
        returns (euint32[16] memory parts, euint32 length) 
    {
        BlogPost storage post = _posts[postId];
        parts[0] = post.encryptedContentPart1;
        parts[1] = post.encryptedContentPart2;
        parts[2] = post.encryptedContentPart3;
        parts[3] = post.encryptedContentPart4;
        parts[4] = post.encryptedContentPart5;
        parts[5] = post.encryptedContentPart6;
        parts[6] = post.encryptedContentPart7;
        parts[7] = post.encryptedContentPart8;
        parts[8] = post.encryptedContentPart9;
        parts[9] = post.encryptedContentPart10;
        parts[10] = post.encryptedContentPart11;
        parts[11] = post.encryptedContentPart12;
        parts[12] = post.encryptedContentPart13;
        parts[13] = post.encryptedContentPart14;
        parts[14] = post.encryptedContentPart15;
        parts[15] = post.encryptedContentPart16;
        length = post.encryptedContentLength;
    }
    
    /// @notice Helper function to get content part by index
    function _getContentPart(uint256 postId, uint256 partIndex) 
        private 
        view 
        returns (euint32) 
    {
        BlogPost storage post = _posts[postId];
        if (partIndex == 0) return post.encryptedContentPart1;
        if (partIndex == 1) return post.encryptedContentPart2;
        if (partIndex == 2) return post.encryptedContentPart3;
        if (partIndex == 3) return post.encryptedContentPart4;
        if (partIndex == 4) return post.encryptedContentPart5;
        if (partIndex == 5) return post.encryptedContentPart6;
        if (partIndex == 6) return post.encryptedContentPart7;
        if (partIndex == 7) return post.encryptedContentPart8;
        if (partIndex == 8) return post.encryptedContentPart9;
        if (partIndex == 9) return post.encryptedContentPart10;
        if (partIndex == 10) return post.encryptedContentPart11;
        if (partIndex == 11) return post.encryptedContentPart12;
        if (partIndex == 12) return post.encryptedContentPart13;
        if (partIndex == 13) return post.encryptedContentPart14;
        if (partIndex == 14) return post.encryptedContentPart15;
        if (partIndex == 15) return post.encryptedContentPart16;
        revert("Invalid part index");
    }
    
    /// @notice Get basic post info
    function getPost(uint256 postId) external view returns (uint256, address, uint256) {
        BlogPost memory post = _posts[postId];
        return (post.postId, post.author, post.createdAt);
    }
    
    /// @notice Get user posts
    function getUserPosts(address user) external view returns (uint256[] memory) {
        return _userPosts[user];
    }
    
    /// @notice Get total posts
    function getTotalPosts() external view returns (uint256) {
        return _postCounter;
    }
}

