# Automated Certificate Generation & Grouped Google Apps Script Email System

Production-ready certificate system that reads participant attendance data (`all_events_attended_participants.csv`), generates high-resolution PDF certificates locally, groups certificates by participant email, and dispatches **a single email per participant with all their certificates attached** via Google Apps Script.

---

## 📁 Required Directory & File Structure

Ensure your project contains the following directory layout:

```text
Jitsi-Meet/
├── all_events_attended_participants.csv   # Target participant CSV dataset
├── public/
│   ├── templates/
│   │   └── Google.jpg                     # Canva certificate template (exported as JPG/PNG)
│   └── fonts/
│       ├── NotoSans-Regular.ttf           # Primary font
│       └── NotoSansTamil-Regular.ttf      # Tamil script support font (optional)
├── scripts/
│   └── certificate-system/
│       ├── 1-generate-certificates.mjs    # Script 1: Node.js PDF Certificate Generator
│       ├── 2-send-grouped-certificates.mjs# Script 2 (Runner): Local dispatch runner
│       └── gas-email-sender.js            # Script 2 (GAS): Google Apps Script backend code
└── output/                                # Created automatically
    └── generated_certificates/
        ├── <Event Title 1>/
        │   └── participant@email.com_Name.pdf
        ├── <Event Title 2>/
        │   └── participant@email.com_Name.pdf
        ├── certificates_index.json        # Index mapping recipient emails to their PDF files
        └── dispatch_summary.json          # Detailed delivery report
```

---

## 🛠️ Prerequisites & Dependencies

### Node.js Dependencies
Installed via `npm`:
```bash
npm install pdf-lib @pdf-lib/fontkit
```

### Background Template (Canva)
1. Open your Canva design: `https://www.canva.com/design/DAHMpYuuKiM/ywpoTep9hmyokHioR-IyPw/edit`
2. Click **Share** -> **Download**.
3. Choose File Type: **PNG** or **JPG** (High Quality).
4. Save the downloaded image as `public/templates/Google.jpg`.

---

## 🚀 Setup Steps & Execution Guide

### Step 1: Generate PDF Certificates Locally (Script 1)

Reads `all_events_attended_participants.csv`, overlays participant names and event titles onto the Canva certificate template using `pdf-lib`, and organizes generated PDFs into folders by **Event Title**.

Run command:
```bash
node scripts/certificate-system/1-generate-certificates.mjs
```

**Output**:
- PDFs saved under `./output/generated_certificates/<Event_Title>/`.
- JSON index generated at `./output/generated_certificates/certificates_index.json`.

---

### Step 2: Set Up Google Apps Script Web App (Script 2 Backend)

1. Open [script.google.com](https://script.google.com) and click **New Project**.
2. Replace all existing code in `Code.gs` with the contents of [scripts/certificate-system/gas-email-sender.js](file:///c:/Users/sunda/Jitsi-Meet/scripts/certificate-system/gas-email-sender.js).
3. Click **Deploy** -> **New Deployment**.
4. Click the gear icon next to "Select type" and choose **Web app**.
5. Configure deployment settings:
   - **Description**: Certificate Dispatcher API
   - **Execute as**: `Me (your email address)`
   - **Who has access**: `Anyone`
6. Click **Deploy** and authorize Gmail permissions when prompted.
7. Copy the generated **Web App URL** (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Step 3: Send Grouped Emails (Script 2 Runner)

Reads `certificates_index.json`, groups all certificates belonging to each email address, and sends **only one email per participant** with all relevant certificates attached.

Add your Web App URL to `.env.local`:
```env
GAS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec
```

Run command:
```bash
node scripts/certificate-system/2-send-grouped-certificates.mjs
```

Or pass the URL directly via CLI argument:
```bash
node scripts/certificate-system/2-send-grouped-certificates.mjs --gas-url https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec
```

---

## 📌 Verification & Features

- **Single Email Guarantee**: Grouping logic ensures recipients who attended 1, 2, or more events receive **exactly 1 email** containing all their earned certificates.
- **Dynamic Subject & Body**: Customized email content depending on whether 1 or multiple events were attended.
- **Delivery Log**: Detailed results (success/failure per recipient) are saved to `./output/dispatch_summary.json`.
