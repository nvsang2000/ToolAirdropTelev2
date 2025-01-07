#!/bin/bash

echo "Đang thực hiện tiến trình đóng..."

# Đóng Terminal trên macOS
osascript -e 'tell application "Terminal" to quit' > /dev/null 2>&1

# Đóng iTerm2 nếu bạn sử dụng iTerm2
osascript -e 'tell application "iTerm" to quit' > /dev/null 2>&1

# Đóng các phiên bản của PowerShell Core (pwsh) nếu đang chạy
pkill -f pwsh > /dev/null 2>&1

echo "Đã đóng tất cả Terminal."
read -p "Nhấn phím ENTER để tiếp tục..."