#!/bin/bash

# Simple static file server for zBlog
echo "🚀 Starting zBlog Static Server..."
echo "📁 Serving files from: $(pwd)/out/"
echo "🌐 URL: http://localhost:8080"
echo ""
echo "⚠️  Note: For full FHEVM functionality, you may need HTTPS in production"
echo "🔧 Press Ctrl+C to stop the server"
echo ""

cd out && python3 -m http.server 8080
