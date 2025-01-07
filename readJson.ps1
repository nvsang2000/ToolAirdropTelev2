# Đường dẫn đến file setup.json
$setupFile = "setup.json"

# Đọc giá trị từ file JSON
$jsonData = Get-Content -Path $setupFile -Raw | ConvertFrom-Json

# In ra các giá trị theo định dạng "key=value"
Write-Host "folderArray=$($jsonData.folderArray)"
Write-Host "dataSets=$($jsonData.dataSets)"
