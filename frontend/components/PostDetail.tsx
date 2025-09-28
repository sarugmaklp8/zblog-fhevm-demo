"use client";

import { useState } from "react";
import { BlogPost } from "@/hooks/useZBlog";

import { FhevmInstance } from "../fhevm/fhevmTypes";
import { GenericStringStorage } from "../fhevm/GenericStringStorage";
import { FhevmDecryptionSignature } from "../fhevm/FhevmDecryptionSignature";
import { ethers } from "ethers";
import { ZBlogABI } from "../abi/ZBlogABI";
import { getContentByPostId } from "../utils/contentStorage";
import { decodeTextFromParts } from "../utils/textEncoding";

interface PostDetailProps {
  post: BlogPost;
  onClose: () => void;
  onView: (postId: string) => void;
  onLike: (postId: string) => void;
  onDecryptStats: (postId: string) => Promise<{ viewCount?: number; likeCount?: number } | undefined>;
  isLoadingAction: boolean;
  // Additional parameters for real FHEVM decryption
  fhevmInstance: FhevmInstance | undefined;
  ethersSigner: ethers.Signer | undefined;
  contractAddress: string | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
}

export const PostDetail = ({ 
  post, onClose, onView, onLike, onDecryptStats, isLoadingAction,
  fhevmInstance, ethersSigner, contractAddress, fhevmDecryptionSignatureStorage
}: PostDetailProps) => {
  const [decryptedContent, setDecryptedContent] = useState<string>("");
  const [isDecryptingContent, setIsDecryptingContent] = useState<boolean>(false);
  const [stats, setStats] = useState<{ viewCount?: number; likeCount?: number }>({});
  const [isDecryptingStats, setIsDecryptingStats] = useState<boolean>(false);

  // Real FHEVM article content decryption function
  const handleDecryptContent = async () => {
    if (!fhevmInstance || !ethersSigner || !contractAddress) {
      setDecryptedContent("❌ Missing required decryption parameters");
      return;
    }

    setIsDecryptingContent(true);
    try {
      // 创建合约实例
      const contract = new ethers.Contract(contractAddress, ZBlogABI, ethersSigner);
      
      console.log(`[Decrypt] Decrypting content for post ${post.postId}...`);
      
      // 1. Get encrypted content parts
      const [encryptedPart1, encryptedPart2, encryptedPart3, encryptedLength] = 
        await contract.getEncryptedContent(post.postId);
      console.log(`[Decrypt] Retrieved encrypted content parts:`, {
        part1: encryptedPart1.toString(),
        part2: encryptedPart2.toString(), 
        part3: encryptedPart3.toString(),
        length: encryptedLength.toString()
      });
      
      // 2. Get encrypted category
      const encryptedCategory = await contract.getEncryptedCategory(post.postId);
      console.log(`[Decrypt] Retrieved encrypted category:`, encryptedCategory.toString());
      
      // 3. Create decryption signature
      const sig: FhevmDecryptionSignature | null =
        await FhevmDecryptionSignature.loadOrSign(
          fhevmInstance,
          [contractAddress as `0x${string}`],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

      if (!sig) {
        setDecryptedContent("❌ Unable to create decryption signature");
        return;
      }

      console.log(`[Decrypt] Decryption signature created successfully`);

      // 4. Decrypt content parts and category
      const decryptionResults = await fhevmInstance.userDecrypt(
        [
          { handle: encryptedPart1, contractAddress },
          { handle: encryptedPart2, contractAddress },
          { handle: encryptedPart3, contractAddress },
          { handle: encryptedLength, contractAddress },
          { handle: encryptedCategory, contractAddress }
        ],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      const decryptedPart1 = decryptionResults[encryptedPart1.toString()];
      const decryptedPart2 = decryptionResults[encryptedPart2.toString()];
      const decryptedPart3 = decryptionResults[encryptedPart3.toString()];
      const decryptedLength = decryptionResults[encryptedLength.toString()];
      const decryptedCategoryValue = decryptionResults[encryptedCategory.toString()];
      
      console.log(`[Decrypt] Decryption successful:`, {
        part1: decryptedPart1,
        part2: decryptedPart2,
        part3: decryptedPart3,
        length: decryptedLength,
        category: decryptedCategoryValue
      });

      // 5. Reconstruct text from decrypted numeric parts
      const convertToNumber = (value: string | number | bigint | boolean): number => {
        if (typeof value === 'string') return parseInt(value);
        if (typeof value === 'boolean') return value ? 1 : 0;
        return Number(value);
      };

      const decodedText = decodeTextFromParts(
        convertToNumber(decryptedPart1),
        convertToNumber(decryptedPart2), 
        convertToNumber(decryptedPart3),
        convertToNumber(decryptedLength)
      );
      
      console.log(`[Decrypt] Reconstructed text: "${decodedText}"`);
      
      // 6. Try to get complete content from storage system using post ID
      const storedContent = getContentByPostId(post.postId);
      
      // 7. Generate final display content - Just show the decrypted text
      if (storedContent) {
        // If complete stored content is found, show it
        setDecryptedContent(storedContent.content);
      } else {
        // If no stored content found, show the decrypted text
        setDecryptedContent(`${decodedText}

(Decrypted from blockchain - first 12 characters only)
Original length: ${convertToNumber(decryptedLength)} characters`);
      }
      
    } catch (error) {
      console.error("Error decrypting content:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDecryptedContent(`❌ Decryption failed: ${errorMessage}`);
    } finally {
      setIsDecryptingContent(false);
    }
  };

  // Decrypt statistics
  const handleDecryptStats = async () => {
    setIsDecryptingStats(true);
    try {
      const result = await onDecryptStats(post.postId);
      if (result) {
        setStats(result);
      }
    } catch (error) {
      console.error("Error decrypting stats:", error);
    } finally {
      setIsDecryptingStats(false);
    }
  };

  const buttonClass = "px-4 py-2 rounded-lg font-medium transition-colors";
  const primaryButtonClass = `${buttonClass} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400`;
  const secondaryButtonClass = `${buttonClass} bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📄 Post Details</h2>
            <p className="text-sm text-gray-600 mt-1">Post #{post.postId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Post ID:</span>
                <span className="ml-2 text-gray-600">#{post.postId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created At:</span>
                <span className="ml-2 text-gray-600">{post.createdAt.toLocaleString()}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Author Address:</span>
                <span className="ml-2 text-gray-600 font-mono text-xs">{post.author}</span>
              </div>
            </div>
          </div>

          {/* Article Content Area */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">🔐 Encrypted Content</h3>
              <button
                onClick={handleDecryptContent}
                disabled={isDecryptingContent}
                className={primaryButtonClass}
              >
                {isDecryptingContent ? "🔓 Decrypting..." : "🔓 Decrypt Content"}
              </button>
            </div>

            {decryptedContent ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                  {decryptedContent}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-4xl mb-2">🔒</div>
                <p className="text-gray-600">Article content is encrypted</p>
                <p className="text-sm text-gray-500 mt-1">Click &quot;Decrypt Content&quot; button to view details</p>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">📊 Statistics</h3>
              <button
                onClick={handleDecryptStats}
                disabled={isDecryptingStats}
                className={primaryButtonClass}
              >
                {isDecryptingStats ? "🔓 Decrypting..." : "🔓 Decrypt Stats"}
              </button>
            </div>

            {stats.viewCount !== undefined || stats.likeCount !== undefined ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">{stats.viewCount || 0}</div>
                  <div className="text-sm text-gray-600">👁️ Views</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-red-600">{stats.likeCount || 0}</div>
                  <div className="text-sm text-gray-600">❤️ Likes</div>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                <div className="text-3xl mb-2">📈</div>
                <p className="text-gray-600">Statistics are encrypted</p>
                <p className="text-sm text-gray-500 mt-1">Only post author can decrypt and view statistics</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onView(post.postId)}
              disabled={isLoadingAction}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              <span>👁️</span>
              <span>View Post</span>
            </button>
            
            <button
              onClick={() => onLike(post.postId)}
              disabled={isLoadingAction}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              <span>❤️</span>
              <span>Like Post</span>
            </button>
          </div>

          {/* Encryption Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🔐 FHEVM Encryption</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Content Encryption</strong>: Article content protected by Fully Homomorphic Encryption (FHE)</p>
              <p>• <strong>Statistics Privacy</strong>: Views, likes and other data fully encrypted</p>
              <p>• <strong>Access Control</strong>: Only authorized users can decrypt and view content</p>
              <p>• <strong>Decentralized</strong>: All data stored immutably on blockchain</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className={secondaryButtonClass}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
