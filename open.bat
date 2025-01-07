@echo off
setlocal enabledelayedexpansion

:: Đường dẫn đến folder cha chứa các tool
set "Dir=%~dp0"
set "parentDir=%Dir%AllToolAirdrop"

::"argent","babydoge",  "banana", "black-wukong","boinkers", "cex","circle","clayton",
::"coub", "lumoz","major3", "matchainv2","midas","MOONBERG","nomis","yescoin"
::"okxracer", "pokequest","timefarm","tomarket","tsubasa","vana","wonton","xkucon",
:: Thay đổi hoặc thêm tên tool vào file setup.json
set "SETUP_FILE=setup.json"

IF NOT EXIST "!SETUP_FILE!" (
    powershell -ExecutionPolicy Bypass -File "setup.ps1"
) ELSE (
    echo File setup.json da ton tai.
)

for /f "delims=" %%i in ('powershell -ExecutionPolicy Bypass -File "readJson.ps1"') do (
    for /f "tokens=1,* delims==" %%j in ("%%i") do (
        set "%%j=%%k"
    )
)

echo folderArray: !folderArray!
echo dataSets: !dataSets!

::My option: yescoin coub xkucon tomarket major3 babydoge
:: Yêu cầu người dùng chọn cách mở thư mục
set /p userChoice="(1) Tat ca thu muc (2) Trong danh sach duoc chon? (1/2): "

:: Kiểm tra lựa chọn của người dùng
if "%userChoice%"=="1" (
    set "selectedFolders=all"
) else if "%userChoice%"=="2" (
    set "selectedFolders=selected"
) else (
    set "selectedFolders=selected"
)

:: Yêu cầu người dùng chọn sử dụng proxy hay không
set /p proxyChoice="(1) Su dung proxy (2) Khong su dung proxy? (1/2): "

:: Thiết lập lệnh npm dựa trên lựa chọn của người dùng
if "%proxyChoice%"=="1" (
    set "npmCommand=npm run start-proxy"
) else if "%proxyChoice%"=="2" (
    set "npmCommand=npm run start"
) else (
    set "npmCommand=npm run start"
)

set /p dataChoice="(1) Cap nhap data auto (2) Khong cap nhap? (1/2): "

:: Thiết lập lệnh npm dựa trên lựa chọn của người dùng
if "%dataChoice%"=="1" (
    start cmd.exe /K "cd /d %Dir%/tool_browser && npm start"
    :: Tạm dừng trước khi kết thúc script
    echo.
    echo Bam phim ENTER khi qua trinh update data auto hoan thanh.
    :: Chờ người dùng nhấn Enter trước khi đóng cửa sổ
    set /p tempVar=""
)


powershell -ExecutionPolicy Bypass -File "%Dir%update_data_proxy.ps1"

:: Thực thi dựa trên lựa chọn của người dùng
if "%selectedFolders%"=="all" (
    echo Mo tat ca cac thu muc...
    for /d %%D in ("%parentDir%\*") do (
        :: Lấy tên của folder con
        set "toolName=%%~nxD"
        echo Dang mo terminal cho tool: !toolName!

        :: Kiểm tra nếu tồn tại file main.py
        if exist "%%D\main.py" (
            echo Tim thay main.py, run lenh: py main.py
            start cmd.exe /K "title !toolName! && cd /d %%D && python main.py"
        ) else (
            echo Khong tim thay main.py, se chay lenh: !npmCommand!
            start cmd.exe /K "title !toolName! && cd /d %%D && !npmCommand!"
        )
    )
) else if "%selectedFolders%"=="selected" (
    echo Mo cac thu muc trong danh sach...
    :: Lặp qua từng folder con trong folder cha
    for %%F in (%folderArray%) do (
        set "toolPath=%parentDir%\%%F"
        
        if exist "!toolPath!" (
            echo Dang mo terminal cho tool: %%F

            :: Kiểm tra nếu tồn tại file main.py
            if exist "!toolPath!\main.py" (
                echo Tim thay main.py, run lenh: py main.py
                start cmd.exe /K "title %%F && cd /d !toolPath! && python main.py"
            ) else (
                echo Khong tim thay main.py, se chay lenh: !npmCommand!
                start cmd.exe /K "title %%F && cd /d !toolPath! && !npmCommand!"
            )
        ) else (
            echo Khong tim thay thu muc: %%F
        )
    )
) else (
    echo Lua chon khong hop le. Vui long chon 1 hoac 2.
)

:end
echo Hoan thanh.
pause

