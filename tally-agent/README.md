# 🛰️ Continental Tally Sync Agent (Desktop App)

A standalone Windows desktop application designed to sync transactions between your **Continental Cloud ERP** and a local **Tally.ERP 9 / TallyPrime** installation. 

Built with **Electron**, it bundles its own Node.js runtime, meaning it **does not require Node.js to be pre-installed on the client machine**. It features a modern configuration GUI dashboard, minimizes to the system tray, and runs automatically on Windows boot.

---

## ✨ Features

- **Sleek Configuration GUI:** No more environment variables or command prompts. Easily configure Cloud WebSocket URLs, Tally HTTP ports, and authentication tokens via a premium dark-mode interface.
- **Zero Dependencies for Client PC:** Self-contained executable installer installs the app and dependencies automatically.
- **Real-Time Logs Terminal:** View live sync details (ledgers, vouchers, purchases, quotations, and expenses) directly inside the app logs window.
- **System Tray Integration:** Runs silently in the background. Minimizing or closing the app sends it to the system tray to keep your desktop clean.
- **Windows Boot Auto-Start:** Configurable toggle to automatically register the sync agent to start running silently when the PC is booted.
- **Tally Connectivity Ping:** Background status checker validates Tally connection state every 15 seconds, turning red or green inside the UI to give instant connectivity feedback.

---

## ⚙️ Tally Configuration

Before starting the agent, you must enable Tally's local XML HTTP Server interface:

1. Open Tally and load your active Company.
2. Press **`F12`** (Configure) ➔ **`Advanced Configuration`**.
3. Apply the following settings:
   - **Tally is acting as**: `Both` (or `Server`)
   - **Enable ODBC Server**: `Yes`
   - **Port**: `9000` (or matching your custom Tally URL)
   - **Enable HTTP Server**: `Yes`
   - **HTTP Server Port**: `9000`
4. Press **`Ctrl + A`** to save.
5. Accept and click **Yes** to restart Tally.

---

## 💻 Developer Setup & Running Locally

If you are developing or running the agent from source code:

### 1. Install Node.js
Ensure Node.js (v18 or higher) is installed on your development machine.

### 2. Install Dependencies
Navigate to the `tally-agent` directory and install the packages:
```bash
cd tally-agent
npm install
```

### 3. Run the App in Development
Start the Electron application:
```bash
npm start
```

---

## 📦 How to Build the Installer Executable

To compile the application into a single, redistributable Windows setup installer (`.exe`):

### Local Compilation:
In the `tally-agent` directory, run:
```bash
npm run dist
```
This packages the app assets and builds the installer. Once completed, the standalone executable setup will be available in:
`tally-agent/dist/Continental Tally Sync Agent Setup 1.0.0.exe`

### Automated Cloud Builds (GitHub Releases):
We have integrated a GitHub Actions workflow. When you push code updates, you can publish a release by creating and pushing a Git tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```
This automatically compiles the Windows installer on GitHub's servers and attaches it to a new GitHub Release for instant client download.

---

## 🚀 Client Installation & Setup

1. Download the compiled `Continental Tally Sync Agent Setup 1.0.0.exe` from your release.
2. Double-click the installer. It will install the application and create Desktop and Start Menu shortcuts.
3. Upon launch, enter the credentials:
   - **Cloud ERP WebSocket URL**: (e.g. `wss://your-erp-domain.com/tally-sync`)
   - **Tally Sync Token**: The security token from your cloud ERP.
   - **Local Tally HTTP URL**: (e.g. `http://localhost:9000`)
4. Toggle **Auto-run on Windows startup** to ensure it runs automatically on reboot.
5. Click **Save Settings** followed by **Start Sync**.
6. Verify both status indicators (Cloud ERP WebSocket & Local Tally) turn green.
7. Close the window — the app will keep running silently in your system tray.
