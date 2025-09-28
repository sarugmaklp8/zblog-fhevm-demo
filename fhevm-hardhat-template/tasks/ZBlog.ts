import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { ZBlog } from "../types";

task("zblog:create-post")
  .addParam("contract", "The ZBlog contract address")
  .addParam("content", "Content hash for the blog post")
  .addParam("category", "Category of the blog post (1-10)")
  .addParam("access", "Access level (0=public, 1=friends, 2=specific, 3=paid)")
  .addParam("price", "Price for paid content (in wei)", "0")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, content, category, access, price } = taskArguments;

    const [signer] = await ethers.getSigners();
    console.log("Creating blog post with account:", signer.address);

    const zBlog = (await ethers.getContractAt("ZBlog", contractAddress)) as ZBlog;

    // Create encrypted inputs
    const contentHashValue = parseInt(content);
    const categoryValue = parseInt(category);
    const accessValue = parseInt(access);
    const priceValue = parseInt(price);

    console.log("Post parameters:");
    console.log("- Content hash:", contentHashValue);
    console.log("- Category:", categoryValue);
    console.log("- Access level:", accessValue);
    console.log("- Price:", priceValue);

    // Note: In a real implementation, you would use the FHEVM client to create encrypted inputs
    // For now, this is a placeholder showing the structure
    console.log("⚠️  This task requires FHEVM client integration for encrypted inputs");
    console.log("Please use the frontend interface to create posts with proper encryption");
  });

task("zblog:grant-access")
  .addParam("contract", "The ZBlog contract address")
  .addParam("postid", "The blog post ID")
  .addParam("reader", "The reader address to grant access to")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, postid, reader } = taskArguments;

    const [signer] = await ethers.getSigners();
    console.log("Granting access with account:", signer.address);

    const zBlog = (await ethers.getContractAt("ZBlog", contractAddress)) as ZBlog;

    console.log(`Granting access for post ${postid} to reader ${reader}`);

    try {
      const tx = await zBlog.grantAccess(postid, reader);
      const receipt = await tx.wait();

      console.log("✅ Access granted successfully!");
      console.log("Transaction hash:", receipt?.hash);
    } catch (error) {
      console.error("❌ Error granting access:", error);
    }
  });

task("zblog:view-post")
  .addParam("contract", "The ZBlog contract address")
  .addParam("postid", "The blog post ID")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, postid } = taskArguments;

    const [signer] = await ethers.getSigners();
    console.log("Viewing post with account:", signer.address);

    const zBlog = (await ethers.getContractAt("ZBlog", contractAddress)) as ZBlog;

    try {
      const tx = await zBlog.viewPost(postid);
      const receipt = await tx.wait();

      console.log("✅ Post viewed successfully!");
      console.log("Transaction hash:", receipt?.hash);
    } catch (error) {
      console.error("❌ Error viewing post:", error);
    }
  });

task("zblog:like-post")
  .addParam("contract", "The ZBlog contract address")
  .addParam("postid", "The blog post ID")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, postid } = taskArguments;

    const [signer] = await ethers.getSigners();
    console.log("Liking post with account:", signer.address);

    const zBlog = (await ethers.getContractAt("ZBlog", contractAddress)) as ZBlog;

    try {
      const tx = await zBlog.likePost(postid);
      const receipt = await tx.wait();

      console.log("✅ Post liked successfully!");
      console.log("Transaction hash:", receipt?.hash);
    } catch (error) {
      console.error("❌ Error liking post:", error);
    }
  });

task("zblog:get-post")
  .addParam("contract", "The ZBlog contract address")
  .addParam("postid", "The blog post ID")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, postid } = taskArguments;

    const zBlog = (await ethers.getContractAt("ZBlog", contractAddress)) as ZBlog;

    try {
      const post = await zBlog.getPost(postid);
      console.log("📄 Blog Post Information:");
      console.log("- Post ID:", post[0].toString());
      console.log("- Author:", post[1]);
      console.log("- Created At:", new Date(post[2].toNumber() * 1000).toLocaleString());
    } catch (error) {
      console.error("❌ Error getting post:", error);
    }
  });

task("zblog:get-total-posts")
  .addParam("contract", "The ZBlog contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress } = taskArguments;

    const zBlog = (await ethers.getContractAt("ZBlog", contractAddress)) as ZBlog;

    try {
      const totalPosts = await zBlog.getTotalPosts();
      console.log("📊 Total Posts:", totalPosts.toString());
    } catch (error) {
      console.error("❌ Error getting total posts:", error);
    }
  });

task("zblog:get-user-posts")
  .addParam("contract", "The ZBlog contract address")
  .addParam("user", "The user address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, user } = taskArguments;

    const zBlog = (await ethers.getContractAt("ZBlog", contractAddress)) as ZBlog;

    try {
      const userPosts = await zBlog.getUserPosts(user);
      console.log(`📚 Posts by user ${user}:`);
      console.log("Post IDs:", userPosts.map(id => id.toString()));
    } catch (error) {
      console.error("❌ Error getting user posts:", error);
    }
  });

export {};
