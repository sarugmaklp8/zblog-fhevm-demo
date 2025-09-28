// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, ebool, externalEuint32, externalEuint8, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title zBlog IPFS - Production-ready version with IPFS storage
/// @notice Uses IPFS for content storage and blockchain for access control
contract ZBlogIPFS is SepoliaConfig {
    
    // Blog post structure optimized for IPFS storage
    struct BlogPost {
        uint256 postId;
        address author;
        string ipfsHash;                 // IPFS hash for actual content (public)
        euint32 encryptedAccessToken;    // Encrypted access token (private)
        euint8 category;                 // Encrypted category
        euint8 accessLevel;              // Encrypted access level
        euint32 price;                   // Encrypted price
        uint256 createdAt;
        euint32 viewCount;               // Encrypted view count
        euint32 likeCount;               // Encrypted like count
        ebool isActive;                  // Encrypted active status
    }
    
    // State variables
    uint256 private _postCounter;
    mapping(uint256 => BlogPost) private _posts;
    mapping(address => uint256[]) private _userPosts;
    mapping(uint256 => mapping(address => bool)) private _authorizedReaders;
    
    // Events
    event PostCreated(uint256 indexed postId, address indexed author, string ipfsHash, uint256 createdAt);
    event AccessGranted(uint256 indexed postId, address indexed reader, uint256 grantedAt);
    
    // Modifiers
    modifier onlyAuthor(uint256 postId) {
        require(_posts[postId].author == msg.sender, "Only author can perform this action");
        _;
    }
    
    modifier validPost(uint256 postId) {
        require(postId > 0 && postId <= _postCounter, "Invalid post ID");
        _;
    }
    
    /// @notice Create a new blog post with IPFS content storage
    /// @param ipfsHash IPFS hash of the encrypted content
    /// @param accessTokenInput Encrypted access token for content decryption
    /// @param categoryInput Encrypted category
    /// @param accessLevelInput Encrypted access level
    /// @param priceInput Encrypted price
    /// @param inputProof ZK proof for encrypted inputs
    function createPost(
        string calldata ipfsHash,
        externalEuint32 accessTokenInput,
        externalEuint8 categoryInput, 
        externalEuint8 accessLevelInput,
        externalEuint32 priceInput,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted inputs
        euint32 encryptedAccessToken = FHE.fromExternal(accessTokenInput, inputProof);
        euint8 encryptedCategory = FHE.fromExternal(categoryInput, inputProof);
        euint8 encryptedAccessLevel = FHE.fromExternal(accessLevelInput, inputProof);
        euint32 encryptedPrice = FHE.fromExternal(priceInput, inputProof);
        
        _postCounter++;
        uint256 newPostId = _postCounter;
        
        // Create new blog post
        _posts[newPostId] = BlogPost({
            postId: newPostId,
            author: msg.sender,
            ipfsHash: ipfsHash,
            encryptedAccessToken: encryptedAccessToken,
            category: encryptedCategory,
            accessLevel: encryptedAccessLevel,
            price: encryptedPrice,
            createdAt: block.timestamp,
            viewCount: FHE.asEuint32(0),
            likeCount: FHE.asEuint32(0),
            isActive: FHE.asEbool(true)
        });
        
        // Set up permissions
        FHE.allowThis(_posts[newPostId].encryptedAccessToken);
        FHE.allowThis(_posts[newPostId].category);
        FHE.allowThis(_posts[newPostId].accessLevel);
        FHE.allowThis(_posts[newPostId].price);
        FHE.allowThis(_posts[newPostId].viewCount);
        FHE.allowThis(_posts[newPostId].likeCount);
        FHE.allowThis(_posts[newPostId].isActive);
        
        // Allow author to access encrypted data
        FHE.allow(_posts[newPostId].encryptedAccessToken, msg.sender);
        FHE.allow(_posts[newPostId].category, msg.sender);
        FHE.allow(_posts[newPostId].accessLevel, msg.sender);
        FHE.allow(_posts[newPostId].price, msg.sender);
        FHE.allow(_posts[newPostId].viewCount, msg.sender);
        FHE.allow(_posts[newPostId].likeCount, msg.sender);
        FHE.allow(_posts[newPostId].isActive, msg.sender);
        
        // Author automatically has access
        _authorizedReaders[newPostId][msg.sender] = true;
        _userPosts[msg.sender].push(newPostId);
        
        emit PostCreated(newPostId, msg.sender, ipfsHash, block.timestamp);
    }
    
    /// @notice Grant access to a specific user
    function grantAccess(uint256 postId, address reader) 
        external 
        onlyAuthor(postId) 
        validPost(postId) 
    {
        _authorizedReaders[postId][reader] = true;
        
        // Grant permission to access encrypted token
        FHE.allow(_posts[postId].encryptedAccessToken, reader);
        
        emit AccessGranted(postId, reader, block.timestamp);
    }
    
    /// @notice Check if user has access to post
    function hasAccess(uint256 postId, address user) 
        external 
        view 
        validPost(postId) 
        returns (bool) 
    {
        return _authorizedReaders[postId][user];
    }
    
    /// @notice Get post basic info (public data)
    function getPost(uint256 postId) 
        external 
        view 
        validPost(postId) 
        returns (uint256, address, string memory, uint256) 
    {
        BlogPost memory post = _posts[postId];
        return (post.postId, post.author, post.ipfsHash, post.createdAt);
    }
    
    /// @notice Get encrypted access token for authorized users
    function getEncryptedAccessToken(uint256 postId) 
        external 
        view 
        validPost(postId) 
        returns (euint32) 
    {
        require(_authorizedReaders[postId][msg.sender], "Not authorized to access this post");
        return _posts[postId].encryptedAccessToken;
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

