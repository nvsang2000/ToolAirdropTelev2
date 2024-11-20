@echo off
echo Dang thuc hien tien trinh dong...

:: Đóng Windows Terminal (wt.exe hoặc WindowsTerminal.exe)
taskkill /F /IM wt.exe >nul 2>&1
taskkill /F /IM WindowsTerminal.exe >nul 2>&1

:: Đóng Command Prompt (cmd.exe)
taskkill /F /IM cmd.exe >nul 2>&1

:: Đóng PowerShell (powershell.exe và pwsh.exe)
taskkill /F /IM powershell.exe >nul 2>&1
taskkill /F /IM pwsh.exe >nul 2>&1

echo Da dong tat ca Terminal.
pause
