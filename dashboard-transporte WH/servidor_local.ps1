param(
    [int]$Puerto = 8000
)

$ErrorActionPreference = "Stop"
$ProjectDir = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))

function Get-ContentType {
    param([string]$Path)
    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { return "text/html; charset=utf-8" }
        ".htm"  { return "text/html; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".js"   { return "application/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".md"   { return "text/markdown; charset=utf-8" }
        ".txt"  { return "text/plain; charset=utf-8" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".svg"  { return "image/svg+xml" }
        ".ico"  { return "image/x-icon" }
        ".xlsx" { return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        default  { return "application/octet-stream" }
    }
}

function Send-HttpResponse {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [string]$ContentType,
        [byte[]]$Body,
        [bool]$HeadOnly = $false
    )

    if ($null -eq $Body) { $Body = [byte[]]@() }
    $headers = "HTTP/1.1 $StatusCode $StatusText`r`n" +
               "Content-Type: $ContentType`r`n" +
               "Content-Length: $($Body.Length)`r`n" +
               "Cache-Control: no-store, no-cache, must-revalidate`r`n" +
               "Pragma: no-cache`r`n" +
               "Connection: close`r`n`r`n"

    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if (-not $HeadOnly -and $Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }
    $Stream.Flush()
}

$listener = $null
$selectedPort = $null
foreach ($candidatePort in $Puerto..($Puerto + 10)) {
    try {
        $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidatePort)
        $candidate.Start()
        $listener = $candidate
        $selectedPort = $candidatePort
        break
    }
    catch {
        if ($candidate) {
            try { $candidate.Stop() } catch { }
        }
    }
}

if ($null -eq $listener) {
    Write-Host "No fue posible iniciar el servidor entre los puertos $Puerto y $($Puerto + 10)." -ForegroundColor Red
    exit 1
}

$url = "http://127.0.0.1:$selectedPort/"
Write-Host "=======================================================" -ForegroundColor DarkBlue
Write-Host " Dashboard de Transporte - Warehousing Chile" -ForegroundColor Blue
Write-Host "=======================================================" -ForegroundColor DarkBlue
Write-Host "Carpeta: $ProjectDir"
Write-Host "Dirección: $url"
Write-Host ""
Write-Host "El navegador se abrirá automáticamente." -ForegroundColor Green
Write-Host "Mantén esta ventana abierta mientras uses el dashboard."
Write-Host "Para detenerlo, presiona Ctrl + C o cierra esta ventana."
Write-Host ""

Start-Process $url
$rootPrefix = $ProjectDir.TrimEnd('\') + '\'

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $null
        $reader = $null
        try {
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
            $requestLine = $reader.ReadLine()

            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                continue
            }

            # Consume el resto de los encabezados HTTP.
            while ($true) {
                $line = $reader.ReadLine()
                if ($null -eq $line -or $line.Length -eq 0) { break }
            }

            $parts = $requestLine.Split(' ')
            if ($parts.Length -lt 2) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("Solicitud no válida.")
                Send-HttpResponse $stream 400 "Bad Request" "text/plain; charset=utf-8" $body
                continue
            }

            $method = $parts[0].ToUpperInvariant()
            $headOnly = $method -eq "HEAD"
            if ($method -ne "GET" -and -not $headOnly) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("Método no permitido.")
                Send-HttpResponse $stream 405 "Method Not Allowed" "text/plain; charset=utf-8" $body
                continue
            }

            $requestUri = [System.Uri]::new("http://127.0.0.1$($parts[1])")
            $relativePath = [System.Uri]::UnescapeDataString($requestUri.AbsolutePath).TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                $relativePath = "index.html"
            }

            $relativePath = $relativePath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            $fullPath = [System.IO.Path]::GetFullPath((Join-Path $ProjectDir $relativePath))

            if (-not $fullPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and
                -not $fullPath.Equals($ProjectDir, [System.StringComparison]::OrdinalIgnoreCase)) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("Acceso denegado.")
                Send-HttpResponse $stream 403 "Forbidden" "text/plain; charset=utf-8" $body $headOnly
                continue
            }

            if (Test-Path -LiteralPath $fullPath -PathType Container) {
                $fullPath = Join-Path $fullPath "index.html"
            }

            if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("Archivo no encontrado.")
                Send-HttpResponse $stream 404 "Not Found" "text/plain; charset=utf-8" $body $headOnly
                continue
            }

            $body = [System.IO.File]::ReadAllBytes($fullPath)
            Send-HttpResponse $stream 200 "OK" (Get-ContentType $fullPath) $body $headOnly
        }
        catch {
            Write-Warning "Error atendiendo una solicitud: $($_.Exception.Message)"
        }
        finally {
            if ($reader) { $reader.Dispose() }
            if ($stream) { $stream.Dispose() }
            $client.Close()
        }
    }
}
finally {
    $listener.Stop()
}
