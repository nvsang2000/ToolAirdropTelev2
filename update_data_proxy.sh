#!/bin/bash

# Đường dẫn đến thư mục cha (nơi chứa các thư mục con và các tệp)
Dir="$(cd "$(dirname "$0")" && pwd)"
parentDir="$Dir/AllToolAirdrop"

# Đường dẫn đến file JSON
jsonFile="$Dir/update_data.json"

# Kiểm tra sự tồn tại của file JSON
if [ ! -f "$jsonFile" ]; then
    echo "Không tìm thấy file JSON tại đường dẫn: $jsonFile" >&2
    exit 1
fi

# Đọc và chuyển đổi nội dung JSON thành đối tượng trong shell
jsonData=$(jq '.' "$jsonFile")
if [ $? -ne 0 ]; then
    echo "Lỗi khi đọc hoặc chuyển đổi file JSON" >&2
    exit 1
fi

# Đọc file setup.json để lấy danh sách các tool cần cập nhật
setupFile="$Dir/setup.json"
if [ ! -f "$setupFile" ]; then
    echo "Không tìm thấy file setup.json tại đường dẫn: $setupFile" >&2
    exit 1
fi

# Đọc danh sách các tool từ setup.json
folderArray=$(jq -r '.folderArray' "$setupFile")
IFS=',' read -ra folders <<< "$folderArray"

# Khai báo mảng proxy
proxyArray=(
    "http://upovfdib:mx49usjmzvcb@173.211.0.148:6641"
    "http://upovfdib:mx49usjmzvcb@161.123.152.115:6360"
    "http://upovfdib:mx49usjmzvcb@216.10.27.159:6837"
    "http://upovfdib:mx49usjmzvcb@167.160.180.203:6754"
    "http://upovfdib:mx49usjmzvcb@154.36.110.199:6853"
    "http://upovfdib:mx49usjmzvcb@173.0.9.70:5653"
    "http://upovfdib:mx49usjmzvcb@173.0.9.209:5792"
)

# Lặp qua từng thư mục con trong thư mục cha
for toolDir in "$parentDir"/*; do
    if [ -d "$toolDir" ]; then
        folderName=$(basename "$toolDir")
        
        # Kiểm tra xem folderName có trong danh sách từ setup.json không
        if [[ " ${folders[@]} " =~ " ${folderName} " ]]; then
            echo "Đang xử lý thư mục: $folderName"

            # Kiểm tra xem thư mục này có dữ liệu trong JSON không
            folderData=$(echo "$jsonData" | jq -r --arg folderName "$folderName" '.[$folderName]')
            if [ "$folderData" != "null" ]; then
                data=$(echo "$folderData" | jq -r '.data[]')
                ids=$(echo "$folderData" | jq -r '.id[]')

                # Kiểm tra sự tồn tại và tính hợp lệ của mảng data và id
                if [ $(echo "$data" | wc -l) -ne $(echo "$ids" | wc -l) ]; then
                    echo "Số lượng phần tử trong data và id không khớp cho thư mục: $folderName" >&2
                fi

                # --- Cập nhật data.txt ---
                dataFile="$toolDir/data.txt"
                if [ ! -f "$dataFile" ]; then
                    # Tạo file data.txt nếu chưa tồn tại
                    touch "$dataFile"
                    echo "Đã tạo file data.txt trong $folderName"
                fi

                if [ -f "$dataFile" ]; then
                    # Loại bỏ khoảng trắng ở đầu và cuối mỗi chuỗi
                    trimmedData=$(echo "$data" | sed 's/^[ \t]*//;s/[ \t]*$//')
                    # Ghi dữ liệu vào tệp với mã hóa UTF-8
                    echo "$trimmedData" > "$dataFile"
                    echo "Cập nhật thành công data.txt cho $folderName"
                fi

                # --- Cập nhật id.txt ---
                idFile="$toolDir/id.txt"
                if [ ! -f "$idFile" ]; then
                    # Tạo file id.txt nếu chưa tồn tại
                    touch "$idFile"
                    echo "Đã tạo file id.txt trong $folderName"
                fi

                if [ -f "$idFile" ]; then
                    # Ghi từng phần tử của mảng id vào id.txt, mỗi phần tử trên một dòng
                    echo "$ids" > "$idFile"
                    echo "Cập nhật thành công id.txt cho $folderName"
                fi

            else
                echo "Dữ liệu trong JSON cho $folderName không hợp lệ. Đảm bảo 'data' và 'id' là mảng." >&2
            fi

            # --- Kiểm tra và cập nhật proxy.txt ---
            proxyFile="$toolDir/proxy.txt"
            if [ -f "$proxyFile" ]; then
                echo "Đang cập nhật proxy cho: $proxyFile"
                # Ghi tất cả proxy mới vào file proxy.txt, mỗi proxy trên 1 dòng
                printf "%s\n" "${proxyArray[@]}" > "$proxyFile"
                echo "Đã cập nhật thành công proxy cho: $proxyFile"
            else
                echo "Đang tạo mới và cập nhật proxy.txt trong: $toolDir"
                # Tạo mới tệp proxy.txt và ghi các proxy vào
                printf "%s\n" "${proxyArray[@]}" > "$proxyFile"
                echo "Đã tạo mới và cập nhật proxy.txt cho: $toolDir"
            fi

            echo "-----------------------------"
        else
            echo "Thư mục $folderName không có trong danh sách từ setup.json, bỏ qua."
        fi
    fi
done

echo "Hoàn thành việc cập nhật data.txt, id.txt và proxy.txt trong các thư mục được chọn."