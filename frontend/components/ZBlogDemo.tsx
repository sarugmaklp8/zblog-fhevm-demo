"use client";

import { useState } from "react";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useZBlog, BlogPost } from "@/hooks/useZBlog";
import { PostDetail } from "./PostDetail";

/*
 * Main ZBlog React component - Encrypted Blog Platform
 * Features:
 * - Create encrypted blog posts
 * - View and manage posts
 * - Grant access permissions
 * - Decrypt statistics for authors
 */
export const ZBlogDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  
  // State for UI
  const [activeTab, setActiveTab] = useState<"create" | "posts" | "stats">("posts");
  const [newPostContent, setNewPostContent] = useState<string>("");
  const [newPostCategory, setNewPostCategory] = useState<number>(1);
  const [newPostAccessLevel, setNewPostAccessLevel] = useState<number>(0);
  const [newPostPrice, setNewPostPrice] = useState<number>(0);
  const [grantAccessPostId, setGrantAccessPostId] = useState<string>("");
  const [grantAccessReader, setGrantAccessReader] = useState<string>("");
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<BlogPost | null>(null);

  // MetaMask integration
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  // FHEVM instance
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  // ZBlog contract integration
  const zBlog = useZBlog({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  // Handle post creation
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      alert("Please enter post content");
      return;
    }
    
    await zBlog.createPost(
      newPostContent,
      newPostCategory,
      newPostAccessLevel,
      newPostPrice
    );
    
    // Clear form
    setNewPostContent("");
    setNewPostCategory(1);
    setNewPostAccessLevel(0);
    setNewPostPrice(0);
  };

  // Handle grant access
  const handleGrantAccess = async () => {
    if (!grantAccessPostId || !grantAccessReader) {
      alert("Please enter both post ID and reader address");
      return;
    }
    
    await zBlog.grantAccess(grantAccessPostId, grantAccessReader);
    
    // Clear form
    setGrantAccessPostId("");
    setGrantAccessReader("");
  };

  // UI styling classes
  const buttonClass = "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium";
  const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const tabClass = (isActive: boolean) => `px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;

  // Connection status display
  const getConnectionStatus = () => {
    if (!isConnected) return "❌ Not Connected";
    if (fhevmStatus === "loading") return "🔄 Loading FHEVM...";
    if (fhevmStatus === "error") return "❌ FHEVM Error";
    if (fhevmStatus === "ready") {
      const networkName = chainId === 31337 ? "Localhost (Mock)" : chainId === 11155111 ? "Sepolia (Live)" : "Unknown Network";
      return `✅ Ready (${networkName})`;
    }
    return "⏳ Initializing...";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">zBlog</h1>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Encrypted Blog Platform
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{getConnectionStatus()}</span>
              {!isConnected && (
                <button onClick={connect} className={buttonClass}>
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {!isConnected ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Connect your wallet to start using zBlog
            </h2>
            <p className="text-gray-600 mb-6">
              zBlog is a fully encrypted blog platform powered by FHEVM technology
            </p>
            <button onClick={connect} className={buttonClass}>
              Connect MetaMask
            </button>
          </div>
        ) : !zBlog.isDeployed ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              zBlog Contract Not Deployed
            </h3>
            <p className="text-yellow-700">
              The zBlog contract is not deployed on this network (Chain ID: {chainId}).
              Please deploy the contract or switch to a supported network.
            </p>
          </div>
        ) : fhevmStatus !== "ready" ? (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-700">Loading FHEVM...</h3>
              <p className="text-gray-600">Please wait while we initialize the encryption system</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Status Display */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{zBlog.totalPosts}</div>
                  <div className="text-sm text-gray-600">Total Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{zBlog.posts.length}</div>
                  <div className="text-sm text-gray-600">Your Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {accounts?.[0] ? `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` : ""}
                  </div>
                  <div className="text-sm text-gray-600">Your Address</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${chainId === 31337 ? 'text-orange-600' : chainId === 11155111 ? 'text-green-600' : 'text-gray-600'}`}>
                    {chainId === 31337 ? '🟠 Local' : chainId === 11155111 ? '🟢 Sepolia' : '❓ Unknown'}
                  </div>
                  <div className="text-sm text-gray-600">Network</div>
                </div>
              </div>
              
              {/* Network Switch Guide */}
              {chainId === 31337 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Switch to Sepolia</strong>: Currently using localhost (mock). Switch to Sepolia in MetaMask to use real FHEVM on live testnet!
                  </p>
                </div>
              )}
              
              {chainId === 11155111 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    🌟 <strong>Live on Sepolia</strong>: You&apos;re using real FHEVM on Sepolia testnet! Posts are permanently stored on blockchain.
                  </p>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("posts")}
                className={tabClass(activeTab === "posts")}
              >
                📚 My Posts
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={tabClass(activeTab === "create")}
              >
                ✍️ Create Post
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={tabClass(activeTab === "stats")}
              >
                📊 Manage Access
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border p-6 min-h-96">
              {activeTab === "posts" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Your Blog Posts</h3>
                    <button
                      onClick={zBlog.loadUserPosts}
                      disabled={zBlog.isLoadingPosts}
                      className={`text-sm ${buttonClass}`}
                    >
                      {zBlog.isLoadingPosts ? "Loading..." : "Refresh"}
                    </button>
                  </div>

                  {zBlog.posts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">📝</div>
                      <p>No blog posts yet. Create your first encrypted post!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {zBlog.posts.map((post) => (
                        <div key={post.postId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">Post #{post.postId}</h4>
                            <span className="text-sm text-gray-500">
                              {post.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">Author: {post.author}</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setSelectedPostForDetail(post)}
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              📄 View Details
                            </button>
                            <button
                              onClick={() => zBlog.viewPost(post.postId)}
                              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              👁️ View
                            </button>
                            <button
                              onClick={() => zBlog.likePost(post.postId)}
                              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                              ❤️ Like
                            </button>
                            <button
                              onClick={() => zBlog.decryptPostStats(post.postId)}
                              className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                            >
                              📊 Stats
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "create" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Create New Encrypted Post</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Post Content
                      </label>
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Write your encrypted blog post content here..."
                        rows={6}
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category (1-10)
                        </label>
                        <select
                          value={newPostCategory}
                          onChange={(e) => setNewPostCategory(Number(e.target.value))}
                          className={inputClass}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cat) => (
                            <option key={cat} value={cat}>
                              Category {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Access Level
                        </label>
                        <select
                          value={newPostAccessLevel}
                          onChange={(e) => setNewPostAccessLevel(Number(e.target.value))}
                          className={inputClass}
                        >
                          <option value={0}>🌍 Public</option>
                          <option value={1}>👥 Friends Only</option>
                          <option value={2}>👤 Specific Users</option>
                          <option value={3}>💰 Paid Content</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (if paid)
                        </label>
                        <input
                          type="number"
                          value={newPostPrice}
                          onChange={(e) => setNewPostPrice(Number(e.target.value))}
                          placeholder="0"
                          min="0"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleCreatePost}
                      disabled={!zBlog.canPerformActions || zBlog.isCreatingPost}
                      className={buttonClass}
                    >
                      {zBlog.isCreatingPost ? "🔐 Creating Encrypted Post..." : "📝 Create Post"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "stats" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Access Management</h3>
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Grant Access to Reader</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Post ID
                          </label>
                          <input
                            type="text"
                            value={grantAccessPostId}
                            onChange={(e) => setGrantAccessPostId(e.target.value)}
                            placeholder="Enter post ID"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reader Address
                          </label>
                          <input
                            type="text"
                            value={grantAccessReader}
                            onChange={(e) => setGrantAccessReader(e.target.value)}
                            placeholder="0x..."
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleGrantAccess}
                        disabled={!zBlog.canPerformActions}
                        className={`mt-4 ${buttonClass}`}
                      >
                        🔑 Grant Access
                      </button>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">💡 Access Management Tips</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Grant access to specific readers for private posts</li>
                        <li>• Post authors can always access their own encrypted data</li>
                        <li>• Use &quot;Decrypt Stats&quot; to view engagement metrics</li>
                        <li>• Access permissions are permanent and encrypted</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Message */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-sm font-medium text-gray-900">{zBlog.message}</span>
              </div>
            </div>
          </div>
        )}

        {/* Post Detail Modal */}
        {selectedPostForDetail && (
          <PostDetail
            post={selectedPostForDetail}
            onClose={() => setSelectedPostForDetail(null)}
            onView={zBlog.viewPost}
            onLike={zBlog.likePost}
            onDecryptStats={zBlog.decryptPostStats}
            isLoadingAction={zBlog.isCreatingPost || zBlog.isLoadingPosts}
            fhevmInstance={fhevmInstance}
            ethersSigner={ethersSigner}
            contractAddress={zBlog.contractAddress}
            fhevmDecryptionSignatureStorage={fhevmDecryptionSignatureStorage}
          />
        )}
      </div>
    </div>
  );
};
