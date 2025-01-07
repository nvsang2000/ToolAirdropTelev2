#!/bin/bash

# Đường dẫn đến folder cha chứa các tool
Dir="$(dirname "$(realpath "$0")")"
parentDir="$Dir/AllToolAirdrop"

# Tên file setup
SETUP_FILE="setup.json"

# Kiểm tra nếu file setup.json tồn tại, nếu không chạy script setup.ps1
if [[ ! -f "$SETUP_FILE" ]]; then
    pwsh -Command "Set-ExecutionPolicy Bypass -Scope Process; . $Dir/setup.ps1"
else
    echo "File setup.json đã tồn tại."
fi

# Đọc JSON từ file setup.json
folderArray=$(pwsh -Command "Set-ExecutionPolicy Bypass -Scope Process; . $Dir/readJson.ps1")

echo "folderArray: $folderArray"

selectedFolders="selected"
npmCommand="npm run start"

# Yêu cầu người dùng chọn cập nhật data
echo "(1) Cập nhật data tự động (2) Không cập nhật? (1/2): "
read -p "Lựa chọn của bạn: " dataChoice

if [[ "$dataChoice" == "1" ]]; then
    (cd "$Dir/tool_browser" && npm start)
    echo ""
    # Chạy script update_data_proxy.ps1
    pwsh -Command "Set-ExecutionPolicy Bypass -Scope Process; . $Dir/update_data_proxy.ps1"
    read -p "Bấm ENTER khi quá trình update data tự động hoàn thành."
fi


# Thực thi dựa trên lựa chọn của người dùng
if [[ "$selectedFolders" == "all" ]]; then
    echo "Mở tất cả các thư mục..."
    for toolDir in "$parentDir"/*; do
        toolName=$(basename "$toolDir")
        echo "Đang mở terminal cho tool: $toolName"

        # Kiểm tra nếu tồn tại file main.py
        if [[ -f "$toolDir/main.py" ]]; then
            echo "Tìm thấy main.py, chạy lệnh: python main.py"
            gnome-terminal --title="$toolName" -- bash -c "cd '$toolDir' && python3 main.py; exec bash"
        else
            echo "Không tìm thấy main.py, sẽ chạy lệnh: $npmCommand"
            gnome-terminal --title="$toolName" -- bash -c "cd '$toolDir' && $npmCommand; exec bash"
        fi
    done
elif [[ "$selectedFolders" == "selected" ]]; then
    echo "Mở các thư mục trong danh sách..."
    for folder in $folderArray; do
        toolPath="$parentDir/$folder"

        if [[ -d "$toolPath" ]]; then
            echo "Đang mở terminal cho tool: $folder"

            # Kiểm tra nếu tồn tại file main.py
            if [[ -f "$toolPath/main.py" ]]; then
                echo "Tìm thấy main.py, chạy lệnh: python main.py"
                gnome-terminal --title="$folder" -- bash -c "cd '$toolPath' && python3 main.py; exec bash"
            else
                echo "Không tìm thấy main.py, sẽ chạy lệnh: $npmCommand"
                gnome-terminal --title="$folder" -- bash -c "cd '$toolPath' && $npmCommand; exec bash"
            fi
        else
            echo "Không tìm thấy thư mục: $folder"
        fi
    done
else
    echo "Lựa chọn không hợp lệ. Vui lòng chọn 1 hoặc 2."
fi

echo "Hoàn thành."
