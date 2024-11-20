#!/bin/bash

# Đường dẫn đến folder cha chứa các tool
Dir="$(cd "$(dirname "$0")" && pwd)"
parentDir="$Dir/AllToolAirdrop"

# "argent","babydoge",  "banana", "black-wukong","boinkers", "cex","circle","clayton",
# "coub", "lumoz","major3", "matchainv2","midas","MOONBERG","nomis","yescoin"
# "okxracer", "pokequest","timefarm","tomarket","tsubasa","vana","wonton","xkucon",
# Thay đổi hoặc thêm tên tool vào file setup.json
SETUP_FILE="setup.json"

if [ ! -f "$SETUP_FILE" ]; then
    ./setup.sh
else
    echo "File setup.json đã tồn tại."
fi

# Đọc file JSON và thiết lập các biến môi trường
while IFS= read -r line; do
    eval "$line"
done < <(./readJson.sh)

echo "folderArray: $folderArray"
echo "dataSets: $dataSets"

# Yêu cầu người dùng chọn sử dụng proxy hay không
read -p "(1) Sử dụng proxy (2) Không sử dụng proxy? (1/2): " proxyChoice

# Thiết lập lệnh npm dựa trên lựa chọn của người dùng
if [ "$proxyChoice" == "1" ]; then
    npmCommand="npm run start-proxy"
elif [ "$proxyChoice" == "2" ]; then
    npmCommand="npm run start"
else
    echo "Lựa chọn không hợp lệ. Vui lòng chọn 1 hoặc 2."
    exit 1
fi

read -p "(1) Cập nhật data auto (2) Không cập nhật? (1/2): " dataChoice

# Thiết lập lệnh npm dựa trên lựa chọn của người dùng
if [ "$dataChoice" == "1" ]; then
    (cd "$Dir/tool_browser" && npm start)
    echo
    echo "Bấm phím ENTER khi quá trình update data auto hoàn thành."
    read -r tempVar
fi

./update_data_proxy.sh

# Mở các thư mục trong danh sách từ setup.json
echo "Mở các thư mục trong danh sách..."
IFS=',' read -ra folders <<< "$folderArray"
for folder in "${folders[@]}"; do
    toolPath="$parentDir/$folder"
    
    if [ -d "$toolPath" ]; then
        echo "Đang mở terminal cho tool: $folder"

        if [ -f "$toolPath/main.py" ]; then
            echo "Tìm thấy main.py, chạy lệnh: python main.py"
            osascript -e "tell application \"Terminal\" to do script \"cd '$toolPath' && python main.py\""
        else
            echo "Không tìm thấy main.py, sẽ chạy lệnh: $npmCommand"
            osascript -e "tell application \"Terminal\" to do script \"cd '$toolPath' && $npmCommand\""
        fi
    else
        echo "Không tìm thấy thư mục: $folder"
    fi
done

echo "Hoàn thành."