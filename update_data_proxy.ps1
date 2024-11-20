# Duong dan den thu muc cha (noi chua cac thu muc con va cac tep)
$Dir = $PSScriptRoot
$parentDir = Join-Path $Dir "AllToolAirdrop"

# Duong dan den file JSON
$jsonFile = Join-Path $Dir "update_data.json"

# Kiem tra su ton tai cua file JSON
if (-Not (Test-Path $jsonFile)) {
    Write-Host "Khong tim thay file JSON tai duong dan: $jsonFile" -ForegroundColor Red
    exit
}

# Doc va chuyen doi noi dung JSON thanh doi tuong PowerShell
try {
    $jsonData = Get-Content -Path $jsonFile -Raw | ConvertFrom-Json
} catch {
    Write-Host "Loi khi doc hoac chuyen doi file JSON: $_" -ForegroundColor Red
    exit
}

# Khai bao mang proxy
$proxyArray = @(
    "http://upovfdib:mx49usjmzvcb@173.211.0.148:6641",
    "http://upovfdib:mx49usjmzvcb@161.123.152.115:6360",
    "http://upovfdib:mx49usjmzvcb@216.10.27.159:6837",
    "http://upovfdib:mx49usjmzvcb@167.160.180.203:6754",
    "http://upovfdib:mx49usjmzvcb@154.36.110.199:6853",
    "http://upovfdib:mx49usjmzvcb@173.0.9.70:5653",
    "http://upovfdib:mx49usjmzvcb@173.0.9.209:5792"
)

# Lap qua tung thu muc con trong thu muc cha
Get-ChildItem -Path $parentDir -Directory | ForEach-Object {
    $folderName = $_.Name
    $folderPath = $_.FullName

    Write-Host "Dang xu ly thu muc: $folderName" -ForegroundColor Cyan

    # Kiem tra xem thu muc nay co du lieu trong JSON khong
    if ($jsonData.PSObject.Properties.Name -contains $folderName) {
        $folderData = $jsonData.$folderName

        # Kiem tra su ton tai va tinh hop le cua mang data va id
        if ($folderData.data -is [System.Array] -and $folderData.id -is [System.Array]) {
            if ($folderData.data.Count -ne $folderData.id.Count) {
                Write-Host "So luong phan tu trong data va id khong khop cho thu muc: $folderName" -ForegroundColor Yellow
            }

            # --- Cap nhat data.txt ---
            $dataFile = Join-Path $folderPath "data.txt"
            if (-Not (Test-Path $dataFile)) {
                # Tao file data.txt neu chua ton tai
                try {
                    New-Item -Path $dataFile -ItemType File -Force | Out-Null
                    Write-Host "Da tao file data.txt trong $folderName" -ForegroundColor Green
                } catch {
                    Write-Host "Loi khi tao file data.txt trong $folderName : $_" -ForegroundColor Red
                    # Neu khong the tao file, bo qua viec cap nhat data.txt
                    $dataFile = $null
                }
            }

            if ($dataFile) {
                try {
                    # Loại bỏ khoảng trắng ở đầu và cuối mỗi chuỗi
                    $trimmedData = $folderData.data | ForEach-Object { $_.Trim() }

                    # Chuyển đổi dữ liệu thành chuỗi
                    $dataToWrite = $trimmedData -join "`r`n"

                    # Ghi dữ liệu vào tệp với mã hóa UTF-8 with BOM
                    [System.IO.File]::WriteAllText($dataFile, $dataToWrite, [System.Text.Encoding]::UTF8)

                    # Hien thi thong bao thanh cong
                    Write-Host "Cap nhat thanh cong data.txt cho $folderName" -ForegroundColor Green
                } catch {
                    Write-Host "Loi khi cap nhat data.txt cho $folderName : $_" -ForegroundColor Red
                }
            }

            # --- Cap nhat id.txt ---
            $idFile = Join-Path $folderPath "id.txt"
            if (-Not (Test-Path $idFile)) {
                # Tao file id.txt neu chua ton tai
                try {
                    New-Item -Path $idFile -ItemType File -Force | Out-Null
                    Write-Host "Da tao file id.txt trong $folderName" -ForegroundColor Green
                } catch {
                    Write-Host "Loi khi tao file id.txt trong $folderName : $_" -ForegroundColor Red
                    # Neu khong the tao file, bo qua viec cap nhat id.txt
                    $idFile = $null
                }
            }

            if ($idFile) {
                try {
                    # Ghi tung phan tu cua mang id vao id.txt, moi phan tu tren mot dong
                    $folderData.id | Out-File -FilePath $idFile -Encoding UTF8 -Force
                    Write-Host "Cap nhat thanh cong id.txt cho $folderName" -ForegroundColor Green
                } catch {
                    Write-Host "Loi khi cap nhat id.txt cho $folderName : $_" -ForegroundColor Red
                }
            }

        } else {
            Write-Host "Du lieu trong JSON cho $folderName khong hop le. Dam bao 'data' va 'id' la mang." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Khong tim thay du lieu trong JSON cho thu muc: $folderName" -ForegroundColor Yellow
    }

    # --- Kiem tra va cap nhat proxy.txt ---
    $proxyFile = Join-Path $folderPath "proxy.txt"

    if (Test-Path $proxyFile) {
        Write-Host "Dang cap nhat proxy cho: $proxyFile" -ForegroundColor Cyan

        try {
            # Ghi tat ca proxy moi vao file proxy.txt, moi proxy tren 1 dong
            Set-Content -Path $proxyFile -Value $proxyArray -Encoding UTF8
            Write-Host "Da cap nhat thanh cong proxy cho: $proxyFile" -ForegroundColor Green
        } catch {
            Write-Host "Loi khi cap nhat proxy.txt cho $folderName : $_" -ForegroundColor Red
        }
    } else {
        Write-Host "Dang tao moi va cap nhat proxy.txt trong: $folderPath" -ForegroundColor Cyan

        try {
            # Tao moi tep proxy.txt va ghi cac proxy vao
            $proxyArray | Out-File -FilePath $proxyFile -Encoding UTF8 -Force
            Write-Host "Da tao moi va cap nhat proxy.txt cho: $folderPath" -ForegroundColor Green
        } catch {
            Write-Host "Loi khi tao moi proxy.txt trong $folderPath : $_" -ForegroundColor Red
        }
    }

    Write-Host "-----------------------------"
}

Write-Host "Hoan thanh viec xoa data.txt, id.txt va cap nhat proxy.txt trong tat ca cac thu muc con." -ForegroundColor Magenta
