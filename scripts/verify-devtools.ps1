# Read-only discovery; no upload or review.
$found = @(Get-Command cli.bat,cli.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
foreach ($location in @('C:\Program Files\Tencent','C:\Program Files (x86)\Tencent',"$env:LOCALAPPDATA\Programs")) {
 if(Test-Path -LiteralPath $location){$found += @(Get-ChildItem -LiteralPath $location -Filter cli.bat -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)}
}
if($found.Count -eq 0){Write-Output 'BLOCKED_WECHAT_DEVTOOLS: CLI not found in PATH or standard install locations.';exit 2}
$found | Sort-Object -Unique
Write-Output 'Verify login, service port and local-only compile command. No upload/review authorized.'

