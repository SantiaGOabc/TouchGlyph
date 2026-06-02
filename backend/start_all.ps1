$backendRoot = $PSScriptRoot
$runDir = "$backendRoot\run"

# Ensure the run directory exists
if (-not (Test-Path $runDir)) { New-Item -ItemType Directory -Path $runDir -Force | Out-Null }

Write-Host "Inicializando base de datos..." -ForegroundColor Cyan
Set-Location -LiteralPath $backendRoot
& "$backendRoot\venv\Scripts\python.exe" init_db.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al inicializar la base de datos." -ForegroundColor Red
    exit 1
}
Write-Host "Base de datos lista." -ForegroundColor Green

Get-ChildItem "$runDir\*" -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem "$backendRoot\*.pid" -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem "$backendRoot\*_console.log" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem "$backendRoot\*.jobid" -ErrorAction SilentlyContinue | Remove-Item -Force
Start-Sleep -Seconds 1

$services = @(
    @{Name="User_Service"; Port=8000; Module="user_service.app"},
    @{Name="Admin_Service"; Port=5001; Module="admin_service.app"},
    @{Name="Teacher_Service"; Port=5002; Module="teacher_service.app"},
    @{Name="Student_Service"; Port=5003; Module="student_service.app"},
    @{Name="Devices_Service"; Port=5004; Module="devices_service.app"}
)

$venvPython = "$backendRoot\venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    $venvPython = "python"
}

foreach ($svc in $services) {
    $logFile = "$runDir\$($svc.Name)_console.log"
    $pidFile = "$runDir\$($svc.Name).pid"
    $proc = Start-Process powershell -WindowStyle Hidden -PassThru -ArgumentList "-Command", `
        "Set-Location '$backendRoot'; & '$venvPython' -m $($svc.Module) *> '$logFile'"
    $proc.Id | Out-File -FilePath $pidFile -Encoding ASCII
    Write-Host "Iniciado $($svc.Name) en puerto $($svc.Port) (PID: $($proc.Id))" -ForegroundColor Cyan
    Start-Sleep -Milliseconds 500
}

Write-Host "`nTodos los servicios iniciados. Usa stop_all.ps1 para detenerlos." -ForegroundColor Green
