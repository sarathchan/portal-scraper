import puppeteer from "puppeteer";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const { PORTAL_USER, PORTAL_PASS, PORTAL_URL, INSURANCE_NUMBER } = process.env;

async function loginAndScrape() {
  console.log(`[${new Date().toISOString()}] ➡️ Launching browser...`);
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();

  console.log(`[${new Date().toISOString()}] ➡️ Navigating to login page...`);
  await page.goto(PORTAL_URL, { waitUntil: "networkidle2" });

  console.log(`[${new Date().toISOString()}] ➡️ Entering credentials...`);
  await page.type("#txtUserName", PORTAL_USER, { delay: 50 });
  await page.type("#txtPassword", PORTAL_PASS, { delay: 50 });

  console.log(`[${new Date().toISOString()}] ➡️ Clicking login...`);
  await Promise.all([
    page.click("#btnLogin"),
    await new Promise((r) => setTimeout(r, 4000))
  ]);

  console.log(`[${new Date().toISOString()}] ➡️ Waiting for dashboard/menu...`);
  await page.waitForSelector("#side-menu", { timeout: 15000 });
  console.log(`[${new Date().toISOString()}] ✅ Logged in successfully!`);

  // Navigate to Eligibility Checking tab
  console.log(`[${new Date().toISOString()}] 🔍 Searching for "Eligibility Checking" tab...`);
  const clicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("#side-menu a"));
    const target = links.find(a =>
      a.innerText.toLowerCase().includes("eligibility")
    );
    if (target) {
      target.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    console.warn("⚠️ Could not find 'Eligibility Checking' tab");
    await browser.close();
    return;
  }

  console.log(`[${new Date().toISOString()}] ✅ Clicked on Eligibility Checking tab`);
  await new Promise((r) => setTimeout(r, 4000));

  // Fill the Eligibility Verification form
  console.log(`[${new Date().toISOString()}] 🧾 Filling Eligibility Verification form...`);

  await page.evaluate((insuranceNo) => {
    const cardInput =
      document.querySelector("#ctl00_ContentPlaceHolderBody_txtCardNumber") ||
      document.querySelector("input[name='CardNumber']") ||
      document.querySelector("#CardNumber") ||
      document.querySelector("#txtCardNo");

    if (cardInput) {
      cardInput.value = insuranceNo;
      cardInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const typeSelect =
      document.querySelector("#ctl00_ContentPlaceHolderBody_cmbType") ||
      document.querySelector("select[name='ctl00$ContentPlaceHolderBody$cmbType']");

    if (typeSelect) {
      const options = Array.from(typeSelect.options);
      const inpatient = options.find(opt =>
        opt.text.toLowerCase().includes("in-patient")
      );
      if (inpatient) {
        typeSelect.value = inpatient.value;
        typeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    const chosenType = document.querySelector("#ctl00_ContentPlaceHolderBody_cmbType_chosen");
    if (chosenType) {
      const span = chosenType.querySelector(".chosen-single");
      if (span) span.click();
      const input = document.querySelector(".chosen-search input");
      if (input) {
        input.value = "In-Patient";
        input.dispatchEvent(new Event("keyup", { bubbles: true }));
        const results = Array.from(document.querySelectorAll(".chosen-results li"));
        const target = results.find(li => li.innerText.toLowerCase().includes("in-patient"));
        if (target) target.click();
      }
    }
  }, INSURANCE_NUMBER || "123456789");

  await new Promise((r) => setTimeout(r, 1500));
  console.log(`[${new Date().toISOString()}] ✅ Card number and Type (In-Patient) filled`);

  console.log(`[${new Date().toISOString()}] 🖱️ Clicking on 'Check Eligibility' button...`);
  const clickedCheck = await page.evaluate(() => {
    const btn =
      document.querySelector("#ctl00_ContentPlaceHolderBody_btnCheckEligibility") ||
      Array.from(document.querySelectorAll("button, input[type='button'], input[type='submit']"))
        .find(b => b.innerText?.toLowerCase().includes("check") || b.value?.toLowerCase().includes("check"));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (clickedCheck) console.log(`[${new Date().toISOString()}] ✅ Clicked 'Check Eligibility'`);
  else console.warn("⚠️ Could not find 'Check Eligibility' button");

  await new Promise((r) => setTimeout(r, 5000));

  console.log(`[${new Date().toISOString()}] 🧩 Scraping eligibility result...`);

  // ✅ SCRAPE DATA HERE
  const data = await page.evaluate(() => {
    const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || "";

    return {
      patientName: getText("#lblPatientName"),
      payer: getText("#lblPayer"),
      cardNumber: getText("#lblCardNumber"),
      gender: getText("#lblGender"),
      dob: getText("#lblDOB"),
      nationalId: getText("#lblNationalId"),
      idType: getText("#lblIDType"),
      idNumber: getText("#lblIDNumber"),
      regulatorId: getText("#lblRegulatorID"),
      phoneNumber: getText("#lblPhoneNumber"),
      serviceDate: getText("#lblDate"),
      class: getText("#lblClass"),
      category: getText("#lblCategroy"),
      policyHolder: getText("#lblPolicyHolder"),
      licensingAuthority: getText("#lblLicensingAuthority"),
      validityBetween: getText("#lblValidityBetween"),
      beneficiaryStartDate: getText("#lblBeneficiaryStartDate"),
      coverageInformation: getText("#lbCoverageInformation"),
      networkName: getText("#lbNetworkName"),
      billing: getText("#lblBilling"),
      gatekeeper: getText("#lblGateKeeper"),
      referralDetails: getText("#referralDescription"),
    };
  });

  fs.writeFileSync("eligibility_data.json", JSON.stringify(data, null, 2));
  console.log(`✅ Scraped data saved to eligibility_data.json`);

  await page.screenshot({ path: "eligibility_result.png", fullPage: true });
  console.log("📸 Screenshot saved as eligibility_result.png");

  await browser.close();
}

loginAndScrape().catch(err => console.error("❌ Script error:", err));
