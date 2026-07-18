# GitHub Secrets Configuration

This document explains the secrets needed for automated app store distribution via GitHub Actions.

## Required Secrets

### Expo (Required for building)

**EXPO_TOKEN**
- Generate from: https://expo.dev/settings/accounts/tokens
- Purpose: Authenticate with Expo services for building
- How to add: Settings → Secrets and variables → Actions → New repository secret

### Apple (Required for iOS submission)

**APPLE_ID**
- Email address for Apple Developer Account
- Example: `developer@zynkra.com`

**APPLE_PASSWORD**
- App-specific password (NOT regular Apple ID password)
- Generate from: https://appleid.apple.com/account/manage → Security → App-specific passwords
- Create password for "Zynkra Release"

**APPLE_TEAM_ID**
- Found in: https://developer.apple.com/account → Membership
- Example: `A1B2C3D4E5`

### Google Play (Required for Android submission)

**ANDROID_SERVICE_ACCOUNT**
- JSON key for service account
- Generate from: Google Cloud Console → Service Accounts
- Full JSON contents (minified)

## Setup Instructions

### 1. Generate Expo Token

```bash
# Login to Expo
eas login

# Generate token
eas credentials

# Copy token from settings
```

### 2. Generate Apple Credentials

```bash
# Login to Apple Developer
# Go to https://appleid.apple.com

# Create App-specific password:
# 1. Go to Security
# 2. Click "Generate app-specific password"
# 3. Select "Zynkra Release"
# 4. Copy password

# Get Team ID:
# 1. Go to https://developer.apple.com/account
# 2. Click your team name
# 3. Copy Team ID
```

### 3. Generate Google Play Service Account

```bash
# Go to Google Cloud Console
# https://console.cloud.google.com

# Create Project:
# 1. Click "Select a Project"
# 2. Click "New Project"
# 3. Name: "Zynkra-Release"
# 4. Click Create

# Enable API:
# 1. Search for "Google Play Android Developer API"
# 2. Click Enable

# Create Service Account:
# 1. Go to "Service Accounts"
# 2. Click "Create Service Account"
# 3. Fill details (name: "zynkra-release")
# 4. Click Create and Continue
# 5. Grant role: "Editor"
# 6. Click Continue

# Create Key:
# 1. Go to "Keys"
# 2. Add Key → Create new key
# 3. Select JSON
# 4. Copy entire JSON contents
# 5. Minify (remove whitespace) for single-line secret

# Add to Google Play Console:
# 1. Go to https://play.google.com/console
# 2. Settings → Users and permissions
# 3. Invite: <service-account-email>
# 4. Role: Admin
```

## Adding Secrets to GitHub

1. Go to repository: https://github.com/Podamekalajagadeesh/zynkra
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:

```
Name: EXPO_TOKEN
Value: <your-expo-token>

Name: APPLE_ID
Value: developer@zynkra.com

Name: APPLE_PASSWORD
Value: <your-app-specific-password>

Name: APPLE_TEAM_ID
Value: A1B2C3D4E5

Name: ANDROID_SERVICE_ACCOUNT
Value: {"type":"service_account","project_id":"zynkra-release",...}
```

## Testing Secrets

```bash
# Test Expo token
eas login

# Test Apple credentials
# Submit test build to TestFlight
eas submit --platform ios --profile preview

# Test Google Play credentials
# Submit test build to Play Console
eas submit --platform android --profile preview
```

## Rotating Secrets

Periodically update your secrets for security:

1. **Expo Token**: Generate new token, update EXPO_TOKEN
2. **Apple Password**: Generate new app-specific password, update APPLE_PASSWORD
3. **Google Service Account**: Delete old key, create new key, update ANDROID_SERVICE_ACCOUNT

## Troubleshooting

### "Invalid Expo Token"
- Regenerate token: https://expo.dev/settings/accounts/tokens
- Ensure token is not expired (3 months)

### "Apple authentication failed"
- Verify app-specific password is correct
- Ensure password is for "Zynkra Release" app
- Check Team ID is correct

### "Google Play authentication failed"
- Verify service account JSON is valid
- Ensure service account has Editor role in Google Play
- Check JSON is properly minified for GitHub secret

## Security Best Practices

1. **Never commit secrets** to version control
2. **Rotate secrets regularly** (quarterly)
3. **Use different credentials per environment**
4. **Monitor API access logs** for suspicious activity
5. **Enable two-factor authentication** on all accounts

## Local Development

For local testing without GitHub Actions:

```bash
# Set environment variables
export EXPO_TOKEN="your-token"
export APPLE_ID="your-email"
export APPLE_PASSWORD="your-app-password"
export APPLE_TEAM_ID="your-team-id"
export ANDROID_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Build and submit
npm run build:all
npm run submit:all
```
