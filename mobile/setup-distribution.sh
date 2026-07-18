#!/bin/bash

# App Store Distribution Setup Script
# This script guides you through setting up credentials for app store distribution

set -e

echo "🚀 Zynkra App Store Distribution Setup"
echo "======================================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Change to mobile directory
cd "$(dirname "$0")"

echo "📱 Setting up app store credentials..."
echo ""

# Authenticate with Expo
echo "1️⃣  Authenticating with Expo..."
eas login

# Setup build credentials
echo ""
echo "2️⃣  Setting up build credentials..."
eas credentials

# Initialize EAS project
echo ""
echo "3️⃣  Initializing EAS project..."
eas project:info

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://appstoreconnect.apple.com and create your app"
echo "2. Go to https://play.google.com/console and create your app"
echo "3. Update app.json with your bundle IDs and app IDs"
echo "4. Run: npm run build:preview"
echo "5. After testing, run: npm run build:all && npm run submit:all"
echo ""
echo "For detailed instructions, see: APP_STORE_DISTRIBUTION.md"
