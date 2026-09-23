@echo off
title Kanban Flow - Runner
echo ===================================================
echo     Launching Kanban Flow (Go Backend + Frontend)
echo ===================================================

echo [1/2] Starting Go Backend Server on port 8080...
start "Kanban Go Backend" cmd /k "cd server && kanban-server.exe"

echo [2/2] Starting Frontend Client on port 3000...
start "Kanban Frontend" cmd /k "cd client && npm run dev"

echo.
echo ===================================================
echo  Kanban Flow is starting!
echo  Backend:  http://localhost:8080
echo  Frontend: http://localhost:3000
echo ===================================================
timeout /t 5
start http://localhost:3000
