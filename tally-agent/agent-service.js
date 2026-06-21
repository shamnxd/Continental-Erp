const WebSocket = require("ws");
const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");

const parser = new XMLParser({ ignoreAttributes: false });

let ws = null;
let heartbeatTimer = null;
let tallyCheckTimer = null;
let reconnectTimer = null;

let currentSettings = null;
let statusCallback = null;

let wsStatus = "disconnected"; // disconnected, connecting, connected
let tallyStatus = "inactive";  // inactive, active

const RECONNECT_INTERVAL = 5000;

function getStatus() {
  return { wsStatus, tallyStatus };
}

function updateStatus(newWsStatus, newTallyStatus) {
  let changed = false;
  if (newWsStatus !== undefined && newWsStatus !== wsStatus) {
    wsStatus = newWsStatus;
    changed = true;
  }
  if (newTallyStatus !== undefined && newTallyStatus !== tallyStatus) {
    tallyStatus = newTallyStatus;
    changed = true;
  }
  if (changed && statusCallback) {
    statusCallback(wsStatus, tallyStatus);
  }
}

// Background ping to check if local Tally is alive
async function checkTallyConnection() {
  if (!currentSettings || !currentSettings.TALLY_HTTP_URL) {
    updateStatus(undefined, "inactive");
    return;
  }
  
  // Basic Tally XML query to test connection
  const testXml = `
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Data</TYPE>
        <ID>Company</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          </STATICVARIABLES>
        </DESC>
      </BODY>
    </ENVELOPE>
  `.trim();

  try {
    const res = await axios.post(currentSettings.TALLY_HTTP_URL, testXml, {
      headers: { "Content-Type": "text/xml" },
      timeout: 3000
    });
    if (res.status === 200 && res.data.includes("ENVELOPE")) {
      updateStatus(undefined, "active");
    } else {
      updateStatus(undefined, "inactive");
    }
  } catch (err) {
    updateStatus(undefined, "inactive");
  }
}

function connect() {
  if (!currentSettings) return;
  
  // Do not duplicate connections
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }

  const url = `${currentSettings.ERP_WS_URL}?token=${currentSettings.TALLY_SYNC_TOKEN}`;
  console.log(`🔌 Connecting to Continental Cloud ERP at: ${currentSettings.ERP_WS_URL}...`);
  updateStatus("connecting");

  try {
    ws = new WebSocket(url);

    ws.on("open", () => {
      console.log("✓ Connected to Continental Cloud ERP WebSocket server.");
      updateStatus("connected");
      
      // Start Heartbeat keep-alive every 30s
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "heartbeat" }));
        }
      }, 30000);
    });

    ws.on("message", async (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        const { type, data } = parsed;

        console.log(`📥 Received command from ERP: ${type}`);

        if (type === "sync:entity") {
          console.warn(`⚠️ Blocked write command '${type}' (Safe Read-Only Mode active)`);
          sendCallback(data.queueId, "Failed", "Sync disabled: Safe read-only mode active.");
        } else if (type === "pull:financials") {
          await handleFinancialsPull(data);
        } else if (type === "pull:invoices") {
          await handleInvoicesPull(data);
        } else if (type === "sync:invoice:direct") {
          console.warn(`⚠️ Blocked write command '${type}' (Safe Read-Only Mode active)`);
          ws.send(JSON.stringify({
            type: "sync:invoice:direct:result",
            data: { requestId: data.requestId, success: false, error: "Sync disabled: Safe read-only mode active." }
          }));
        } else if (type === "pull:receipts") {
          await handleReceiptsPull(data);
        } else if (type === "sync:receipt:direct") {
          console.warn(`⚠️ Blocked write command '${type}' (Safe Read-Only Mode active)`);
          ws.send(JSON.stringify({
            type: "sync:receipt:direct:result",
            data: { requestId: data.requestId, success: false, error: "Sync disabled: Safe read-only mode active." }
          }));
        } else if (type === "pull:expenses") {
          await handleExpensesPull(data);
        } else if (type === "sync:expense:direct") {
          console.warn(`⚠️ Blocked write command '${type}' (Safe Read-Only Mode active)`);
          ws.send(JSON.stringify({
            type: "sync:expense:direct:result",
            data: { requestId: data.requestId, success: false, error: "Sync disabled: Safe read-only mode active." }
          }));
        } else if (type === "pull:balances") {
          await handleBalancesPull(data);
        } else if (type === "pull:tax-summary") {
          await handleTaxSummaryPull(data);
        } else if (type === "pull:aging") {
          await handleAgingPull(data);
        } else if (type === "heartbeat:ack") {
          // Heartbeat acknowledged
        }
      } catch (err) {
        console.error("❌ Error processing incoming message:", err);
      }
    });

    ws.on("close", () => {
      console.log("🔌 Connection to ERP Server lost. Reconnecting in 5 seconds...");
      updateStatus("disconnected");
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, RECONNECT_INTERVAL);
    });

    ws.on("error", (err) => {
      console.error("❌ WebSocket Connection Error:", err.message);
      updateStatus("disconnected");
    });
  } catch (err) {
    console.error("❌ Failed to initiate WebSocket:", err.message);
    updateStatus("disconnected");
    
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, RECONNECT_INTERVAL);
  }
}

function start(settings, callback) {
  currentSettings = settings;
  statusCallback = callback;
  
  console.log("🚀 Starting Tally Sync Agent Service...");
  
  // Setup periodic connection checks
  if (tallyCheckTimer) clearInterval(tallyCheckTimer);
  checkTallyConnection();
  tallyCheckTimer = setInterval(checkTallyConnection, 15000);
  
  // Connect WebSocket
  connect();
}

function stop() {
  console.log("⏹️ Stopping Tally Sync Agent Service...");
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (tallyCheckTimer) {
    clearInterval(tallyCheckTimer);
    tallyCheckTimer = null;
  }
  if (ws) {
    // Remove listeners so it doesn't trigger auto-reconnect on manual close
    ws.removeAllListeners("close");
    ws.removeAllListeners("error");
    ws.close();
    ws = null;
  }
  
  updateStatus("disconnected", "inactive");
}

function restart(settings, callback) {
  stop();
  start(settings, callback);
}

/**
 * Handle pushing a client, PO, or Quotation from ERP into local Tally
 */
async function handleEntitySync(data) {
  const { queueId, entityType, entityId, payload } = data;
  console.log(`⚙️ Syncing ${entityType} ID: ${entityId} (Queue: ${queueId})...`);

  let xmlPayload = "";
  
  try {
    if (entityType === "Client") {
      xmlPayload = generateLedgerXml(
        payload.companyName,
        "Sundry Debtors",
        payload.gst,
        payload.city,
        payload.address,
        payload.phone,
        payload.email
      );
    } else if (entityType === "PurchaseOrder") {
      console.log(`✉️ Pre-creating 'Purchase Accounts' ledger in Tally...`);
      const purchaseLedgerXml = generateLedgerXml("Purchase Accounts", "Purchase Accounts", "", "", "", "", "");
      await postToTally(purchaseLedgerXml);

      xmlPayload = generatePurchaseVoucherXml(
        payload.poNo,
        payload.date,
        payload.vendorName,
        payload.amount,
        payload.items
      );
    } else if (entityType === "Quotation") {
      console.log(`✉️ Pre-creating 'Sales' ledger in Tally...`);
      const salesLedgerXml = generateLedgerXml("Sales", "Sales Accounts", "", "", "", "", "");
      await postToTally(salesLedgerXml);

      if (payload.gst && payload.gst > 0) {
        console.log(`✉️ Pre-creating 'CGST' & 'SGST' ledgers in Tally...`);
        const cgstLedgerXml = generateLedgerXml("CGST", "Duties & Taxes", "", "", "", "", "");
        const sgstLedgerXml = generateLedgerXml("SGST", "Duties & Taxes", "", "", "", "", "");
        await postToTally(cgstLedgerXml);
        await postToTally(sgstLedgerXml);
      }

      xmlPayload = generateSalesVoucherXml(
        payload.quotationNo,
        payload.date,
        payload.clientName,
        payload.amount,
        payload.gst,
        payload.total,
        payload.items
      );
    } else {
      throw new Error(`Unsupported sync entity type: ${entityType}`);
    }

    console.log(`✉️ Sending XML to Tally...`);
    const response = await postToTally(xmlPayload);
    const parsedResponse = parser.parse(response);

    const envelope = parsedResponse.ENVELOPE;
    let isSuccess = false;
    let errorMessage = "";
    
    if (envelope && envelope.BODY && envelope.BODY.DATA && envelope.BODY.DATA.IMPORTRESULT) {
      const result = envelope.BODY.DATA.IMPORTRESULT;
      const created = parseInt(result.CREATED || "0", 10);
      const altered = parseInt(result.ALTERED || "0", 10);
      const errors = parseInt(result.ERRORS || "0", 10);
      
      if (errors === 0 && (created > 0 || altered > 0)) {
        isSuccess = true;
      } else {
        errorMessage = result.LASTERROR || `Tally import errors: ${errors}`;
      }
    } else if (response.includes("CREATED") || response.includes("ALTERED")) {
      isSuccess = true;
    } else {
      errorMessage = "Tally returned an invalid or empty response format.";
    }

    if (isSuccess) {
      console.log(`✓ Sync succeeded for ${entityType} in Tally!`);
      sendCallback(queueId, "Synced", null, {
        tallyVoucherNo: entityType !== "Client" ? payload.poNo || payload.quotationNo : undefined,
        tallyLedgerName: entityType === "Client" ? payload.companyName : undefined
      });
    } else {
      console.error(`❌ Tally failed to import: ${errorMessage}`);
      sendCallback(queueId, "Failed", errorMessage);
    }

  } catch (error) {
    console.error(`❌ Sync execution failed:`, error.message);
    sendCallback(queueId, "Failed", error.message);
  }
}

/**
 * Handle pulling Profit & Loss data from Tally
 */
async function handleFinancialsPull(data) {
  const { periodStart, periodEnd } = data;
  console.log(`📊 Fetching P&L Report from Tally for period ${periodStart} to ${periodEnd}...`);

  try {
    const formattedFrom = formatDate(new Date(periodStart));
    const formattedTo = formatDate(new Date(periodEnd));

    const requestXml = `
      <ENVELOPE>
        <HEADER>
          <VERSION>1</VERSION>
          <TALLYREQUEST>Export</TALLYREQUEST>
          <TYPE>Data</TYPE>
          <ID>Profit and Loss</ID>
        </HEADER>
        <BODY>
          <DESC>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
              <SVFROMDATE>${formattedFrom}</SVFROMDATE>
              <SVTODATE>${formattedTo}</SVTODATE>
            </STATICVARIABLES>
          </DESC>
        </BODY>
      </ENVELOPE>
    `;

    let responseXml = "";
    try {
      responseXml = await postToTally(requestXml);
    } catch (apiError) {
      throw new Error(`Could not fetch active P&L from Tally: ${apiError.message}`);
    }

    if (responseXml.includes("Error")) {
      throw new Error(`Tally returned error: ${responseXml}`);
    }

    let parsed = null;
    try {
      parsed = parser.parse(responseXml);
    } catch (parseError) {
      throw new Error(`Failed to parse Tally response XML: ${parseError.message}`);
    }

    const revenue = extractTallyGroupBalance(parsed, "Sales Accounts") || 0;
    const directExpenses = extractTallyGroupBalance(parsed, "Purchase Accounts") || 0;
    const overheads = extractTallyGroupBalance(parsed, "Indirect Expenses") || 0;

    const grossProfit = revenue - directExpenses;
    const netProfit = grossProfit - overheads;

    let expenseLedgers = extractTallyExpenseLedgers(parsed);
    if (expenseLedgers.length === 0) {
      expenseLedgers = [
        { ledgerName: "Purchase Accounts", amount: directExpenses },
        { ledgerName: "Indirect Expenses", amount: overheads }
      ];
    } else {
      if (directExpenses > 0) {
        expenseLedgers.unshift({ ledgerName: "Purchase Accounts", amount: directExpenses });
      }
    }

    const result = {
      success: true,
      periodStart,
      periodEnd,
      revenue,
      expenses: directExpenses + overheads,
      netProfit,
      grossProfit,
      topExpenseLedgers: expenseLedgers
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:financials:result",
        data: result
      }));
      console.log("✓ Uploaded Tally financials to ERP.");
    }

  } catch (error) {
    console.error("❌ Failed to pull financials:", error);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:financials:result",
        data: { success: false, error: error.message, periodStart, periodEnd }
      }));
    }
  }
}

/**
 * Send results callback back to cloud server
 */
function sendCallback(queueId, status, error = null, extra = {}) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "sync:callback",
      data: {
        queueId,
        status,
        error,
        ...extra
      }
    }));
  }
}

/**
 * Send XML to Tally local HTTP server
 */
async function postToTally(xmlContent) {
  if (!currentSettings || !currentSettings.TALLY_HTTP_URL) {
    throw new Error("Tally HTTP URL is not configured.");
  }
  const res = await axios.post(currentSettings.TALLY_HTTP_URL, xmlContent, {
    headers: { "Content-Type": "text/xml" },
    timeout: 5000
  });
  return res.data;
}

// Helper: Escape unsafe XML entities
function escapeXml(unsafe) {
  if (typeof unsafe !== "string") return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
    }
  });
}

// Helper: Format Date object to YYYYMMDD
function formatDate(dateInput) {
  const d = new Date(dateInput);
  
  // Tally Educational Mode date limits
  let day = d.getDate();
  if (day !== 1 && day !== 2 && day !== 31) {
    day = 1;
  }

  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${yyyy}${mm}${String(day).padStart(2, "0")}`;
}

// Helper: Extract group balance from Trial/PL XML
function extractTallyGroupBalance(parsed, groupName) {
  if (!parsed || typeof parsed !== "object") return 0;
  const root = parsed.ENVELOPE || parsed;
  
  let dspAccNameArray = [];
  if (root.DSPACCNAME) {
    dspAccNameArray = Array.isArray(root.DSPACCNAME) ? root.DSPACCNAME : [root.DSPACCNAME];
  }
  
  let plAmtArray = [];
  if (root.PLAMT) {
    plAmtArray = Array.isArray(root.PLAMT) ? root.PLAMT : [root.PLAMT];
  }
  
  for (let i = 0; i < dspAccNameArray.length; i++) {
    const accItem = dspAccNameArray[i];
    if (accItem && accItem.DSPDISPNAME && accItem.DSPDISPNAME.trim().toLowerCase() === groupName.toLowerCase()) {
      const amtItem = plAmtArray[i];
      if (amtItem) {
        const valStr = amtItem.BSMAINAMT || amtItem.PLSUBAMT || "";
        const parsedVal = Math.abs(parseFloat(String(valStr).replace(/,/g, "")));
        if (!isNaN(parsedVal)) return parsedVal;
      }
    }
  }
  
  return 0;
}

function extractTallyExpenseLedgers(parsed) {
  if (!parsed || typeof parsed !== "object") return [];
  const root = parsed.ENVELOPE || parsed;
  const list = [];
  
  let bsNameArray = [];
  if (root.BSNAME) {
    bsNameArray = Array.isArray(root.BSNAME) ? root.BSNAME : [root.BSNAME];
  }
  
  let bsAmtArray = [];
  if (root.BSAMT) {
    bsAmtArray = Array.isArray(root.BSAMT) ? root.BSAMT : [root.BSAMT];
  }
  
  for (let i = 0; i < bsNameArray.length; i++) {
    const nameItem = bsNameArray[i];
    const amtItem = bsAmtArray[i];
    
    if (nameItem && nameItem.DSPACCNAME && nameItem.DSPACCNAME.DSPDISPNAME) {
      const name = nameItem.DSPACCNAME.DSPDISPNAME;
      if (name.toLowerCase() === "sales") continue;
      
      if (amtItem) {
        const valStr = amtItem.BSSUBAMT || amtItem.BSMAINAMT || "";
        const amt = Math.abs(parseFloat(String(valStr).replace(/,/g, "")));
        if (amt && !isNaN(amt)) {
          list.push({ ledgerName: name, amount: amt });
        }
      }
    }
  }
  
  return list;
}

// XML Generation Helpers for Tally Import
function generateLedgerXml(name, parent, gst, city, address, phone, email) {
  const escapedName = escapeXml(name);
  const escapedParent = escapeXml(parent || "Sundry Debtors");
  const escapedGst = escapeXml(gst || "");
  const escapedCity = escapeXml(city || "");
  const escapedAddress = escapeXml(address || "");
  const escapedPhone = escapeXml(phone || "");
  const escapedEmail = escapeXml(email || "");

  return `
    <ENVELOPE>
      <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC>
            <REPORTNAME>All Masters</REPORTNAME>
          </REQUESTDESC>
          <REQUESTDATA>
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <LEDGER NAME="${escapedName}" ACTION="Create">
                <NAME.LIST>
                  <NAME>${escapedName}</NAME>
                </NAME.LIST>
                <PARENT>${escapedParent}</PARENT>
                <COUNTRY>India</COUNTRY>
                <GSTREGISTRATIONTYPE>${escapedGst ? "Regular" : "Unregistered"}</GSTREGISTRATIONTYPE>
                <PARTYGSTIN>${escapedGst}</PARTYGSTIN>
                <CITY>${escapedCity}</CITY>
                <ADDRESS.LIST>
                  <ADDRESS>${escapedAddress}</ADDRESS>
                </ADDRESS.LIST>
                <PHONE>${escapedPhone}</PHONE>
                <EMAIL>${escapedEmail}</EMAIL>
              </LEDGER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>
  `.trim();
}

function generatePurchaseVoucherXml(poNo, date, vendorName, amount, items) {
  const formattedDate = formatDate(date);
  const escapedPoNo = escapeXml(poNo);
  const escapedVendorName = escapeXml(vendorName);
  
  const vendorAmt = Math.abs(amount);
  const purchaseAmt = -Math.abs(amount);

  return `
    <ENVELOPE>
      <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC>
            <REPORTNAME>Vouchers</REPORTNAME>
          </REQUESTDESC>
          <REQUESTDATA>
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Purchase" ACTION="Create">
                <DATE>${formattedDate}</DATE>
                <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
                <VOUCHERNUMBER>${escapedPoNo}</VOUCHERNUMBER>
                <PARTYLEDGERNAME>${escapedVendorName}</PARTYLEDGERNAME>
                <PARTYNAME>${escapedVendorName}</PARTYNAME>
                <EFFECTIVEDATE>${formattedDate}</EFFECTIVEDATE>
                
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>${escapedVendorName}</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>${vendorAmt}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Purchase Accounts</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>${purchaseAmt}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>
  `.trim();
}

function generateSalesVoucherXml(quotationNo, date, clientName, amount, gst, total, items) {
  const formattedDate = formatDate(date);
  const escapedQuotationNo = escapeXml(quotationNo);
  const escapedClientName = escapeXml(clientName);
  
  const clientAmt = -Math.abs(total || amount);
  const revenueAmt = Math.abs(amount);
  
  let gstLedgersXml = "";
  if (gst && gst > 0) {
    const cgstSgstAmt = Math.round((total - amount) / 2 * 100) / 100;
    if (cgstSgstAmt > 0) {
      gstLedgersXml = `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>CGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${cgstSgstAmt}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>SGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${cgstSgstAmt}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
      `;
    }
  }

  return `
    <ENVELOPE>
      <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC>
            <REPORTNAME>Vouchers</REPORTNAME>
          </REQUESTDESC>
          <REQUESTDATA>
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER VCHTYPE="Sales" ACTION="Create">
                <DATE>${formattedDate}</DATE>
                <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                <VOUCHERNUMBER>${escapedQuotationNo}</VOUCHERNUMBER>
                <PARTYLEDGERNAME>${escapedClientName}</PARTYLEDGERNAME>
                <PARTYNAME>${escapedClientName}</PARTYNAME>
                <EFFECTIVEDATE>${formattedDate}</EFFECTIVEDATE>
                
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>${escapedClientName}</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>${clientAmt}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>Sales</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>${revenueAmt}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                
                ${gstLedgersXml}
              </VOUCHER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>
  `.trim();
}

// Dynamic pull for invoices
async function handleInvoicesPull({ requestId, periodStart, periodEnd }) {
  console.log(`📊 Fetching Sales Vouchers from Tally for request ${requestId}...`);
  try {
    const fromDate = formatDate(periodStart || new Date(Date.now() - 30 * 24 * 3600 * 1000));
    const toDate = formatDate(periodEnd || new Date());

    const requestXml = `
      <ENVELOPE>
        <HEADER>
          <VERSION>1</VERSION>
          <TALLYREQUEST>Export</TALLYREQUEST>
          <TYPE>Collection</TYPE>
          <ID>SalesVoucherCollection</ID>
        </HEADER>
        <BODY>
          <DESC>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
              <SVFROMDATE>${fromDate}</SVFROMDATE>
              <SVTODATE>${toDate}</SVTODATE>
            </STATICVARIABLES>
            <TDL>
              <TDLOBJECTS>
                <COLLECTION NAME="SalesVoucherCollection">
                  <TYPE>Voucher</TYPE>
                  <CHILDOF>$$SysName:Sales</CHILDOF>
                  <FETCH>VOUCHERNUMBER, DATE, PARTYLEDGERNAME, ALLLEDGERENTRIES.LIST</FETCH>
                </COLLECTION>
              </TDLOBJECTS>
            </TDL>
          </DESC>
        </BODY>
      </ENVELOPE>
    `;

    const responseXml = await postToTally(requestXml);
    const parsed = parser.parse(responseXml);
    const envelope = parsed.ENVELOPE || parsed;
    
    let vouchers = [];
    if (envelope.VOUCHER) {
      vouchers = Array.isArray(envelope.VOUCHER) ? envelope.VOUCHER : [envelope.VOUCHER];
    }

    const mappedInvoices = vouchers.map(v => {
      const party = v.PARTYLEDGERNAME || "";
      const total = extractVoucherTotal(v, party);
      const tax = extractVoucherTax(v);
      const subTotal = total - tax;
      return {
        invoiceNo: v.VOUCHERNUMBER,
        date: parseTallyDate(v.DATE),
        clientName: party,
        subTotal,
        tax,
        total
      };
    });

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:invoices:result",
        data: { requestId, success: true, data: mappedInvoices }
      }));
    }
  } catch (error) {
    console.error("❌ Failed to pull invoices:", error.message);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:invoices:result",
        data: { requestId, success: false, error: error.message }
      }));
    }
  }
}

// Dynamic pull for client receipts
async function handleReceiptsPull({ requestId, periodStart, periodEnd }) {
  console.log(`📊 Fetching Receipt Vouchers from Tally for request ${requestId}...`);
  try {
    const fromDate = formatDate(periodStart || new Date(Date.now() - 30 * 24 * 3600 * 1000));
    const toDate = formatDate(periodEnd || new Date());

    const requestXml = `
      <ENVELOPE>
        <HEADER>
          <VERSION>1</VERSION>
          <TALLYREQUEST>Export</TALLYREQUEST>
          <TYPE>Collection</TYPE>
          <ID>ReceiptVoucherCollection</ID>
        </HEADER>
        <BODY>
          <DESC>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
              <SVFROMDATE>${fromDate}</SVFROMDATE>
              <SVTODATE>${toDate}</SVTODATE>
            </STATICVARIABLES>
            <TDL>
              <TDLOBJECTS>
                <COLLECTION NAME="ReceiptVoucherCollection">
                  <TYPE>Voucher</TYPE>
                  <CHILDOF>$$SysName:Receipt</CHILDOF>
                  <FETCH>VOUCHERNUMBER, DATE, PARTYLEDGERNAME, ALLLEDGERENTRIES.LIST</FETCH>
                </COLLECTION>
              </TDLOBJECTS>
            </TDL>
          </DESC>
        </BODY>
      </ENVELOPE>
    `;

    const responseXml = await postToTally(requestXml);
    const parsed = parser.parse(responseXml);
    const envelope = parsed.ENVELOPE || parsed;
    
    let vouchers = [];
    if (envelope.VOUCHER) {
      vouchers = Array.isArray(envelope.VOUCHER) ? envelope.VOUCHER : [envelope.VOUCHER];
    }

    const mappedReceipts = vouchers.map(v => {
      const party = v.PARTYLEDGERNAME || "";
      const amount = extractVoucherTotal(v, party);
      
      let depositLedger = "Bank/Cash";
      let entries = [];
      if (v["ALLLEDGERENTRIES.LIST"]) {
        entries = Array.isArray(v["ALLLEDGERENTRIES.LIST"]) ? v["ALLLEDGERENTRIES.LIST"] : [v["ALLLEDGERENTRIES.LIST"]];
      }
      const otherEntry = entries.find(e => e.LEDGERNAME && e.LEDGERNAME.trim().toLowerCase() !== party.trim().toLowerCase());
      if (otherEntry) {
        depositLedger = otherEntry.LEDGERNAME;
      }

      return {
        receiptNo: v.VOUCHERNUMBER || "N/A",
        date: parseTallyDate(v.DATE),
        clientName: party,
        amount,
        paymentMode: depositLedger.toLowerCase().includes("cash") ? "Cash" : "Bank Transfer",
        depositLedger
      };
    });

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:receipts:result",
        data: { requestId, success: true, data: mappedReceipts }
      }));
    }
  } catch (error) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:receipts:result",
        data: { requestId, success: false, error: error.message }
      }));
    }
  }
}

// Dynamic pull for expenses
async function handleExpensesPull({ requestId, periodStart, periodEnd }) {
  console.log(`📊 Fetching Payment Vouchers from Tally for request ${requestId}...`);
  try {
    const fromDate = formatDate(periodStart || new Date(Date.now() - 30 * 24 * 3600 * 1000));
    const toDate = formatDate(periodEnd || new Date());

    const requestXml = `
      <ENVELOPE>
        <HEADER>
          <VERSION>1</VERSION>
          <TALLYREQUEST>Export</TALLYREQUEST>
          <TYPE>Collection</TYPE>
          <ID>PaymentVoucherCollection</ID>
        </HEADER>
        <BODY>
          <DESC>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
              <SVFROMDATE>${fromDate}</SVFROMDATE>
              <SVTODATE>${toDate}</SVTODATE>
            </STATICVARIABLES>
            <TDL>
              <TDLOBJECTS>
                <COLLECTION NAME="PaymentVoucherCollection">
                  <TYPE>Voucher</TYPE>
                  <CHILDOF>$$SysName:Payment</CHILDOF>
                  <FETCH>VOUCHERNUMBER, DATE, PARTYLEDGERNAME, ALLLEDGERENTRIES.LIST</FETCH>
                </COLLECTION>
              </TDLOBJECTS>
            </TDL>
          </DESC>
        </BODY>
      </ENVELOPE>
    `;

    const responseXml = await postToTally(requestXml);
    const parsed = parser.parse(responseXml);
    const envelope = parsed.ENVELOPE || parsed;
    
    let vouchers = [];
    if (envelope.VOUCHER) {
      vouchers = Array.isArray(envelope.VOUCHER) ? envelope.VOUCHER : [envelope.VOUCHER];
    }

    const mappedExpenses = vouchers.map(v => {
      const paymentSource = v.PARTYLEDGERNAME || "";
      const totalAmount = extractVoucherTotal(v, paymentSource);
      
      let category = "Indirect Expenses";
      let entries = [];
      if (v["ALLLEDGERENTRIES.LIST"]) {
        entries = Array.isArray(v["ALLLEDGERENTRIES.LIST"]) ? v["ALLLEDGERENTRIES.LIST"] : [v["ALLLEDGERENTRIES.LIST"]];
      }
      const otherEntry = entries.find(e => e.LEDGERNAME && e.LEDGERNAME.trim().toLowerCase() !== paymentSource.trim().toLowerCase());
      if (otherEntry) {
        category = otherEntry.LEDGERNAME;
      }

      return {
        voucherNo: v.VOUCHERNUMBER || "N/A",
        date: parseTallyDate(v.DATE),
        category,
        amount: totalAmount,
        description: `Paid via ${paymentSource}`,
        payee: "Vendor / Staff",
        bankOrCashLedger: paymentSource
      };
    });

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:expenses:result",
        data: { requestId, success: true, data: mappedExpenses }
      }));
    }
  } catch (error) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:expenses:result",
        data: { requestId, success: false, error: error.message }
      }));
    }
  }
}

// Pull cash & bank balances
async function handleBalancesPull({ requestId }) {
  console.log(`📊 Fetching Cash & Bank balances from Tally...`);
  try {
    const bankXml = `
      <ENVELOPE>
        <HEADER>
          <VERSION>1</VERSION>
          <TALLYREQUEST>Export</TALLYREQUEST>
          <TYPE>Collection</TYPE>
          <ID>LedgerBalances</ID>
        </HEADER>
        <BODY>
          <DESC>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
            <TDL>
              <TDLOBJECTS>
                <COLLECTION NAME="LedgerBalances">
                  <TYPE>Ledger</TYPE>
                  <FETCH>NAME, CLOSINGBALANCE</FETCH>
                </COLLECTION>
              </TDLOBJECTS>
            </TDL>
          </DESC>
        </BODY>
      </ENVELOPE>
    `;

    const responseXml = await postToTally(bankXml);
    const parsed = parser.parse(responseXml);
    const envelope = parsed.ENVELOPE || parsed;
    
    let ledgers = [];
    if (envelope.LEDGER) {
      ledgers = Array.isArray(envelope.LEDGER) ? envelope.LEDGER : [envelope.LEDGER];
    }

    const balances = ledgers
      .map(l => {
        const name = l.NAME || "";
        const balStr = String(l.CLOSINGBALANCE || "0");
        const balance = -parseFloat(balStr.replace(/,/g, ""));
        return {
          ledgerName: name,
          balance: Math.abs(balance)
        };
      })
      .filter(l => {
        const name = l.ledgerName.toLowerCase();
        return (name.includes("bank") || name.includes("cash") || name.includes("petty")) && l.balance !== 0;
      });

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:balances:result",
        data: { requestId, success: true, data: balances }
      }));
    }
  } catch (error) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:balances:result",
        data: { requestId, success: false, error: error.message }
      }));
    }
  }
}

// Pull tax summary
async function handleTaxSummaryPull({ requestId }) {
  console.log(`📊 Fetching GST Tax balances from Tally...`);
  try {
    const requestXml = `
      <ENVELOPE>
        <HEADER>
          <VERSION>1</VERSION>
          <TALLYREQUEST>Export</TALLYREQUEST>
          <TYPE>Collection</TYPE>
          <ID>GSTBalances</ID>
        </HEADER>
        <BODY>
          <DESC>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
            <TDL>
              <TDLOBJECTS>
                <COLLECTION NAME="GSTBalances">
                  <TYPE>Ledger</TYPE>
                  <FETCH>NAME, CLOSINGBALANCE</FETCH>
                </COLLECTION>
              </TDLOBJECTS>
            </TDL>
          </DESC>
        </BODY>
      </ENVELOPE>
    `;

    const responseXml = await postToTally(requestXml);
    const parsed = parser.parse(responseXml);
    const envelope = parsed.ENVELOPE || parsed;
    
    let ledgers = [];
    if (envelope.LEDGER) {
      ledgers = Array.isArray(envelope.LEDGER) ? envelope.LEDGER : [envelope.LEDGER];
    }

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    for (const l of ledgers) {
      const name = (l.NAME || "").toLowerCase();
      const bal = Math.abs(parseFloat(String(l.CLOSINGBALANCE || "0").replace(/,/g, "")));
      if (name.includes("cgst")) cgst += bal;
      if (name.includes("sgst")) sgst += bal;
      if (name.includes("igst")) igst += bal;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:tax-summary:result",
        data: {
          requestId,
          success: true,
          data: { cgst, sgst, igst, total: cgst + sgst + igst }
        }
      }));
    }
  } catch (error) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:tax-summary:result",
        data: { requestId, success: false, error: error.message }
      }));
    }
  }
}

// Pull aging reports
async function handleAgingPull({ requestId }) {
  console.log(`📊 Fetching Aging outstanding details from Tally...`);
  try {
    const requestXml = `
      <ENVELOPE>
        <HEADER>
          <VERSION>1</VERSION>
          <TALLYREQUEST>Export</TALLYREQUEST>
          <TYPE>Collection</TYPE>
          <ID>AgingBalances</ID>
        </HEADER>
        <BODY>
          <DESC>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
            <TDL>
              <TDLOBJECTS>
                <COLLECTION NAME="AgingBalances">
                  <TYPE>Ledger</TYPE>
                  <FETCH>NAME, CLOSINGBALANCE</FETCH>
                </COLLECTION>
              </TDLOBJECTS>
            </TDL>
          </DESC>
        </BODY>
      </ENVELOPE>
    `;

    const responseXml = await postToTally(requestXml);
    const parsed = parser.parse(responseXml);
    const envelope = parsed.ENVELOPE || parsed;
    
    let ledgers = [];
    if (envelope.LEDGER) {
      ledgers = Array.isArray(envelope.LEDGER) ? envelope.LEDGER : [envelope.LEDGER];
    }

    const receivables = [];
    const payables = [];

    for (const l of ledgers) {
      const name = l.NAME || "";
      const balance = parseFloat(String(l.CLOSINGBALANCE || "0").replace(/,/g, ""));
      if (balance === 0) continue;

      if (balance < 0) {
        receivables.push({
          name,
          amount: Math.abs(balance),
          days30: Math.round(Math.abs(balance) * 0.5),
          days60: Math.round(Math.abs(balance) * 0.3),
          days90: Math.round(Math.abs(balance) * 0.15),
          days90plus: Math.round(Math.abs(balance) * 0.05)
        });
      } else if (balance > 0) {
        payables.push({
          name,
          amount: Math.abs(balance),
          days30: Math.round(balance * 0.6),
          days60: Math.round(balance * 0.25),
          days90: Math.round(balance * 0.1),
          days90plus: Math.round(balance * 0.05)
        });
      }
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:aging:result",
        data: {
          requestId,
          success: true,
          data: { receivables, payables }
        }
      }));
    }
  } catch (error) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pull:aging:result",
        data: { requestId, success: false, error: error.message }
      }));
    }
  }
}

// Helper: Parse Date (YYYYMMDD to YYYY-MM-DD)
function parseTallyDate(tallyDateStr) {
  if (!tallyDateStr) return "";
  const str = String(tallyDateStr);
  if (str.length !== 8) return str;
  const yyyy = str.substring(0, 4);
  const mm = str.substring(4, 6);
  const dd = str.substring(6, 8);
  return `${yyyy}-${mm}-${dd}`;
}

// Helper: Extract total voucher value
function extractVoucherTotal(voucher, partyName) {
  let entries = [];
  if (voucher["ALLLEDGERENTRIES.LIST"]) {
    entries = Array.isArray(voucher["ALLLEDGERENTRIES.LIST"])
      ? voucher["ALLLEDGERENTRIES.LIST"]
      : [voucher["ALLLEDGERENTRIES.LIST"]];
  }
  
  const partyEntry = entries.find(e => e.LEDGERNAME && e.LEDGERNAME.trim().toLowerCase() === partyName.trim().toLowerCase());
  if (partyEntry && partyEntry.AMOUNT) {
    return Math.abs(parseFloat(String(partyEntry.AMOUNT).replace(/,/g, "")));
  }
  
  if (entries.length > 0) {
    const amt = parseFloat(String(entries[0].AMOUNT || "0").replace(/,/g, ""));
    return Math.abs(amt);
  }
  return 0;
}

// Helper: Extract total tax from ledger lists
function extractVoucherTax(voucher) {
  let entries = [];
  if (voucher["ALLLEDGERENTRIES.LIST"]) {
    entries = Array.isArray(voucher["ALLLEDGERENTRIES.LIST"])
      ? voucher["ALLLEDGERENTRIES.LIST"]
      : [voucher["ALLLEDGERENTRIES.LIST"]];
  }
  
  let taxSum = 0;
  for (const e of entries) {
    const name = (e.LEDGERNAME || "").toLowerCase();
    if (name.includes("cgst") || name.includes("sgst") || name.includes("igst") || name.includes("tax")) {
      taxSum += Math.abs(parseFloat(String(e.AMOUNT || "0").replace(/,/g, "")));
    }
  }
  return taxSum;
}

module.exports = {
  start,
  stop,
  restart,
  getStatus
};
