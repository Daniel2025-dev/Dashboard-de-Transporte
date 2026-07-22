param(
    [switch]$Silencioso
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DataDir = Join-Path $ProjectDir "data"
$ConfigPath = Join-Path $DataDir "config.json"
$BundlePath = Join-Path $DataDir "planilla-local.js"

function Write-Status {
    param([string]$Message)
    if (-not $Silencioso) {
        Write-Host $Message
    }
}

function ConvertTo-JavaScriptString {
    param([string]$Value)
    if ($null -eq $Value) { return '""' }

    $escaped = $Value.Replace('\', '\\')
    $escaped = $escaped.Replace('"', '\"')
    $escaped = $escaped.Replace("`r", '\r')
    $escaped = $escaped.Replace("`n", '\n')
    return '"' + $escaped + '"'
}

function Write-EmptyBundle {
    $encoding = New-Object System.Text.UTF8Encoding($false)
    $content = "/* No existe una planilla local preparada. */`r`nwindow.TRANSPORT_LOCAL_BUNDLE = null;`r`n"
    [System.IO.File]::WriteAllText($BundlePath, $content, $encoding)
}

if (-not (Test-Path -LiteralPath $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir | Out-Null
}

$candidateNames = [System.Collections.Generic.List[string]]::new()

if (Test-Path -LiteralPath $ConfigPath) {
    try {
        $config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($config.archivoExcel) {
            $candidateNames.Add([string]$config.archivoExcel)
        }
        if ($config.archivosAlternativos) {
            foreach ($name in $config.archivosAlternativos) {
                if ($name) { $candidateNames.Add([string]$name) }
            }
        }
    }
    catch {
        Write-Warning "No se pudo leer data/config.json. Se utilizarán los nombres predeterminados."
    }
}

$defaults = @(
    "Planilla planificación diaria Transporte_OV.xlsx",
    "Planilla planificación diaria Transporte_OV (1).xlsx",
    "Planilla planificación diaria Transporte_OV_actualizada.xlsx",
    "Planilla planificación diaria Transporte.xlsx"
)
foreach ($name in $defaults) { $candidateNames.Add($name) }

$selectedFile = $null
$seen = @{}
foreach ($name in $candidateNames) {
    if ([string]::IsNullOrWhiteSpace($name)) { continue }
    if (-not $name.EndsWith(".xlsx", [System.StringComparison]::OrdinalIgnoreCase)) { continue }
    if ($name.Contains("\") -or $name.Contains("/") -or $name.Contains("..")) { continue }

    $key = $name.ToLowerInvariant()
    if ($seen.ContainsKey($key)) { continue }
    $seen[$key] = $true

    $candidatePath = Join-Path $DataDir $name
    if (Test-Path -LiteralPath $candidatePath -PathType Leaf) {
        $selectedFile = Get-Item -LiteralPath $candidatePath
        break
    }
}

# Si el nombre varió, busca la planilla de transporte más reciente dentro de /data.
if ($null -eq $selectedFile) {
    $selectedFile = Get-ChildItem -LiteralPath $DataDir -File -Filter "*.xlsx" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notlike '~$*' -and $_.Name -match '(?i)planilla.*transporte' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

if ($null -eq $selectedFile) {
    Write-EmptyBundle
    Write-Warning "No se encontró una planilla .xlsx válida dentro de la carpeta data."
    exit 2
}

if ($selectedFile.Length -lt 100) {
    Write-EmptyBundle
    Write-Warning "La planilla encontrada está vacía o incompleta: $($selectedFile.Name)"
    exit 3
}

Write-Status "Preparando copia local desde: $($selectedFile.Name)"
$bytes = [System.IO.File]::ReadAllBytes($selectedFile.FullName)
$base64 = [System.Convert]::ToBase64String($bytes)
$generatedAt = [DateTime]::UtcNow.ToString("o")
$lastModified = $selectedFile.LastWriteTimeUtc.ToString("o")

$fileNameJs = ConvertTo-JavaScriptString $selectedFile.Name
$lastModifiedJs = ConvertTo-JavaScriptString $lastModified
$generatedAtJs = ConvertTo-JavaScriptString $generatedAt

$content = @"
/*
 * Archivo generado automáticamente.
 * No editar manualmente: ejecuta actualizar_datos_locales.cmd.
 */
window.TRANSPORT_LOCAL_BUNDLE = {
  fileName: $fileNameJs,
  lastModified: $lastModifiedJs,
  generatedAt: $generatedAtJs,
  base64: "$base64"
};
"@

$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($BundlePath, $content, $encoding)

$sizeMb = [Math]::Round((Get-Item -LiteralPath $BundlePath).Length / 1MB, 2)
Write-Status "Copia local actualizada correctamente: data/planilla-local.js ($sizeMb MB)"
exit 0
