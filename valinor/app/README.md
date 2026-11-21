# Valinor as its own Windows program

`Valinor.exe` runs the game in its own window, without a browser or `serve.cmd`. It reads the game straight from the `valinor` folder, including your own models in `models/`, and works offline: three.js and the font are kept in `lib/`.

```powershell
& C:\Users\Stefan\game\valinor\app\build.ps1 -Shortcut   # builds app\bin\Valinor.exe and puts a Valinor shortcut on the desktop
```

It uses the C# compiler that comes with Windows and Edge's WebView2 engine (Windows 11 has it), so nothing needs installing. Build it again only after changing `Valinor.cs`; changes to the game itself show up the next time you start it.

- **F11**: fullscreen. **F8**: frame-rate meter. **F12**: developer tools.
- Test options go after the program's name, for example `Valinor.exe "?play=KINGDOMHEARTSII"`.
