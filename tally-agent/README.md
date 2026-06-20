# 🛰️ Continental Tally Sync Agent

This is the standalone Tally Synchronization Agent designed to run locally in the corporate office environment on the Windows machine where Tally.ERP 9 / TallyPrime is hosted. 

It establishes a secure WebSocket tunnel with your cloud ERP and maps transactions to Tally's local XML HTTP Server interface.

---

## 📋 Prerequisites
1. **Node.js** (v16.0 or higher) installed on the Tally machine.
2. **Tally.ERP 9 / TallyPrime** running with the **HTTP Server enabled on port 9000** (see configuration steps below).
3. The ERP server must be running and accessible over the network.

---

## ⚙️ Tally Configuration
To enable Tally's XML server:
1. Open Tally and load your active Company.
2. Press **`F12`** (Configure) ➔ **`Advanced Configuration`**.
3. Apply the following settings:
   *   **Tally is acting as**: `Both` (or Server)
   *   **Enable ODBC Server**: `Yes`
   *   **Port**: `9000`
   *   **Enable HTTP Server**: `Yes`
   *   **HTTP Server Port**: `9000`
4. Press **`Ctrl + A`** to save.
5. Accept and click **Yes** to restart Tally.

---

## 🚀 Installation & Running the Agent

1. **Navigate to the agent directory**:
   ```bash
   cd tally-agent
   ```

2. **Install the node modules**:
   ```bash
   npm install
   ```

3. **Set Environment Variables (Optional)**:
   By default, the agent connects to `ws://localhost:5000/tally-sync` (local ERP). For production/cloud deployments, configure these variables in a `.env` file or in your terminal:
   ```env
   ERP_WS_URL=wss://your-erp-domain.com/tally-sync
   TALLY_SYNC_TOKEN=tally_secret_token_123
   TALLY_HTTP_URL=http://localhost:9000
   ```

4. **Start the agent**:
   ```bash
   npm start
   ```

The console will print:
`🔌 Connecting to Continental Cloud ERP...`
`✓ Connected to Continental Cloud ERP WebSocket server.`

---

## 🧪 Testing in Tally Educational Mode
Tally Educational Mode restricts voucher dates to only the **1st, 2nd, and 31st** of a month. 
The agent has built-in **Educational Mode Compatibility**: it automatically overrides transaction dates (e.g. 15th of June) to the **1st of the month** (e.g. 1st of June) so Tally imports them successfully without throwing errors.
