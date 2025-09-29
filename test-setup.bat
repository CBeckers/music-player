@echo off
echo.
echo ===============================================
echo  Spotify Music Player - Configuration Test
echo ===============================================
echo.

echo 1. Checking if application starts...
echo.

cd /d "%~dp0"
start /B mvn spring-boot:run

echo Waiting for application to start...
timeout /t 10 /nobreak > nul

echo.
echo 2. Testing basic search endpoint...
echo.

curl -s "http://localhost:8080/api/spotify/search?query=test&limit=1" || echo "Search test failed - check your Spotify credentials"

echo.
echo 3. Testing auth endpoint...
echo.

curl -s "http://localhost:8080/api/spotify/auth/login" || echo "Auth test failed - check configuration"

echo.
echo ===============================================
echo  Test completed. Check the output above.
echo ===============================================
echo.
pause