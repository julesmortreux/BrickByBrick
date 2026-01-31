# Script pour arrêter tous les processus utilisant les ports backend et frontend
# Backend: Port 8000
# Frontend: Port 3000

Write-Host "🛑 Arrêt des serveurs BrickByBrick..." -ForegroundColor Yellow

# Fonction pour arrêter les processus sur un port
function Stop-PortProcesses {
    param([int]$Port)
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            try {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "  Arrêt du processus $pid ($($process.ProcessName)) sur le port $Port..." -ForegroundColor Cyan
                    Stop-Process -Id $pid -Force -ErrorAction Stop
                }
            } catch {
                # Processus déjà arrêté ou inaccessible
            }
        }
    } else {
        Write-Host "  ✅ Port $Port déjà libre" -ForegroundColor Green
    }
}

# Arrêter le backend (port 8000)
Write-Host "`n📦 Backend (Port 8000):" -ForegroundColor Magenta
Stop-PortProcesses -Port 8000

# Arrêter le frontend (port 3000)
Write-Host "`n🌐 Frontend (Port 3000):" -ForegroundColor Magenta
Stop-PortProcesses -Port 3000

# Attendre un peu pour que les ports se libèrent
Start-Sleep -Seconds 2

# Vérifier l'état final
Write-Host "`n📊 État des ports:" -ForegroundColor Yellow

$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port8000) {
    Write-Host "  ⚠️  Port 8000: Toujours utilisé" -ForegroundColor Red
} else {
    Write-Host "  ✅ Port 8000: Libre" -ForegroundColor Green
}

if ($port3000) {
    Write-Host "  ⚠️  Port 3000: Toujours utilisé" -ForegroundColor Red
} else {
    Write-Host "  ✅ Port 3000: Libre" -ForegroundColor Green
}

Write-Host "`n✅ Terminé!" -ForegroundColor Green
