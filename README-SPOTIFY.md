# Spotify Music Player API

A Spring Boot application that integrates with the Spotify Web API to control music playback.

## Features

- Search for tracks on Spotify
- Play tracks on your Spotify devices
- Pause/Resume playback
- Control volume
- Transfer playback between devices
- Get current playback state
- List available devices

## Prerequisites

1. **Java 17** or higher
2. **Maven 3.6+**
3. **Spotify Developer Account**

## Spotify Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new app
3. Note down your `Client ID` and `Client Secret`
4. Add `http://localhost:8080/callback` to your app's Redirect URIs

## Configuration

1. Set the following environment variables or update `application.properties`:

```bash
export SPOTIFY_CLIENT_ID="your-spotify-client-id"
export SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
export SPOTIFY_REDIRECT_URI="http://localhost:8080/callback"
```

Or update `src/main/resources/application.properties`:

```properties
spotify.client-id=your-spotify-client-id
spotify.client-secret=your-spotify-client-secret
spotify.redirect-uri=http://localhost:8080/callback
```

## Running the Application

1. Clone the repository
2. Configure your Spotify credentials (see Configuration above)
3. Run the application:

```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

## API Endpoints

### Authentication

- **GET** `/api/spotify/auth/login` - Get Spotify authorization URL
- **GET** `/api/spotify/callback` - OAuth callback endpoint

### Search

- **GET** `/api/spotify/search?query={search_term}&limit={limit}` - Search for tracks

### Playback Control (Requires User Authentication)

- **POST** `/api/spotify/play` - Play a track
  ```json
  {
    "trackUri": "spotify:track:4iV5W9uYEdYUVa79Axb7Rh"
  }
  ```

- **POST** `/api/spotify/pause` - Pause playback
- **POST** `/api/spotify/resume` - Resume playback
- **GET** `/api/spotify/player` - Get current playback state

### Device Control

- **GET** `/api/spotify/devices` - List available devices
- **POST** `/api/spotify/transfer` - Transfer playback to device
  ```json
  {
    "deviceId": "device-id"
  }
  ```

### Volume Control

- **POST** `/api/spotify/volume` - Set volume (0-100)
  ```json
  {
    "volume": 50
  }
  ```

## Authentication Flow

1. Call `/api/spotify/auth/login` to get the authorization URL
2. Redirect user to the authorization URL
3. User authorizes your app on Spotify
4. Spotify redirects back to `/api/spotify/callback` with an authorization code
5. The callback endpoint exchanges the code for an access token
6. Use the access token in the `Authorization: Bearer {token}` header for subsequent requests

## Example Usage

### 1. Get Authorization URL

```bash
curl -X GET "http://localhost:8080/api/spotify/auth/login"
```

Response:
```json
{
  "authUrl": "https://accounts.spotify.com/authorize?...",
  "state": "uuid-state"
}
```

### 2. Search for Tracks

```bash
curl -X GET "http://localhost:8080/api/spotify/search?query=taylor%20swift&limit=5"
```

### 3. Play a Track (after authentication)

```bash
curl -X POST "http://localhost:8080/api/spotify/play" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"trackUri": "spotify:track:4iV5W9uYEdYUVa79Axb7Rh"}'
```

## Important Notes

- **Spotify Premium Required**: Playback control requires a Spotify Premium account
- **Active Device Required**: You need an active Spotify device (desktop app, mobile app, etc.) to control playback
- **Token Expiration**: Access tokens expire after 1 hour and need to be refreshed
- **Rate Limits**: Spotify API has rate limits - the app includes basic error handling for this

## Troubleshooting

### "No active device found"
- Make sure you have Spotify open on at least one device
- The device must be actively playing or recently used

### "Insufficient client scope"
- Ensure your app has the required scopes: `user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing`

### "Invalid redirect URI"
- Make sure the redirect URI in your Spotify app settings matches exactly: `http://localhost:8080/callback`

## Development

The application uses:
- **Spring Boot 3.5.6**
- **Spring WebFlux** for reactive HTTP calls
- **Spring Security** for OAuth2 support
- **Jackson** for JSON processing

## Logs

Enable debug logging by setting:
```properties
logging.level.com.example.music_player=DEBUG
```