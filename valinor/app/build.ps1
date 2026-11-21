# Builds Valinor.exe (valinor\app\bin\Valinor.exe) with the C# compiler that comes with Windows, and Microsoft's WebView2 package from NuGet
# (fetched into app\packages the first time). Run it again after changing Valinor.cs. The game itself needs no building.
#   .\build.ps1             build it
#   .\build.ps1 -Shortcut   and put a Valinor shortcut on the desktop
param([switch]$Shortcut)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot; $pk = "$here\packages\webview2"; $bin = "$here\bin"
if (!(Test-Path "$pk\lib\net462\Microsoft.Web.WebView2.WinForms.dll")) {
  New-Item -ItemType Directory -Force "$here\packages" | Out-Null
  Invoke-WebRequest 'https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2' -OutFile "$here\packages\webview2.zip" -UseBasicParsing
  Expand-Archive "$here\packages\webview2.zip" $pk -Force
}
New-Item -ItemType Directory -Force $bin | Out-Null
foreach ($f in "$pk\lib\net462\Microsoft.Web.WebView2.Core.dll", "$pk\lib\net462\Microsoft.Web.WebView2.WinForms.dll", "$pk\runtimes\win-x64\native\WebView2Loader.dll") { Copy-Item $f $bin -Force }
$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$icon = if (Test-Path "$here\valinor.ico") { "/win32icon:$here\valinor.ico" } else { $null }
& $csc /nologo /target:winexe /platform:x64 /optimize+ "/out:$bin\Valinor.exe" $icon `
  "/reference:$bin\Microsoft.Web.WebView2.Core.dll" "/reference:$bin\Microsoft.Web.WebView2.WinForms.dll" `
  /reference:System.Windows.Forms.dll /reference:System.Drawing.dll "$here\Valinor.cs"
if ($LASTEXITCODE) { throw 'The build failed (see above).' }
"Built $bin\Valinor.exe"
if ($Shortcut) {
  $s = (New-Object -ComObject WScript.Shell).CreateShortcut("$([Environment]::GetFolderPath('Desktop'))\Valinor.lnk")
  $s.TargetPath = "$bin\Valinor.exe"; $s.WorkingDirectory = $bin; $s.Save(); 'Shortcut on the desktop.'
}
