# Đường dẫn đến file setup.json
$setupFile = "setup.json"

# Kiểm tra xem file setup.json đã tồn tại chưa
if (-Not (Test-Path $setupFile)) {
    Write-Host "File setup.json chua ton tai. Tao moi file setup.json voi noi dung mac dinh..."

    # Tạo file setup.json với nội dung định sẵn
    $jsonContent = @"
{
    "folderArray": "memefi argent",
    "dataSets": ["user_data"],
    "selectIDs": []
}
"@
    Set-Content -Path $setupFile -Value $jsonContent
    Write-Host "File setup.json da duoc tao thanh cong!"
} else {
    Write-Host "File setup.json da ton tai."
}
