Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$src = "c:\Users\User\Antigravity\used-car-export-platform"
$tempDir = "c:\Users\User\Antigravity\used-car-export-platform\supabase\.temp\zip_temp"
$zipFile = "c:\Users\User\Antigravity\used-car-export-platform\cartradekorea-release-package-final.zip"

if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
if (Test-Path $zipFile) { Remove-Item -Force $zipFile }

New-Item -ItemType Directory -Force -Path $tempDir

Copy-Item -Path "$src\app" -Destination "$tempDir\app" -Recurse -Force
Copy-Item -Path "$src\components" -Destination "$tempDir\components" -Recurse -Force
Copy-Item -Path "$src\lib" -Destination "$tempDir\lib" -Recurse -Force
Copy-Item -Path "$src\public" -Destination "$tempDir\public" -Recurse -Force

New-Item -ItemType Directory -Force -Path "$tempDir\supabase"
Copy-Item -Path "$src\supabase\migrations" -Destination "$tempDir\supabase\migrations" -Recurse -Force
if (Test-Path "$src\supabase\seed_prod.sql") { Copy-Item -Path "$src\supabase\seed_prod.sql" -Destination "$tempDir\supabase\seed_prod.sql" -Force }
if (Test-Path "$src\supabase\seed.sql") { Copy-Item -Path "$src\supabase\seed.sql" -Destination "$tempDir\supabase\seed.sql" -Force }

$files = @(
  ".gitignore",
  ".env.example",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "tsconfig.json",
  "middleware.ts",
  "README.md",
  "README_REVIEW.md",
  "PROJECT_STRUCTURE.md",
  "BUILD_REPORT.md",
  "SUPABASE_SCHEMA_REPORT.md",
  "ENVIRONMENT_REPORT.md",
  "SECURITY_REPORT.md",
  "PERFORMANCE_REPORT.md",
  "DEPLOYMENT_REPORT.md",
  "OPEN_READY_REPORT.md",
  "ADMIN_OPERATION_GUIDE.md",
  "LAUNCH_CHECKLIST.md",
  "TROUBLESHOOTING.md",
  "VEHICLE_UPLOAD_RULE.md",
  "PRODUCTION_APPLY_CHECKLIST.md"
)

foreach ($f in $files) {
  $fpath = "$src\$f"
  if (Test-Path $fpath) {
    Copy-Item -Path $fpath -Destination "$tempDir\$f" -Force
  }
}

# 수동으로 ZIP 아카이브를 열고, 각 파일을 돌면서 표준 슬래시(/)로 경로를 매핑하여 추가
$zipStream = [System.IO.File]::Create($zipFile)
$archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

$allFiles = Get-ChildItem -Path $tempDir -Recurse -File

foreach ($file in $allFiles) {
  # $tempDir 내부의 상대 경로를 계산
  $relative = $file.FullName.Substring($tempDir.Length + 1)
  
  # 경로 구분자를 Windows 백슬래시(\)에서 표준 슬래시(/)로 강제 치환
  $zipPath = $relative.Replace("\", "/")
  
  # Zip entry 생성 및 파일 데이터 복사
  $entry = $archive.CreateEntry($zipPath, [System.IO.Compression.CompressionLevel]::Optimal)
  $entryStream = $entry.Open()
  $fileStream = [System.IO.File]::OpenRead($file.FullName)
  $fileStream.CopyTo($entryStream)
  
  # 스트림 닫기
  $fileStream.Close()
  $entryStream.Close()
}

$archive.Dispose()
$zipStream.Close()

Remove-Item -Recurse -Force $tempDir
Write-Host "Zip creation complete with standard forward slashes."
