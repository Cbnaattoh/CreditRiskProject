@echo off
echo Starting Django ASGI server with daphne...
echo.
echo The server will be available at: http://127.0.0.1:8000
echo Press Ctrl+C to stop the server
echo.
daphne -p 8000 backend.asgi:application