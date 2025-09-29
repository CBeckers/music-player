# Spotify App Creation Guide

## Step-by-Step Instructions

### 1. Go to Spotify Developer Dashboard
- Open: https://developer.spotify.com/dashboard/
- Log in with your Spotify account (create one if needed)

### 2. Create New App
- Click "Create app" button
- Fill in the required fields:

**App name:** `Music Player API`
**App description:** `Spring Boot music player with Spotify integration`
**Website:** `http://localhost:8080` (or leave blank)
**Redirect URI:** `http://localhost:8080/callback`

### 3. Important Settings
- **App type:** Select "Web API"
- **Which API/SDKs are you planning to use?** Check "Web API"

### 4. Common Issues & Solutions

#### Issue: "Redirect URI is not secure"
- **Solution:** This is just a warning for localhost. It's safe to ignore for development.
- **For production:** Use HTTPS URLs

#### Issue: "Invalid redirect URI format"
- **Solution:** Make sure it's exactly: `http://localhost:8080/callback`
- **No trailing slash:** Don't use `http://localhost:8080/callback/`

#### Issue: "App creation failed"
- **Solution 1:** Try different app name (must be unique)
- **Solution 2:** Clear browser cache and try again
- **Solution 3:** Use different browser

#### Issue: "Cannot access developer dashboard"
- **Solution:** Make sure your Spotify account is verified (check email)

### 5. After App Creation
1. Copy your **Client ID** and **Client Secret**
2. Keep them secure - never commit to version control
3. Set them as environment variables

### 6. Required Scopes for Music Player
Your app will need these scopes:
- `user-read-playback-state` - Read current playback
- `user-modify-playback-state` - Control playback
- `user-read-currently-playing` - Read currently playing track

## What specific error are you seeing?
Please share the exact error message you're getting when creating the app.