# Mobile App Distribution

This directory contains configuration and scripts for distributing the Zynkra mobile app to iOS App Store and Google Play Store.

## Quick Start

```bash
# 1. Setup credentials (one-time)
cd mobile
chmod +x setup-distribution.sh
./setup-distribution.sh

# 2. Prepare release artifacts
npm run prepare:artifacts

# 3. Build apps
npm run build:all

# 4. Submit to stores
npm run submit:all
```

## Available Commands

```bash
# Build commands
npm run build:preview          # Preview builds (for testing)
npm run build:ios             # iOS production build
npm run build:android         # Android production build
npm run build:all             # Both platforms production
npm run build:clean           # Clean build (no cache)

# Submission commands
npm run submit:ios            # Submit iOS build to App Store
npm run submit:android        # Submit Android to Google Play
npm run submit:all            # Submit both

# Combined commands
npm run release               # Build + submit all platforms
```

## Configuration Files

### app.json
Main Expo configuration with app store metadata:
- Bundle IDs and package names
- App icons and splash screens
- Privacy policy and permissions
- Store-specific settings

### eas.json
EAS Build configuration:
- Build profiles (preview, production)
- Build resources
- Submission settings
- App Store Connect IDs

### store-config.json
App store metadata and versioning:
- App descriptions
- Keywords and categories
- Release notes
- Environment configuration

## Documentation

- **[APP_STORE_DISTRIBUTION.md](APP_STORE_DISTRIBUTION.md)** - Comprehensive distribution guide
- **[../.github/SECRETS.md](../.github/SECRETS.md)** - Secrets and credentials setup

## Workflow

1. **Local Development**
   - Use `npm start` to run dev server
   - Test on iOS/Android emulators

2. **Build**
   - Increment version in app.json
   - Run `npm run build:all`
   - Wait for builds to complete

3. **Test**
   - Download build from EAS dashboard
   - Install on test device
   - Test all features
   - Fix any issues

4. **Submit**
   - Configure store metadata
   - Run `npm run submit:all`
   - Monitor approval status

5. **Launch**
   - Approve release in App Store Connect
   - Publish to Google Play
   - Monitor user feedback

## Automated Releases (GitHub Actions)

Releases can be automated via GitHub Actions:

```bash
# Trigger workflow from GitHub UI
# Settings → Actions → App Store Release

# Or via GitHub CLI
gh workflow run app-store-release.yml \
  -f platform=all \
  -f profile=production \
  -f skip_submit=false
```

## Version Management

### Current Version: 1.0.0

To update version:

1. Edit `app.json`:
   ```json
   "version": "1.0.1",
   "ios": { "buildNumber": "2" },
   "android": { "versionCode": 2 }
   ```

2. Update release notes in `store-config.json`
3. Build and submit

## Monitoring

After launch, monitor:

- **App Store Connect**: User ratings, crashes, reviews
- **Google Play Console**: Downloads, ratings, reviews
- **Analytics**: DAU, session length, feature usage
- **Crash reporting**: Monitor via Sentry/Crashlytics

## Support

For issues:
- **Expo**: https://docs.expo.dev
- **Apple**: https://developer.apple.com/support
- **Google**: https://support.google.com/googleplay

## Status

✅ **App Store Distribution Ready**

- [x] iOS App Store configured
- [x] Google Play Store configured
- [x] Build system setup (EAS)
- [x] CI/CD pipeline ready
- [x] Secrets management configured
- [x] Documentation complete

**Next**: Follow APP_STORE_DISTRIBUTION.md to submit your app!
