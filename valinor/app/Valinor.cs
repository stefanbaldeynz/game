// Valinor as its own Windows program: one window, the game inside it (Edge's WebView2 engine, which Windows 11 already has), its files read
// straight from the valinor folder (no server, no browser), your own models in models/ included. F11 toggles fullscreen; F12 opens the developer tools.
// Built by build.ps1 with the C# compiler that comes with Windows (no SDK needed).
using System;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

class ValinorApp : Form
{
    readonly WebView2 web = new WebView2();
    FormWindowState before = FormWindowState.Maximized;

    [STAThread]
    static void Main(string[] args)
    {
        Application.EnableVisualStyles();
        Application.Run(new ValinorApp(args.Length > 0 ? args[0] : ""));
    }

    // Windows' own setting (Settings > Display > Graphics) for this program and Edge's WebView2 engine: the high-performance graphics card, not the battery-saving one
    static void HighPerformanceGpu()
    {
        try
        {
            using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\DirectX\UserGpuPreferences"))
            {
                var paths = new System.Collections.Generic.List<string> { Application.ExecutablePath };
                foreach (string root in new[] { Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles) })
                {
                    string ev = Path.Combine(root, @"Microsoft\EdgeWebView\Application");
                    if (Directory.Exists(ev)) foreach (string f in Directory.GetFiles(ev, "msedgewebview2.exe", SearchOption.AllDirectories)) paths.Add(f);
                }
                foreach (string p in paths) if ((k.GetValue(p) as string) != "GpuPreference=2;") k.SetValue(p, "GpuPreference=2;");
            }
        }
        catch { }
    }

    ValinorApp(string query)
    {
        Text = "Valinor";
        BackColor = Color.Black;
        StartPosition = FormStartPosition.CenterScreen;
        Size = new Size(1600, 900);
        WindowState = FormWindowState.Maximized;
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        web.Dock = DockStyle.Fill;
        web.DefaultBackgroundColor = Color.Black;
        Controls.Add(web);
        Load += async (s, e) => { await Start(query); };
    }

    // the valinor folder: the one above this program that holds index.html and lib/
    static string FindGame()
    {
        string d = AppDomain.CurrentDomain.BaseDirectory;
        for (int i = 0; i < 5 && d != null; i++)
        {
            if (File.Exists(Path.Combine(d, "index.html")) && Directory.Exists(Path.Combine(d, "lib"))) return d;
            DirectoryInfo up = Directory.GetParent(d.TrimEnd('\\'));
            d = up == null ? null : up.FullName;
        }
        return null;
    }

    async Task Start(string query)
    {
        string game = FindGame();
        if (game == null) { MessageBox.Show("Valinor's files weren't found: keep this program in valinor\\app\\bin.", "Valinor"); Close(); return; }
        try
        {
            // (the graphics card always used, and nothing slowed while the window is in the background)
            var opts = new CoreWebView2EnvironmentOptions("--force_high_performance_gpu --ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy --disable-background-timer-throttling --disable-renderer-backgrounding --autoplay-policy=no-user-gesture-required");
            string data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Valinor");
            var env = await CoreWebView2Environment.CreateAsync(null, data, opts);
            await web.EnsureCoreWebView2Async(env);
        }
        catch (Exception ex)
        {
            MessageBox.Show("Edge's WebView2 engine couldn't start: " + ex.Message + "\n\nInstall it from https://go.microsoft.com/fwlink/p/?LinkId=2124703", "Valinor");
            Close(); return;
        }
        CoreWebView2 cw = web.CoreWebView2;
        cw.SetVirtualHostNameToFolderMapping("valinor.local", game, CoreWebView2HostResourceAccessKind.Allow);
        cw.Settings.AreDefaultContextMenusEnabled = false;
        cw.Settings.IsStatusBarEnabled = false;
        cw.Settings.IsZoomControlEnabled = false;
        cw.ContainsFullScreenElementChanged += (s, e) => Fullscreen(cw.ContainsFullScreenElement);
        cw.DocumentTitleChanged += (s, e) => { Text = cw.DocumentTitle; };
        await cw.AddScriptToExecuteOnDocumentCreatedAsync(
            "addEventListener('keydown', e => { if (e.key === 'F11') { e.preventDefault(); document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } }, true);");
        cw.Navigate("https://valinor.local/index.html" + (query.StartsWith("?") ? query : ""));
    }

    void Fullscreen(bool on)
    {
        if (on) { before = WindowState; FormBorderStyle = FormBorderStyle.None; WindowState = FormWindowState.Normal; WindowState = FormWindowState.Maximized; }
        else { FormBorderStyle = FormBorderStyle.Sizable; WindowState = before; }
    }
}
