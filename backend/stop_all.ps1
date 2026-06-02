$backendRoot = $PSScriptRoot
$runDir = "$backendRoot\run"

Write-Host "Deteniendo servicios..." -ForegroundColor Cyan

# Kill processes from saved .pid files
Get-ChildItem "$runDir\*.pid" -ErrorAction SilentlyContinue | ForEach-Object {
    $procId = Get-Content $_.FullName
    try {
        $proc = Get-Process -Id $procId -ErrorAction Stop
        $proc.Kill()
        Write-Host "Detenido $($_.BaseName) (PID: $procId)" -ForegroundColor Yellow
    } catch {
        Write-Host "$($_.BaseName) ya no está en ejecución (PID: $procId)" -ForegroundColor Gray
    }
}

# Kill any orphaned python processes from the backend
Get-Process python -ErrorAction SilentlyContinue | Where-Object {
    try { $_.CommandLine -match $backendRoot } catch { $false }
} | ForEach-Object {
    try {
        $_.Kill()
        Write-Host "Detenido proceso python huérfano (PID: $($_.Id))" -ForegroundColor Yellow
    } catch {
        Write-Host "No se pudo detener PID: $($_.Id)" -ForegroundColor Red
    }
}

# Clean up run directory
Get-ChildItem "$runDir\*" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Also clean any stale files left in backend root
Get-ChildItem "$backendRoot\*.pid" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem "$backendRoot\*_console.log" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem "$backendRoot\*.jobid" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "`nTodos los servicios detenidos." -ForegroundColor Green
