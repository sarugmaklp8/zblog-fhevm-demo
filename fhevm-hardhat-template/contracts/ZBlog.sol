// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, ebool, externalEuint32, externalEuint8, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title zBlog - Encrypted Blog Platform using FHEVM
/// @author zBlog Team
/// @notice A fully encrypted blog platform where content and permissions are protected by FHEVM
contract ZBlog is SepoliaConfig {
    
    // Blog post structure with encrypted content
    struct BlogPost {
        uint256 postId;
        address author;
        euint32 encryptedContentPart1; // First 4 characters of content (as uint32)
        euint32 encryptedContentPart2; // Next 4 characters of content (as uint32)  
        euint32 encryptedContentPart3; // Next 4 characters of content (as uint32)
        euint32 encryptedContentLength; // Length of original content
        euint8 category;              // Encrypted category (1-10)
        euint8 accessLevel;           // Encrypted access level (0=public, 1=friends, 2=specific, 3=paid)
        euint32 price;               // Encrypted price for paid content (in wei)
        uint256 createdAt;
        euint32 viewCount;           // Encrypted view count
        euint32 likeCount;           // Encrypted like count
        ebool isActive;              // Encrypted active status
    }
    
    // User profile with encrypted data
    struct UserProfile {
        address userAddress;
        euint8 userType;             // Encrypted user type (0=reader, 1=author, 2=admin)
        euint32 totalPosts;          // Encrypted total posts count
        euint32 totalViews;          // Encrypted total views
        ebool isVerified;            // Encrypted verification status
    }
    
    // Access permission for specific users
    struct AccessPermission {
        uint256 postId;
        address reader;
        ebool hasAccess;             // Encrypted access permission
        uint256 grantedAt;
    }
    
    // State variables
    uint256 private _postCounter;
    uint256 private _permissionCounter;
    
    // Mappings
    mapping(uint256 => BlogPost) private _posts;
    mapping(address => UserProfile) private _userProfiles;
    mapping(uint256 => AccessPermission) private _permissions;
    mapping(uint256 => address[]) private _postReaders;        // Post ID -> authorized readers
    mapping(address => uint256[]) private _userPosts;          // Author -> post IDs
    mapping(address => uint256[]) private _userAccessiblePosts; // Reader -> accessible post IDs
    
    // Events
    event PostCreated(uint256 indexed postId, address indexed author, uint256 createdAt);
    event PostUpdated(uint256 indexed postId, address indexed author);
    event AccessGranted(uint256 indexed postId, address indexed reader, uint256 grantedAt);
    event PostViewed(uint256 indexed postId, address indexed reader);
    event PostLiked(uint256 indexed postId, address indexed reader);
    
    // Modifiers
    modifier onlyAuthor(uint256 postId) {
        require(_posts[postId].author == msg.sender, "Only author can perform this action");
        _;
    }
    
    modifier validPost(uint256 postId) {
        require(postId > 0 && postId <= _postCounter, "Invalid post ID");
        _;
    }
    
    /// @notice Create a new blog post with encrypted content
    /// @param contentPart1Input Encrypted first part of content (4 chars as uint32)
    /// @param contentPart2Input Encrypted second part of content (4 chars as uint32)
    /// @param contentPart3Input Encrypted third part of content (4 chars as uint32)
    /// @param contentLengthInput Encrypted content length
    /// @param categoryInput Encrypted category
    /// @param accessLevelInput Encrypted access level
    /// @param priceInput Encrypted price
    /// @param inputProof ZK proof for encrypted inputs
    function createPost(
        externalEuint32 contentPart1Input,
        externalEuint32 contentPart2Input,
        externalEuint32 contentPart3Input,
        externalEuint32 contentLengthInput,
        externalEuint8 categoryInput, 
        externalEuint8 accessLevelInput,
        externalEuint32 priceInput,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted inputs
        euint32 encryptedContentPart1 = FHE.fromExternal(contentPart1Input, inputProof);
        euint32 encryptedContentPart2 = FHE.fromExternal(contentPart2Input, inputProof);
        euint32 encryptedContentPart3 = FHE.fromExternal(contentPart3Input, inputProof);
        euint32 encryptedContentLength = FHE.fromExternal(contentLengthInput, inputProof);
        euint8 encryptedCategory = FHE.fromExternal(categoryInput, inputProof);
        euint8 encryptedAccessLevel = FHE.fromExternal(accessLevelInput, inputProof);
        euint32 encryptedPrice = FHE.fromExternal(priceInput, inputProof);
        
        _postCounter++;
        uint256 newPostId = _postCounter;
        
        // Create new blog post
        _posts[newPostId] = BlogPost({
            postId: newPostId,
            author: msg.sender,
            encryptedContentPart1: encryptedContentPart1,
            encryptedContentPart2: encryptedContentPart2,
            encryptedContentPart3: encryptedContentPart3,
            encryptedContentLength: encryptedContentLength,
            category: encryptedCategory,
            accessLevel: encryptedAccessLevel,
            price: encryptedPrice,
            createdAt: block.timestamp,
            viewCount: FHE.asEuint32(0),
            likeCount: FHE.asEuint32(0),
            isActive: FHE.asEbool(true)
        });
        
        // Set up permissions
        FHE.allowThis(_posts[newPostId].encryptedContentPart1);
        FHE.allowThis(_posts[newPostId].encryptedContentPart2);
        FHE.allowThis(_posts[newPostId].encryptedContentPart3);
        FHE.allowThis(_posts[newPostId].encryptedContentLength);
        FHE.allowThis(_posts[newPostId].category);
        FHE.allowThis(_posts[newPostId].accessLevel);
        FHE.allowThis(_posts[newPostId].price);
        FHE.allowThis(_posts[newPostId].viewCount);
        FHE.allowThis(_posts[newPostId].likeCount);
        FHE.allowThis(_posts[newPostId].isActive);
        
        // Allow author to access encrypted data
        FHE.allow(_posts[newPostId].encryptedContentPart1, msg.sender);
        FHE.allow(_posts[newPostId].encryptedContentPart2, msg.sender);
        FHE.allow(_posts[newPostId].encryptedContentPart3, msg.sender);
        FHE.allow(_posts[newPostId].encryptedContentLength, msg.sender);
        FHE.allow(_posts[newPostId].category, msg.sender);
        FHE.allow(_posts[newPostId].accessLevel, msg.sender);
        FHE.allow(_posts[newPostId].price, msg.sender);
        FHE.allow(_posts[newPostId].viewCount, msg.sender);
        FHE.allow(_posts[newPostId].likeCount, msg.sender);
        FHE.allow(_posts[newPostId].isActive, msg.sender);
        
        // Update user posts
        _userPosts[msg.sender].push(newPostId);
        
        // Update user profile
        if (_userProfiles[msg.sender].userAddress == address(0)) {
            _userProfiles[msg.sender] = UserProfile({
                userAddress: msg.sender,
                userType: FHE.asEuint8(1), // Author
                totalPosts: FHE.asEuint32(1),
                totalViews: FHE.asEuint32(0),
                isVerified: FHE.asEbool(false)
            });
            
            FHE.allowThis(_userProfiles[msg.sender].userType);
            FHE.allowThis(_userProfiles[msg.sender].totalPosts);
            FHE.allowThis(_userProfiles[msg.sender].totalViews);
            FHE.allowThis(_userProfiles[msg.sender].isVerified);
            
            FHE.allow(_userProfiles[msg.sender].userType, msg.sender);
            FHE.allow(_userProfiles[msg.sender].totalPosts, msg.sender);
            FHE.allow(_userProfiles[msg.sender].totalViews, msg.sender);
            FHE.allow(_userProfiles[msg.sender].isVerified, msg.sender);
        } else {
            _userProfiles[msg.sender].totalPosts = FHE.add(_userProfiles[msg.sender].totalPosts, FHE.asEuint32(1));
            FHE.allowThis(_userProfiles[msg.sender].totalPosts);
            FHE.allow(_userProfiles[msg.sender].totalPosts, msg.sender);
        }
        
        emit PostCreated(newPostId, msg.sender, block.timestamp);
    }
    
    /// @notice Grant access to a specific user for a blog post
    /// @param postId The blog post ID
    /// @param reader The reader to grant access to
    function grantAccess(uint256 postId, address reader) 
        external 
        onlyAuthor(postId) 
        validPost(postId) 
    {
        _permissionCounter++;
        
        _permissions[_permissionCounter] = AccessPermission({
            postId: postId,
            reader: reader,
            hasAccess: FHE.asEbool(true),
            grantedAt: block.timestamp
        });
        
        FHE.allowThis(_permissions[_permissionCounter].hasAccess);
        FHE.allow(_permissions[_permissionCounter].hasAccess, reader);
        FHE.allow(_permissions[_permissionCounter].hasAccess, msg.sender);
        
        _postReaders[postId].push(reader);
        _userAccessiblePosts[reader].push(postId);
        
        emit AccessGranted(postId, reader, block.timestamp);
    }
    
    /// @notice View a blog post (increments view count)
    /// @param postId The blog post ID to view
    function viewPost(uint256 postId) external validPost(postId) {
        BlogPost storage post = _posts[postId];
        
        // Increment view count
        post.viewCount = FHE.add(post.viewCount, FHE.asEuint32(1));
        FHE.allowThis(post.viewCount);
        FHE.allow(post.viewCount, post.author);
        
        emit PostViewed(postId, msg.sender);
    }
    
    /// @notice Like a blog post (increments like count)
    /// @param postId The blog post ID to like
    function likePost(uint256 postId) external validPost(postId) {
        BlogPost storage post = _posts[postId];
        
        // Increment like count
        post.likeCount = FHE.add(post.likeCount, FHE.asEuint32(1));
        FHE.allowThis(post.likeCount);
        FHE.allow(post.likeCount, post.author);
        
        emit PostLiked(postId, msg.sender);
    }
    
    // TODO: Update post function will be implemented later with new content structure
    
    /// @notice Deactivate a blog post
    /// @param postId The blog post ID to deactivate
    function deactivatePost(uint256 postId) external onlyAuthor(postId) validPost(postId) {
        _posts[postId].isActive = FHE.asEbool(false);
        FHE.allowThis(_posts[postId].isActive);
        FHE.allow(_posts[postId].isActive, msg.sender);
    }
    
    // View functions (return encrypted data)
    
    /// @notice Get blog post data
    /// @param postId The blog post ID
    /// @return Basic post information (non-encrypted parts)
    function getPost(uint256 postId) 
        external 
        view 
        validPost(postId) 
        returns (uint256, address, uint256) 
    {
        BlogPost memory post = _posts[postId];
        return (post.postId, post.author, post.createdAt);
    }
    
    /// @notice Get encrypted content parts for authorized users
    /// @param postId The blog post ID
    /// @return part1 First part of encrypted content
    /// @return part2 Second part of encrypted content
    /// @return part3 Third part of encrypted content
    /// @return length Length of original content
    function getEncryptedContent(uint256 postId) 
        external 
        view 
        validPost(postId) 
        returns (euint32 part1, euint32 part2, euint32 part3, euint32 length) 
    {
        return (
            _posts[postId].encryptedContentPart1,
            _posts[postId].encryptedContentPart2,
            _posts[postId].encryptedContentPart3,
            _posts[postId].encryptedContentLength
        );
    }
    
    /// @notice Get encrypted category for authorized users
    /// @param postId The blog post ID
    /// @return Encrypted category
    function getEncryptedCategory(uint256 postId) 
        external 
        view 
        validPost(postId) 
        returns (euint8) 
    {
        return _posts[postId].category;
    }
    
    /// @notice Get encrypted view count for post author
    /// @param postId The blog post ID
    /// @return Encrypted view count
    function getEncryptedViewCount(uint256 postId) 
        external 
        view 
        validPost(postId) 
        returns (euint32) 
    {
        return _posts[postId].viewCount;
    }
    
    /// @notice Get encrypted like count for post author
    /// @param postId The blog post ID
    /// @return Encrypted like count
    function getEncryptedLikeCount(uint256 postId) 
        external 
        view 
        validPost(postId) 
        returns (euint32) 
    {
        return _posts[postId].likeCount;
    }
    
    /// @notice Get user's posts
    /// @param user The user address
    /// @return Array of post IDs
    function getUserPosts(address user) external view returns (uint256[] memory) {
        return _userPosts[user];
    }
    
    /// @notice Get accessible posts for a user
    /// @param user The user address
    /// @return Array of post IDs
    function getAccessiblePosts(address user) external view returns (uint256[] memory) {
        return _userAccessiblePosts[user];
    }
    
    /// @notice Get total number of posts
    /// @return Total post count
    function getTotalPosts() external view returns (uint256) {
        return _postCounter;
    }
    
    /// @notice Get user profile encrypted data
    /// @param user The user address
    /// @return Encrypted user type
    function getEncryptedUserType(address user) external view returns (euint8) {
        return _userProfiles[user].userType;
    }
    
    /// @notice Get user's total posts (encrypted)
    /// @param user The user address
    /// @return Encrypted total posts count
    function getEncryptedTotalPosts(address user) external view returns (euint32) {
        return _userProfiles[user].totalPosts;
    }
}
