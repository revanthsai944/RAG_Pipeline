#!/bin/bash

# RAG Microservice Setup Script

echo "🚀 Setting up RAG Microservice..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your OPENAI_API_KEY"
else
    echo "✅ .env file exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your OPENAI_API_KEY"
echo "2. Run: npm run dev (development)"
echo "3. Or run: npm start (production)"
echo ""
echo "Documentation: See README.md"
