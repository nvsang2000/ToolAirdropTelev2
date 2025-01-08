# AirdropTool

## ----Bước 1----Cài đặt thư viện ban đầu-----------#
Yêu cầu đã cài đặt nodejs.
Mở terminal chạy: npm install

một số tool chạy bằng (python) thì cài đặt: pip install -r requirements.txt

## ----Bước 2----Khởi chạy lần đầu tiên-----------#
gõ lệnh sau vào cmd hoặc bấm vào file.
Window: ./open.bat
Linux, mac: ./open.sh
Sau khi chạy xong trong thư mục sẽ có file setup.json

### Example
```ts
{
    "folderArray": ["rating", "argent", "coub", "babydoge", "birds", "pip", "humanity"],
    "dataSets": ["user_data"]
}
```
Thay đổi tên tool cần chạy trong "folderArray" trùng với tên thư mục có trong thư mục "AllToolAirdrop"

## --------Đóng tool-----------#
gõ lệnh sau vào cmd hoặc bấm vào file.
./closes.bat
