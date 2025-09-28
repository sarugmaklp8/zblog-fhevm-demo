import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "../fhevm/fhevmTypes";
import { ZBlogABI } from "../abi/ZBlogABI";
import { getZBlogAddress, isZBlogDeployed } from "../abi/ZBlogAddresses";
import { GenericStringStorage } from "../fhevm/GenericStringStorage";
import { FhevmDecryptionSignature } from "../fhevm/FhevmDecryptionSignature";
import { storeContentByPostId } from "../utils/contentStorage";
import { encodeTextToParts } from "../utils/textEncoding";

export interface BlogPost {
  postId: string;
  author: string;
  createdAt: Date;
  encryptedContentHash?: bigint;
  category?: number;
  viewCount?: number;
  likeCount?: number;
  isActive?: boolean;
}

export interface UseZBlogParams {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.Signer | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: { current: (chainId: number) => boolean };
  sameSigner: { current: (signer: ethers.JsonRpcSigner | undefined) => boolean };
}

export const useZBlog = (params: UseZBlogParams) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = params;

  // State
  const [message, setMessage] = useState<string>("Ready");
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Refs for preventing double execution
  const isCreatingPostRef = useRef<boolean>(false);
  const isLoadingPostsRef = useRef<boolean>(false);

  // Get contract address and check deployment
  const contractAddress = useMemo(() => {
    if (!chainId) return undefined;
    return getZBlogAddress(chainId);
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!chainId) return false;
    return isZBlogDeployed(chainId);
  }, [chainId]);

  // Create contract instance
  const contract = useMemo(() => {
    if (!contractAddress || !ethersReadonlyProvider) return undefined;
    return new ethers.Contract(contractAddress, ZBlogABI, ethersReadonlyProvider);
  }, [contractAddress, ethersReadonlyProvider]);

  // Check if user can interact (移除loading状态依赖避免循环)
  const canInteract = useMemo(() => {
    return (
      isDeployed &&
      contractAddress &&
      instance &&
      ethersSigner
    );
  }, [isDeployed, contractAddress, instance, ethersSigner]);

  // 单独的交互检查，包含loading状态
  const canPerformActions = useMemo(() => {
    return canInteract && !isCreatingPost && !isLoadingPosts;
  }, [canInteract, isCreatingPost, isLoadingPosts]);

  /**
   * Create a new blog post
   */
  const createPost = useCallback(
    async (content: string, category: number, accessLevel: number, price: number = 0) => {
      if (isCreatingPostRef.current || !canInteract) {
        return;
      }

      const thisChainId = chainId;
      const thisEthersSigner = ethersSigner;
      const thisContractAddress = contractAddress;

      if (!thisChainId || !thisEthersSigner || !thisContractAddress || !instance) {
        setMessage("Missing required parameters for post creation");
        return;
      }

      isCreatingPostRef.current = true;
      setIsCreatingPost(true);
      setMessage("Creating encrypted blog post...");

      try {
        const contractWithSigner = new ethers.Contract(
          thisContractAddress,
          ZBlogABI,
          thisEthersSigner
        );

        const userAddress = await thisEthersSigner.getAddress();

        // 将文本内容编码为可加密的数字部分
        const encodedContent = encodeTextToParts(content);
        
        console.log(`[CreatePost] 编码文本内容:`, encodedContent);

        // Create encrypted inputs
        const input = instance.createEncryptedInput(thisContractAddress, userAddress);
        
        input.add32(encodedContent.part1);      // Content part 1
        input.add32(encodedContent.part2);      // Content part 2
        input.add32(encodedContent.part3);      // Content part 3
        input.add32(encodedContent.length);     // Content length
        input.add8(category);                   // Category
        input.add8(accessLevel);                // Access level
        input.add32(price);                     // Price

        const encryptedInput = await input.encrypt();

        setMessage("Submitting transaction...");

        // Call contract
        const tx = await contractWithSigner.createPost(
          encryptedInput.handles[0],  // contentPart1Input
          encryptedInput.handles[1],  // contentPart2Input
          encryptedInput.handles[2],  // contentPart3Input
          encryptedInput.handles[3],  // contentLengthInput
          encryptedInput.handles[4],  // categoryInput
          encryptedInput.handles[5],  // accessLevelInput
          encryptedInput.handles[6],  // priceInput
          encryptedInput.inputProof
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          // Extract post ID from event logs
          const postCreatedEvent = receipt.logs.find((log: any) => {
            try {
              const parsedLog = contractWithSigner.interface.parseLog(log);
              return parsedLog?.name === "PostCreated";
            } catch {
              return false;
            }
          });

          let postId = "unknown";
          if (postCreatedEvent) {
            const parsedLog = contractWithSigner.interface.parseLog(postCreatedEvent);
            postId = parsedLog?.args?.postId?.toString();
          }

          // 存储文章内容到本地存储系统（模拟IPFS）
          // 使用postId作为唯一标识符
          const contentStored = storeContentByPostId(
            postId,
            content.split('\n')[0] || `Article #${postId}`, // 使用第一行作为标题
            content,
            userAddress,
            category
          );

          if (contentStored) {
            setMessage(`✅ 文章创建成功！Post ID: ${postId}, 文本已加密存储`);
            console.log(`[CreatePost] 文章内容已存储，编码: `, encodedContent);
          } else {
            setMessage(`⚠️ 文章创建成功但内容存储失败！Post ID: ${postId}`);
          }

          // Refresh posts list
          loadUserPosts();
        } else {
          setMessage("❌ Transaction failed");
        }
      } catch (error: any) {
        console.error("Error creating post:", error);
        setMessage(`❌ Error creating post: ${error.message}`);
      } finally {
        isCreatingPostRef.current = false;
        setIsCreatingPost(false);
      }
    },
    [canInteract, chainId, ethersSigner, contractAddress, instance]
  );

  /**
   * Load user's posts
   */
  const loadUserPosts = useCallback(async () => {
    if (isLoadingPostsRef.current || !contract || !ethersSigner) {
      return;
    }

    isLoadingPostsRef.current = true;
    setIsLoadingPosts(true);
    setMessage("Loading your blog posts...");

    try {
      const userAddress = await ethersSigner.getAddress();
      const userPostIds = await contract.getUserPosts(userAddress);
      
      setMessage(`Loading ${userPostIds.length} posts...`);
      
      const loadedPosts: BlogPost[] = [];
      
      for (const postId of userPostIds) {
        try {
          const postData = await contract.getPost(postId);
          const post: BlogPost = {
            postId: postId.toString(),
            author: postData[1],
            createdAt: new Date(Number(postData[2]) * 1000),
          };
          loadedPosts.push(post);
        } catch (error) {
          console.error(`Error loading post ${postId}:`, error);
        }
      }

      setPosts(loadedPosts);
      setMessage(`✅ Loaded ${loadedPosts.length} blog posts`);
    } catch (error: any) {
      console.error("Error loading posts:", error);
      setMessage(`❌ Error loading posts: ${error.message}`);
    } finally {
      isLoadingPostsRef.current = false;
      setIsLoadingPosts(false);
    }
  }, [contract, ethersSigner]);

  /**
   * Load total posts count
   */
  const loadTotalPosts = useCallback(async () => {
    if (!contract) return;

    try {
      const total = await contract.getTotalPosts();
      setTotalPosts(Number(total));
    } catch (error) {
      console.error("Error loading total posts:", error);
    }
  }, [contract]);

  /**
   * View a post (increment view count)
   */
  const viewPost = useCallback(
    async (postId: string) => {
      if (!canPerformActions) return;

      try {
        const contractWithSigner = new ethers.Contract(
          contractAddress!,
          ZBlogABI,
          ethersSigner!
        );

        setMessage(`Viewing post ${postId}...`);
        const tx = await contractWithSigner.viewPost(postId);
        await tx.wait();
        setMessage(`✅ Post ${postId} viewed`);
      } catch (error: any) {
        console.error("Error viewing post:", error);
        setMessage(`❌ Error viewing post: ${error.message}`);
      }
    },
    [canInteract, contractAddress, ethersSigner]
  );

  /**
   * Like a post
   */
  const likePost = useCallback(
    async (postId: string) => {
      if (!canPerformActions) return;

      try {
        const contractWithSigner = new ethers.Contract(
          contractAddress!,
          ZBlogABI,
          ethersSigner!
        );

        setMessage(`Liking post ${postId}...`);
        const tx = await contractWithSigner.likePost(postId);
        await tx.wait();
        setMessage(`✅ Post ${postId} liked`);
      } catch (error: any) {
        console.error("Error liking post:", error);
        setMessage(`❌ Error liking post: ${error.message}`);
      }
    },
    [canInteract, contractAddress, ethersSigner]
  );

  /**
   * Grant access to a specific user
   */
  const grantAccess = useCallback(
    async (postId: string, readerAddress: string) => {
      if (!canPerformActions) return;

      try {
        const contractWithSigner = new ethers.Contract(
          contractAddress!,
          ZBlogABI,
          ethersSigner!
        );

        setMessage(`Granting access for post ${postId} to ${readerAddress}...`);
        const tx = await contractWithSigner.grantAccess(postId, readerAddress);
        await tx.wait();
        setMessage(`✅ Access granted for post ${postId}`);
      } catch (error: any) {
        console.error("Error granting access:", error);
        setMessage(`❌ Error granting access: ${error.message}`);
      }
    },
    [canInteract, contractAddress, ethersSigner]
  );

  /**
   * Decrypt post statistics (for post author)
   */
  const decryptPostStats = useCallback(
    async (postId: string) => {
      if (!canPerformActions || !instance) return;

      try {
        setMessage(`Decrypting statistics for post ${postId}...`);

        const userAddress = await ethersSigner!.getAddress();
        
        // Create or load decryption signature
        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            instance,
            [contractAddress! as `0x${string}`],
            ethersSigner!,
            fhevmDecryptionSignatureStorage
          );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return;
        }

        // Get encrypted handles
        const viewCountHandle = await contract!.getEncryptedViewCount(postId);
        const likeCountHandle = await contract!.getEncryptedLikeCount(postId);

        // Decrypt the values
        const results = await instance.userDecrypt(
          [
            { handle: viewCountHandle, contractAddress: contractAddress! },
            { handle: likeCountHandle, contractAddress: contractAddress! },
          ],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        const viewCountRaw = results[viewCountHandle.toString()];
        const likeCountRaw = results[likeCountHandle.toString()];

        // Convert to numbers for consistent return type
        const viewCount = typeof viewCountRaw === 'string' ? parseInt(viewCountRaw) : Number(viewCountRaw);
        const likeCount = typeof likeCountRaw === 'string' ? parseInt(likeCountRaw) : Number(likeCountRaw);

        setMessage(`✅ Post ${postId} stats - Views: ${viewCount}, Likes: ${likeCount}`);
        
        return { viewCount, likeCount };
      } catch (error: any) {
        console.error("Error decrypting post stats:", error);
        setMessage(`❌ Error decrypting stats: ${error.message}`);
      }
    },
    [canInteract, instance, contractAddress, ethersSigner, fhevmDecryptionSignatureStorage, contract]
  );

  // Auto-load data when contract becomes available
  useEffect(() => {
    if (canInteract) {
      loadUserPosts();
      loadTotalPosts();
    }
  }, [canInteract]); // 移除函数依赖，避免无限循环

  return {
    // State
    message,
    isCreatingPost,
    isLoadingPosts,
    posts,
    totalPosts,
    selectedPost,
    
    // Contract info
    contractAddress,
    isDeployed,
    canInteract,
    canPerformActions,
    
    // Actions
    createPost,
    loadUserPosts,
    viewPost,
    likePost,
    grantAccess,
    decryptPostStats,
    setSelectedPost,
  };
};
