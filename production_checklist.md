# FriendLens Production & Play Store Deployment Checklist

This document acts as a comprehensive reference guide for deploying the **FriendLens** React Native Expo application to the Google Play Store.

---

## 1. Readiness & Current State
- **Package Name**: Configured as `com.friendlens.app` in `app.json`.
- **Deep Linking Scheme**: Configured as `friendlens` in `app.json`.
- **App Icons**: High-quality adaptive icons, monochrome icons, and splash screens are configured in `assets/images/`.
- **Android versioning**: `"versionCode": 1` is configured under `expo.android` in `app.json`.
- **In-App Prominent Disclosure**: 
  - **Implemented**: When a user goes to **Discover Friends**, they are presented with an explicit confirmation dialog before the OS-level contacts permissions are requested, complying with Google Play policies.

---

## 2. Privacy Check: Contact Discovery
### How it works
Your app asks for `android.permission.READ_CONTACTS`. For maximum user privacy:
- The app fetches registered profiles from Supabase that have associated phone numbers.
- **Matching is done entirely in-memory on the user's device** inside `SupabaseConnectionRepository.ts` (in the `findUsersFromContacts` method).
- **The user's address book / contact list is NEVER uploaded, sent, or stored on your servers.**

### Privacy Policy Hosting (Free Options)
Because the app accesses contacts, Google Play requires a public Privacy Policy URL. Common free options include:
- **GitHub Pages**: Host a simple HTML file in your project repository under a `docs/` folder or `gh-pages` branch. URL format: `https://<username>.github.io/<repo-name>/privacy.html`.
- **Notion**: Write the privacy policy page on Notion and use the "Share to Web" link.
- **GitHub Gist**: Create a public markdown Gist and link to the raw page.
- **Free Generators**: Use services like [Flycricket](https://flycricket.com/) or [App-Privacy-Policy.com](https://app-privacy-policy.com/).

---

## 3. Local-Only Build & Deployment Alternative
If you want to avoid EAS Cloud build queue limits, you can build entirely locally:

### Option A: Local EAS Builds (`eas build --local`)
Runs the EAS build pipeline locally on your machine using your local build tools (requires Android SDK, JDK, and build tools).
```bash
# Configure EAS (first-time only, creates eas.json)
eas build:configure

# Build production release AAB locally
eas build --platform android --local --profile production
```

### Option B: Native Gradle Builds (Expo Prebuild)
Generates the standard Android project structure locally and compiles it directly using Gradle.
```bash
# 1. Generate the /android folder (creates/updates native files)
npx expo prebuild

# 2. Compile Release APK (for local testing)
cd android
./gradlew assembleRelease

# 3. Compile Release AAB (for Play Store upload)
./gradlew bundleRelease
```

---

## 4. Keystore Generation & Signing (Local)
To publish on the Google Play Store, the app must be signed with a production upload key (Keystore).

### Step 1: Generate the Keystore File
Run this command from your command line to create an upload key:
```bash
keytool -genkey -v -keystore friendlens-upload-key.keystore -alias friendlens-alias -keyalg RSA -keysize 2048 -validity 10000
```
> [!WARNING]
> Keep `friendlens-upload-key.keystore` safe! Do **NOT** commit it to GitHub. If you lose this key, you will not be able to send updates to your app on the Play Store.

### Step 2: Configure Signing in `android/app/build.gradle`
After generating the `android/` directory using `npx expo prebuild`, configure your signing settings in `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("path/to/friendlens-upload-key.keystore")
            storePassword "your-keystore-password"
            keyAlias "friendlens-alias"
            keyPassword "your-key-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

---

## 5. Production Environment Variables (Local)
Expo public variables starting with `EXPO_PUBLIC_` are statically compiled into the Javascript bundle.

### Swapping credentials before build
Since EAS Secrets are not used in local-only Gradle builds, replace the variables in your local `.env` with production keys before running the compile command:
- `EXPO_PUBLIC_SUPABASE_URL` (Production instance)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Production key)
- `EXPO_PUBLIC_TMDB_API_KEY` (Production TMDb API key)

Alternatively, prefix your environment variables in your terminal when building:
```powershell
$env:EXPO_PUBLIC_SUPABASE_URL="https://your-prod-project.supabase.co"
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY="prod-anon-key"
$env:EXPO_PUBLIC_TMDB_API_KEY="prod-tmdb-key"
npx expo export
# Then run your gradlew compilation
```

---

## 6. Play Store Pre-flight Testing Checklist
- [ ] Test the local release build on an Android emulator or device:
  ```bash
  npx expo run:android --variant release
  ```
- [ ] Confirm the prominent disclosure alert appears before permission is requested.
- [ ] Verify database connection and Supabase queries succeed on the release bundle.
- [ ] Ensure all mock TMDb or test API keys have been replaced with production tokens.
