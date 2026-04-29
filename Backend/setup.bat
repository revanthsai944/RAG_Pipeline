@echo off
REM Windows setup script for RAG Microservice

echo Setting up RAG Microservice...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed. Please install Node.js 16+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js %NODE_VERSION% detected

REM Install dependencies
echo Installing dependencies...
call npm install

REM Build the project
echo Building project...
call npm run build

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo Warning: Please update .env with your OPENAI_API_KEY
) else (
    echo .env file exists
)

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Update .env with your OPENAI_API_KEY
echo 2. Run: npm run dev (development)
echo 3. Or run: npm start (production)
echo.
echo Documentation: See README.md
