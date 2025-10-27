# 🕵️‍♂️ Eligibility Verification Automation

A smart Puppeteer-based automation script that logs into a secure insurance portal, navigates to the **Eligibility Verification** section, enters card details, selects the verification type (In-Patient), and captures a detailed screenshot of the results.

---

## 🚀 Features

✅ **Automated Login** — securely logs in using environment variables.  
✅ **Form Autofill** — fills in card number and selects “In-Patient” automatically.  
✅ **Smart Navigation** — detects and clicks the correct sidebar tab dynamically.  
✅ **Result Capture** — takes a full-page screenshot of the eligibility result.  
✅ **Sidebar Extraction** — saves available sidebar menu items to `sidebar.json`.  
✅ **Customizable** — easily configurable via `.env` file.  

---

## ⚙️ Setup Instructions

### 1️⃣ Clone this repository
```bash
git clone https://github.com/your-username/eligibility-automation.git
cd eligibility-automation
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Configure environment variables
Create a `.env` file in the project root:

```bash
PORTAL_USER=your_username
PORTAL_PASS=your_password
PORTAL_URL="https://example.com/Login.aspx"
INSURANCE_NUMBER=123456789
```

> ⚠️ Keep this file private!  
> Add `.env` to `.gitignore` to protect your credentials.

---

## 🧠 How It Works

1. Launches a Chromium browser (headless or visible mode).  
2. Logs into the insurance portal using your credentials.  
3. Navigates to the **Eligibility Verification** section.  
4. Enters the insurance card number and selects **In-Patient** from the dropdown.  
5. Clicks the **Check Eligibility** button.  
6. Waits for the response to load and takes a full-page screenshot.  
7. Saves navigation sidebar items to `sidebar.json` for analysis.

---

## 🪄 Scripts

### Run the automation
```bash
npm start
```

### Run with debug logs
```bash
node index.js
```

> The script automatically saves:
> - 🖼️ `eligibility_result.png` → Screenshot of the result page  
> - 📂 `sidebar.json` → Extracted menu items

---

## 🧰 Tech Stack

- **[Node.js](https://nodejs.org/)**
- **[Puppeteer](https://pptr.dev/)**
- **[dotenv](https://github.com/motdotla/dotenv)**
- **JavaScript (ESM)**

---

## 🧑‍💻 Developer Notes

- You can modify selectors or actions inside `loginAndScrape()` to support additional verification types or form fields.
- To run the browser in headless mode, change:
  ```js
  headless: false
  ```
  to
  ```js
  headless: true
  ```

---

## 🔒 Security Tip

Never commit `.env` or screenshots containing private data.  
Use environment variables for sensitive credentials at all times.

---

## 🖼️ Output Example

```
📸 Screenshot saved as eligibility_result.png
✅ Sidebar saved to sidebar.json
```

---

## ❤️ Author

**Developed with precision and automation in mind by sarath chandran **  
> Making manual insurance checks a thing of the past 🚀
