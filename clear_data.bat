@echo off
REM Script Batch de xoa data.txt, id.txt va proxy.txt trong cac thu muc con cua all_tool

REM Lay duong dan thu muc hien tai
set "Dir=%~dp0"
set "parentDir=%Dir%AllToolAirdrop"

echo Dang xoa cac tep data.txt, id.txt va proxy.txt trong cac thu muc con cua %parentDir%...
echo -------------------------------------------------------------

REM Duyet qua tat ca cac thu muc con trong thu muc all_tool
for /D %%D in ("%parentDir%\*") do (
    echo Dang xu ly thu muc: %%D

    REM Xoa data.txt neu ton tai
    if exist "%%D\data.txt" (
        del /F /Q "%%D\data.txt"
        if not errorlevel 1 (
            echo Da xoa data.txt trong %%D
        ) else (
            echo Loi khi xoa data.txt trong %%D
        )
    ) else (
        echo Khong tim thay data.txt trong %%D
    )

    REM Xoa id.txt neu ton tai
    if exist "%%D\id.txt" (
        del /F /Q "%%D\id.txt"
        if not errorlevel 1 (
            echo Da xoa id.txt trong %%D
        ) else (
            echo Loi khi xoa id.txt trong %%D
        )
    ) else (
        echo Khong tim thay id.txt trong %%D
    )

    REM Xoa proxy.txt neu ton tai
    if exist "%%D\proxy.txt" (
        del /F /Q "%%D\proxy.txt"
        if not errorlevel 1 (
            echo Da xoa proxy.txt trong %%D
        ) else (
            echo Loi khi xoa proxy.txt trong %%D
        )
    ) else (
        echo Khong tim thay proxy.txt trong %%D
    )

    echo -------------------------------------------------------------
)

echo Hoan thanh viec xoa cac tep data.txt, id.txt va proxy.txt trong tat ca cac thu muc con.
pause
