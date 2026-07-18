# App Store Distribution Guide

This document provides comprehensive instructions for distributing Zynkra mobile app on iOS App Store and Google Play Store.

## Prerequisites

### System Requirements
- macOS 12.0 or later (for iOS builds)
- Node.js 18.x or later
- npm or yarn package manager

### Required Accounts
1. **Apple Developer Account** ($99/year)
   - Access to App Store Connect
   - Developer ID and Team ID
   
2. **Google Play Developer Account** ($25 one-time)
   - Access to Google Play Console
   - Service account for automated submissions

### Required Tools
```bash
# Install Expo CLI
npm install -g eas-cli

# Verify installation
eas --version
expo --version
```

---

## Pre-Distribution Checklist

Before submitting to app stores, ensure:

- [ ] App version bumped in `app.json` (ios.buildNumber, android.versionCode)
- [ ] All assets and icons properly configured
- [ ] Privacy policy URL available
- [ ] Terms of service URL available
- [ ] App Store description and promotional text ready
- [ ] Screenshots for app store listing (1242x2208 for iOS, 1080x1920 for Android)
- [ ] App category selected (Social Networking)
- [ ] Content rating completed
- [ ] Test accounts created for review team

---

## iOS App Store Distribution

### Step 1: Create App Store Connect Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "Create New App"
3. Select:
   - Platform: iOS
   - Name: Zynkra
   - Bundle ID: `com.zynkra.app`
   - SKU: `zynkra-1-0-0` (or similar)
   - Primary Language: English
   - Category: Social Networking

### Step 2: Generate iOS Build Credentials

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Setup iOS build credentials
eas credentials

# Follow prompts to:
# - Create app certificates (certificate + private key)
# - Create provisioning profiles
# - Store credentials securely
```

### Step 3: Create Production Build

```bash
# Build for App Store (testflight first for testing)
eas build --platform ios --profile preview

# Wait for build to complete (10-15 minutes)
# Download .ipa file from EAS dashboard
```

### Step 4: Configure App Store Metadata

1. In App Store Connect, go to your app
2. Go to "App Information":
   - Privacy Policy URL: https://zynkra.com/privacy
   - Terms of Use URL: https://zynkra.com/terms
   - Support URL: https://support.zynkra.com

3. Go to "Pricing and Availability":
   - Price: Free (or paid tier)
   - Availability: Your target regions
   - Content Rating: Complete questionnaire

4. Go to "App Preview and Screenshots":
   - Add 2-5 screenshots (1242x2208 px)
   - Add preview video (optional)
   - Write description and promotional text

5. Go to "Version Information":
   - Version Number: 1.0.0
   - Build: Upload built .ipa
   - Description: App release notes
   - What's New in This Version: Feature highlights

### Step 5: Submit for Review

```bash
# Submit production build to TestFlight first
eas submit --platform ios --profile preview

# After TestFlight testing, promote to production:
eas submit --platform ios --profile production
```

**Note**: First submission typically takes 24-48 hours for review.

### Step 6: Monitor Review Status

- Check App Store Connect dashboard for review status
- Apple may request:
  - Clarification on features
  - Test account credentials
  - Video demos of functionality
- Address feedback and resubmit if needed

---

## Android Google Play Distribution

### Step 1: Create Google Play Console App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Enter:
   - App name: Zynkra
   - Default language: English
   - App category: Social
   - App type: Application

### Step 2: Generate Android Build Credentials

```bash
# Generate signing key (if not already created)
eas credentials

# Select Android and follow prompts to:
# - Create keystore
# - Generate signing key
# - Save credentials securely
```

### Step 3: Create Production Build

```bash
# Build for Google Play
eas build --platform android --profile production

# Wait for build to complete (20-30 minutes)
# Download .aab (Android App Bundle) file
```

### Step 4: Create Google Play Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "Zynkra-Release"
3. Enable Google Play Android Developer API
4. Create service account:
   ```bash
   # Create service account JSON key
   # Download and save as `google-play-credentials.json`
   ```

5. Grant permissions:
   - Go to Google Play Console → Settings → Users and permissions
   - Add service account with "Admin" role

### Step 5: Configure Google Play Metadata

1. In Google Play Console, go to your app
2. Go to "Store presence" → "App details":
   - App name: Zynkra
   - Short description (80 chars max)
   - Full description
   - Screenshots (1080x1920 px, up to 8)
   - Feature image: 1024x500 px
   - Icon: 512x512 px
   - Cover art: 1024x500 px

3. Go to "Content rating":
   - Fill questionnaire
   - Get content rating

4. Go to "Target audience":
   - Select target age range
   - Content guidelines compliance

5. Go to "Pricing and distribution":
   - Price: Free
   - Countries/regions
   - Content rating

### Step 6: Submit for Review

```bash
# Setup Google Play credentials
export GOOGLE_PLAY_SERVICE_ACCOUNT_JSON="$(cat google-play-credentials.json)"

# Submit Android build
eas submit --platform android --profile production

# Or manually upload to Google Play Console:
# 1. Go to "Release" → "Production"
# 2. Upload .aab file
# 3. Add release notes
# 4. Click "Review" and "Publish"
```

**Note**: First submission typically takes 2-3 hours for review.

### Step 7: Monitor Review Status

- Check Google Play Console dashboard
- Google typically accepts apps faster than Apple
- Common rejection reasons:
  - Privacy policy not provided
  - Misleading content
  - Prohibited behavior

---

## Release Notes Template

Use this template for each release:

```
Version 1.0.0
- Initial launch
- User profiles and authentication
- Posts and comments
- Direct messaging
- Feed personalization
- Offline support
- End-to-end encryption for DMs

Bug fixes and performance improvements
```

---

## Build and Version Management

### Incrementing Versions

**iOS:**
```json
// app.json
"ios": {
  "buildNumber": "2"  // Increment for each build
}
```

**Android:**
```json
// app.json
"android": {
  "versionCode": 2  // Increment for each build
}
```

Both platforms share the `version` field (1.0.0, 1.0.1, etc.)

### Build Commands

```bash
# Preview build (for testing)
eas build --platform all --profile preview

# Production build (for app stores)
eas build --platform all --profile production

# Build specific platform
eas build --platform ios --profile production
eas build --platform android --profile production

# Clean build (without cache)
eas build --platform all --clean
```

---

## Automation (Optional)

### GitHub Actions for Automated Deployment

Create `.github/workflows/app-store-release.yml`:

```yaml
name: App Store Release

on:
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to release'
        required: true
        default: 'all'
        type: choice
        options:
          - ios
          - android
          - all

jobs:
  build-and-submit:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install EAS CLI
        run: npm install -g eas-cli
      
      - name: Login to Expo
        run: eas login --username=${{ secrets.EXPO_USERNAME }} --password=${{ secrets.EXPO_PASSWORD }}
      
      - name: Build and Submit
        run: |
          if [ "${{ github.event.inputs.platform }}" = "all" ]; then
            eas build --platform all --profile production
            eas submit --platform all --profile production
          else
            eas build --platform ${{ github.event.inputs.platform }} --profile production
            eas submit --platform ${{ github.event.inputs.platform }} --profile production
          fi
```

---

## Troubleshooting

### Common Issues

**iOS:**
- "Certificate expired" → Regenerate via `eas credentials`
- "Provisioning profile invalid" → Delete and recreate
- "Code signing failed" → Check certificate in Keychain

**Android:**
- "Signing key mismatch" → Ensure keystore matches Google Play key
- "Service account permission denied" → Verify IAM roles in Google Cloud
- "Version code too low" → Increment versionCode in app.json

### Support

For issues with:
- **Expo/EAS**: [docs.expo.dev](https://docs.expo.dev)
- **App Store Connect**: [developer.apple.com](https://developer.apple.com/app-store-connect/)
- **Google Play Console**: [support.google.com/googleplay](https://support.google.com/googleplay)

---

## Post-Launch Monitoring

### Key Metrics to Track

1. **Installation metrics**
   - Download count
   - Install success rate
   - Uninstall rate

2. **User engagement**
   - Daily Active Users (DAU)
   - Session length
   - Feature usage

3. **Crash reporting**
   - Monitor via Sentry or Crashlytics
   - Fix critical issues ASAP

4. **Reviews and ratings**
   - Respond to user reviews
   - Address common complaints
   - Use feedback for improvements

### Update Strategy

- **Critical bugs**: Release ASAP (within 24 hours)
- **Minor fixes**: Bundle with feature releases
- **Major features**: Plan 2-week release cycles
- **Performance**: Continuous optimization

---

## Summary Checklist

- [ ] Setup Apple Developer Account
- [ ] Setup Google Play Developer Account
- [ ] Configure app.json with store metadata
- [ ] Generate iOS certificates and provisioning profiles
- [ ] Generate Android signing key
- [ ] Create production builds
- [ ] Configure App Store Connect metadata
- [ ] Configure Google Play metadata
- [ ] Submit for iOS review
- [ ] Submit for Android review
- [ ] Monitor approval status
- [ ] Launch and monitor user metrics

**Status**: ✅ Ready for production distribution
