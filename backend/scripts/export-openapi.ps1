param(
  [int]$DelaySeconds = 6,
  [string]$OutFile = "swagger.json"
)

Write-Host "Iniciando backend para extraer OpenAPI..."
$proc = Start-Process node -ArgumentList 'dist/apps/backend/main.js' -PassThru
Start-Sleep -Seconds $DelaySeconds
try {
  Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/api/docs-json -OutFile $OutFile
  Write-Host "Spec exportada a $OutFile"
} catch {
  Write-Error "Fallo exportando OpenAPI: $_"
} finally {
  if ($proc -and !$proc.HasExited) { Stop-Process -Id $proc.Id -Force }
}
