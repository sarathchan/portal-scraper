import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
puppeteer.use(StealthPlugin());

// ⏱ Helper for timestamped logs
function timestamp() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

const log = (msg, type = "info") => {
  const icons = {
    info: "➡️",
    success: "✅",
    warn: "⚠️",
    error: "❌",
  };
  console.log(`[${timestamp()}] ${icons[type]} ${msg}`);
};

// 🧠 Login logic
async function login(page) {
  log("Navigating to login page...");
  await page.goto(process.env.PORTAL_URL, { waitUntil: "domcontentloaded" });

  log("Entering username & password...");
  await page.waitForSelector("#txtUserName", { timeout: 10000 });
  await page.type("#txtUserName", process.env.PORTAL_USER, { delay: 100 });

  await page.waitForSelector("#txtPassword");
  await page.type("#txtPassword", process.env.PORTAL_PASS, { delay: 100 });

  log("⏳ Waiting 2 seconds before clicking login...");
  await new Promise((r) => setTimeout(r, 2000));

  log("Clicking login...");
  await Promise.all([
    page.click("#btnLogin"),
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => null),
  ]);

  log("Waiting for dashboard to load...");
  await new Promise((r) => setTimeout(r, 2000));

  // 🧾 Updated login success detection (non-URL based)
  const html = await page.content();

  // Check for elements that appear only after login
  const dashboardSelectors = [
    "#welcomeText",
    "#MainContent_divDashboard",
    "a[href*='Logout']",
    "span#lblUserName",
  ];

  let loggedIn = false;
  for (const selector of dashboardSelectors) {
    const exists = await page.$(selector);
    if (exists) {
      loggedIn = true;
      break;
    }
  }

  // Fallback: if login fields disappear
  if (!loggedIn && !html.includes("txtUserName") && !html.includes("txtPassword")) {
    loggedIn = true;
  }

  if (!loggedIn) {
    const screenshotPath = `login_failed_${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath });
    throw new Error(`Login failed – could not detect dashboard. Screenshot: ${screenshotPath}`);
  }

  log("✅ Login successful!", "success");
}

// 📊 Extract any table from page
async function extractTable(page, tableId) {
  try {
    await page.waitForSelector(`#${tableId}`, { visible: true, timeout: 20000 });
    log(`Extracting table: ${tableId}...`);

    const tableData = await page.evaluate((tableId) => {
      const table = document.querySelector(`#${tableId}`);
      if (!table) return { headers: [], rows: [] };

      const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
        th.innerText.trim()
      );

      const rows = Array.from(table.querySelectorAll("tbody tr"))
        .filter((tr) => !tr.classList.contains("dataTables_empty"))
        .map((tr) => {
          const cells = Array.from(tr.querySelectorAll("td")).map((td) =>
            td.innerText.trim()
          );
          return Object.fromEntries(headers.map((h, i) => [h, cells[i] || ""]));
        });

      return { headers, rows };
    }, tableId);

    return tableData;
  } catch (err) {
    log(`⚠️ No data found for ${tableId}: ${err.message}`, "warn");
    return { headers: [], rows: [] };
  }
}

// 📦 Scrape multiple claim tabs
async function scrapeClaims(page) {
  const claimTabs = [
    { id: "Authorized", box: "#box_authorized" },
    { id: "Pending", box: "#box_pending" },
    { id: "Certified", box: "#box_certified" },
    { id: "Expiring", box: "#box_expiring" },
  ];

  const allData = {};

  for (const tab of claimTabs) {
    try {
      log(`➡️ Clicking tab: ${tab.id}`);
      await page.click(tab.box);
        await new Promise((r) => setTimeout(r, 2000));

      const tableId = `tbl_${tab.id}`;
      const data = await extractTable(page, tableId);
      allData[tab.id] = data;

      log(`✅ Extracted ${data.rows.length} rows from ${tab.id}`, "success");
    } catch (err) {
      log(`❌ Failed for ${tab.id}: ${err.message}`, "error");
      allData[tab.id] = { headers: [], rows: [], error: err.message };
    }
  }

  const outPath = `claims-data-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(outPath, JSON.stringify(allData, null, 2));
  log(`✅ Saved all claim data to ${outPath}`, "success");

  return allData;
}

// 🚀 Main runner
async function run() {
  const browser = await puppeteer.launch({
    headless: true, // set to false for debugging
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  try {
    await login(page);
      await new Promise((r) => setTimeout(r, 4000));
    await scrapeClaims(page);
  } catch (err) {
    log(`❌ Script failed: ${err.stack}`, "error");
  } finally {
    await browser.close();
  }
}

run();
