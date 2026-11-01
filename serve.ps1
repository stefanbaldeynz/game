# A small local web server for the game collection. No installs needed.
#
# Browsers block a page opened straight from your files (file://) from loading
# 3D models and other assets, so run the games through this instead:
#   double-click serve.cmd, or run:  powershell -ExecutionPolicy Bypass -File serve.ps1
# It opens the game select (http://localhost:8000/). The games are at
# http://localhost:8000/<folder>/ . Press Ctrl+C (or close the window) to stop.
#
# It only listens on this computer (localhost); nobody else on the network can reach it.
# Every file is sent fresh (no caching), so after editing a file just refresh the page.

param(
  [int]$Port = 8000,       # tries the next port up if this one is taken
  [string]$Open = '', # page to open in the browser ("" for the game select)
  [switch]$NoBrowser       # don't open a browser window
)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.md'   = 'text/markdown; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
  '.glb'  = 'model/gltf-binary'
  '.gltf' = 'model/gltf+json'
  '.bin'  = 'application/octet-stream'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.svg'  = 'image/svg+xml'
  '.ktx2' = 'image/ktx2'
  '.hdr'  = 'application/octet-stream'
  '.mp3'  = 'audio/mpeg'
  '.ogg'  = 'audio/ogg'
  '.wav'  = 'audio/wav'
  '.wasm' = 'application/wasm'
  '.ico'  = 'image/x-icon'
}

# Find a free port.
$listener = $null
for ($p = $Port; $p -lt $Port + 20; $p++) {
  $try = New-Object System.Net.HttpListener
  $try.Prefixes.Add("http://localhost:$p/")
  try {
    $try.Start()
    $listener = $try
    $Port = $p
    break
  } catch {
    $try.Close()
  }
}
if (-not $listener) { throw "No free port between $Port and $($Port + 19)." }

$url = "http://localhost:$Port/"
Write-Host ''
Write-Host "  Game collection running at $url" -ForegroundColor Green
Write-Host "  Serving $root"
Write-Host '  Press Ctrl+C or close this window to stop.'
Write-Host ''
if (-not $NoBrowser) { Start-Process ($url + $Open) }

function Send($ctx, [int]$status, [byte[]]$body, [string]$type) {
  $res = $ctx.Response
  $res.StatusCode = $status
  $res.ContentType = $type
  $res.Headers['Cache-Control'] = 'no-store'
  $res.ContentLength64 = $body.Length
  try { $res.OutputStream.Write($body, 0, $body.Length) } catch {}
  $res.Close()
}

try {
  while ($listener.IsListening) {
    # Wait in short steps so Ctrl+C can stop the server.
    $task = $listener.GetContextAsync()
    while (-not $task.Wait(250)) {}
    $ctx = $task.Result
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    $file = [IO.Path]::GetFullPath((Join-Path $root $path))

    if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and ($file + '\') -ne $root) {
      Send $ctx 403 ([Text.Encoding]::UTF8.GetBytes('Forbidden')) 'text/plain'
      continue
    }
    if (Test-Path -LiteralPath $file -PathType Container) {
      if (-not $ctx.Request.Url.AbsolutePath.EndsWith('/')) {
        # Folder without a trailing slash: redirect so relative links work.
        $ctx.Response.Redirect($ctx.Request.Url.AbsolutePath + '/')
        $ctx.Response.Close()
        continue
      }
      $file = Join-Path $file 'index.html'
    }
    if (Test-Path -LiteralPath $file -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $type = $types[$ext]
      if (-not $type) { $type = 'application/octet-stream' }
      Send $ctx 200 ([IO.File]::ReadAllBytes($file)) $type
      Write-Host "  200 /$path"
    } else {
      Send $ctx 404 ([Text.Encoding]::UTF8.GetBytes("Not found: /$path")) 'text/plain'
      Write-Host "  404 /$path" -ForegroundColor Yellow
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
