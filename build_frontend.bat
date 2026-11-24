@echo off
chcp 65001 > nul
echo ========================================================
echo  React 프론트엔드 정적 빌드(frontend/dist)를 시작합니다...
echo ========================================================
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo [오류] npm install 실패. Node.js가 설치되어 있는지 확인해 주세요. (https://nodejs.org)
    pause
    exit /b 1
)
call npm run build
if %errorlevel% neq 0 (
    echo [오류] npm run build 실패.
    pause
    exit /b 1
)
cd ..
echo.
echo [완료] frontend\dist 빌드가 성공적으로 완료되었습니다!
pause
