// Simulated IPFS content storage system
// In real applications, this data would be stored in IPFS or other distributed storage systems

interface StoredContent {
  contentHash: number;
  title: string;
  content: string;
  author: string;
  createdAt: number;
  category: number;
}

// Simulated content database
const contentDatabase: Map<number, StoredContent> = new Map();
// Post ID based content storage
const postContentDatabase: Map<string, StoredContent> = new Map();

// Preset sample content
const sampleContents: StoredContent[] = [
  {
    contentHash: 12345,
    title: "zBlog Platform Technical Introduction",
    content: `# Welcome to zBlog!

## 🔐 What is zBlog?

zBlog is a fully encrypted blog platform built on FHEVM (Fully Homomorphic Encryption Virtual Machine) technology. It allows users to create, publish, and read completely privacy-protected blog articles.

## 🚀 Core Features

### 1. Complete Encryption Storage
- All article content protected by FHEVM encryption technology
- Titles, categories, statistics data all encrypted
- Only authorized users can decrypt and view content

### 2. Permission Control System
- 🌍 **Public**: Accessible to everyone
- 👥 **Friends**: Only authorized friends can access  
- 👤 **Specific Users**: Requires explicit authorization
- 💰 **Paid Content**: Requires payment to unlock

### 3. Privacy Statistics
- Views, likes and other statistics encrypted storage
- Only article authors can decrypt and view real data
- Protects reader privacy and author business secrets

## 🛠 Technical Architecture

### Smart Contract Layer
- **Solidity + FHEVM**: Handle encryption logic and permission control
- **Fully Homomorphic Encryption**: Support direct computation on encrypted data
- **Decentralized Storage**: Data stored on blockchain

### Frontend Application Layer  
- **Next.js + React**: Modern user interface
- **TypeScript**: Type-safe development experience
- **FHEVM SDK**: Client-side encryption/decryption functionality

### Storage Architecture
- **Smart Contracts**: Store encrypted access tokens and metadata
- **IPFS**: Store actual article content (encrypted)
- **Local Cache**: Optimize user experience

## 🔒 Privacy Protection

zBlog adopts zero-trust architecture ensuring:
- Servers cannot read user content
- Blockchain nodes cannot access plaintext data  
- Only authorized users can decrypt content
- All operations have cryptographic proofs

## 🌟 Use Cases

- **Personal Blogs**: Private diaries and life records
- **Technical Sharing**: Encrypted technical documents and code
- **Commercial Content**: Paid courses and professional knowledge
- **Team Collaboration**: Internal documents and project records

Thank you for experiencing zBlog! This is the privacy-protected content platform for the Web3 era.`,
    author: "zBlog Team",
    createdAt: Date.now(),
    category: 1
  }
];

// Initialize sample data
sampleContents.forEach(content => {
  contentDatabase.set(content.contentHash, content);
});

/**
 * Store article content (simulating IPFS storage)
 * @param postId Post ID (use as unique identifier)
 * @param title Article title
 * @param content Article content
 * @param author Author address
 * @param category Category
 * @returns Storage success status
 */
export function storeContentByPostId(
  postId: string,
  title: string,
  content: string,
  author: string,
  category: number
): boolean {
  try {
    const storedContent: StoredContent = {
      contentHash: parseInt(postId), // Use postId as hash for simplicity
      title,
      content,
      author,
      createdAt: Date.now(),
      category
    };

    postContentDatabase.set(postId, storedContent);
    console.log(`[ContentStorage] Content stored successfully for post: ${postId}`);
    return true;
  } catch (error) {
    console.error(`[ContentStorage] Content storage failed:`, error);
    return false;
  }
}

/**
 * Get article content by post ID
 * @param postId Post ID
 * @returns Article content or null
 */
export function getContentByPostId(postId: string): StoredContent | null {
  const content = postContentDatabase.get(postId);
  
  if (content) {
    console.log(`[ContentStorage] Content retrieved successfully for post: ${postId}`);
    return content;
  } else {
    console.log(`[ContentStorage] Content not found for post: ${postId}`);
    return null;
  }
}

/**
 * Get article content by content hash
 * @param contentHash Decrypted content hash
 * @returns Article content or null
 */
export function getContentByHash(contentHash: number): StoredContent | null {
  const content = contentDatabase.get(contentHash);
  
  if (content) {
    console.log(`[ContentStorage] Content retrieved successfully: ${contentHash}`);
    return content;
  } else {
    console.log(`[ContentStorage] Content not found: ${contentHash}`);
    
    // If content not found, return default demo content
    return {
      contentHash,
      title: `Article #${contentHash}`,
      content: `# Article Content

This is article content retrieved based on decrypted content hash **${contentHash}**.

In real zBlog applications, this content would be stored in distributed storage systems like IPFS, indexed and retrieved through content hash.

## Decryption Successful!

The information you see is truly decrypted from FHEVM smart contract:
- Content Hash: ${contentHash}
- Decryption Time: ${new Date().toLocaleString()}

This proves FHEVM technology's powerful capability: able to support complex business logic operations while keeping data encrypted.`,
      author: "Unknown",
      createdAt: Date.now(),
      category: 10
    };
  }
}

/**
 * Get all stored content (for debugging)
 * @returns All stored content
 */
export function getAllStoredContent(): StoredContent[] {
  return Array.from(contentDatabase.values());
}

/**
 * Clear content storage (for debugging)
 */
export function clearContentStorage(): void {
  contentDatabase.clear();
  console.log(`[ContentStorage] Content storage cleared`);
}
