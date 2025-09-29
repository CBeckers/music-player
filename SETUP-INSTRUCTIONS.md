# Spotify Configuration Setup Guide

## 📋 Quick Setup Instructions

### Step 1: Get Your Spotify Credentials
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new app (if you haven't already)
3. Copy your `Client ID` and `Client Secret`
4. Add redirect URI: `http://localhost:8080/callback`

### Step 2: Configure Your Secrets File
1. Open the file: `src/main/resources/application-secrets.properties`
2. Replace the placeholder values with your actual credentials:

```properties
spotify.client-id=your-actual-spotify-client-id
spotify.client-secret=your-actual-spotify-client-secret  
spotify.redirect-uri=http://localhost:8080/callback
```

### Step 3: Test the Configuration
Run the application:
```bash
mvn spring-boot:run
```

### Step 4: Test the API Endpoints

#### Test 1: Basic Search (No Authentication Required)
```bash
curl "http://localhost:8080/api/spotify/search?query=taylor%20swift&limit=5"
```

#### Test 2: Get Authentication URL
```bash
curl "http://localhost:8080/api/spotify/auth/login"
```

This should return an authorization URL that you can visit in your browser.

## 🔒 Security Notes

✅ **Good Practices:**
- The `application-secrets.properties` file is already added to `.gitignore`
- Never commit your actual credentials to version control
- Use the template file for sharing the structure

❌ **Don't Do:**
- Don't share your `Client Secret` publicly
- Don't commit the secrets file to git
- Don't use these credentials in production (use environment variables instead)

## 🧪 Testing Checklist

- [ ] Spotify app created on developer dashboard
- [ ] Redirect URI added: `http://localhost:8080/callback`
- [ ] Credentials copied to `application-secrets.properties`
- [ ] Application starts without errors
- [ ] Search endpoint returns results
- [ ] Auth endpoint returns authorization URL

## 📁 File Structure
```
src/main/resources/
├── application.properties (main config)
├── application-secrets.properties (your credentials - DO NOT COMMIT)
└── application-secrets.properties.template (template for others)
```