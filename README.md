# GST Reconciliation Pro — AI-Assisted GST Reconciliation & Audit Platform

A web application designed for Indian Chartered Accountants, tax auditors, corporate finance departments, and tax practitioners.

GST Reconciliation Pro reconciles internal accounting records (Purchase Registers, Sales Registers) against statutory GSTN portal returns (**GSTR-2B, GSTR-2A, GSTR-3B, GSTR-1**) using a **5-stage deterministic matching engine**, performs **Section 16(2)(aa) & Rule 36(4)** statutory admissibility audits, generates **10-sheet downloadable Excel workpapers**, and leverages **server-side Gemini AI** for root cause investigation, client query memorandum drafting, and GST notice reply preparation (Form GST ASMT-10 / DRC-01).

---

## 1. Key Capabilities & Statutory Compliance

### A. 5-Stage Deterministic Reconciliation Engine
1. **Stage 1 (Exact Match):** Exact Supplier GSTIN, normalized invoice number, document type (INV/CRN/DBN), and taxable & tax values within ₹0.10.
2. **Stage 2 (Controlled Near Match):** Strips punctuation (`/`, `-`, spaces) in invoice numbers, applies configurable date tolerance (default: ±30 days), and rounding tolerance (default: ±₹2.00).
3. **Stage 3 (Identity Established, Tax Head Shift):** Identifies intra-state vs inter-state tax distribution mismatches (e.g., Books booked IGST, but Vendor filed CGST+SGST due to Place of Supply disputes).
4. **Stage 4 (Potential Match - Manual Review Required):** Levenshtein string similarity and amount heuristic matching with explicit CA sign-off requirement.
5. **Stage 5 (Manual Matching & Unmatching):** Full audit trail recording auditor name, timestamp, and justification.

### B. Section 16(2)(aa) & Rule 36(4) Statutory ITC Audit
- Categorizes all invoices claimed in Books but missing from GSTR-2B as **High-Risk Disallowed ITC** under Section 16(2)(aa).
- Assesses exposure to automated scrutiny notices under **Form GST DRC-01B** (Rule 88D).
- 4-Pillar verification checklist: Tax invoice in possession (Sec 16(2)(a)), Communicated in GSTR-2B (Sec 16(2)(aa)), Receipt of goods/services (Sec 16(2)(b)), and 180-day vendor payment rule (2nd Proviso to Sec 16(2)).

### C. Multi-Format Spreadsheet Ingestion & 50-Row Preview
- Supports **XLSX, XLS, CSV, and JSON** files.
- Worksheet inspector with sheet switching.
- Automatic header row detector (skips decorative company banners/top title lines).
- 50-row preview grid before records enter the reconciliation dataset.
- Smart auto-detection and customizable column mapping with presets for **Official GST Portal GSTR-2B**, **Tally Prime / ERP 9**, and **Zoho Books / ClearTax**.
- Rejects corrupt rows with explicit error messages and logs duplicate keys.

### D. Server-Side Gemini AI Intelligence Engine
- **Exception Root-Cause Investigator:** Analyzes exact numerical variances, date offsets, and Place of Supply classifications without altering numbers.
- **Client AP Query Memorandum Draftsman:** Generates official query letters to client management requesting documentation for unresolved exceptions.
- **GST Officer Notice Defense Draftsman:** Formats legally grounded written submissions in response to Form GST ASMT-10 or DRC-01 notices citing CBIC Circulars 183/15/2022-GST & 193/05/2023-GST.

### E. 10-Sheet Downloadable Excel Reports (.xlsx)
Generates audit files with formatted headers, auto-calculated column widths, and verified control totals:
1. `Audit_Summary`: Reconciled dashboard metrics, formula definitions, and balance status.
2. `Matched_Invoices`: All exact and near-matched invoices with dates, amounts, and match rules.
3. `Unmatched_In_Books`: High-risk invoices in Books missing from GSTR-2B.
4. `Missing_In_Books`: Inward supplies reflected in GSTR-2B but missing from accounting records.
5. `Tax_Mismatches`: Taxable and tax-component discrepancy registers.
6. `Duplicate_Invoices`: Duplicate bill keys punched multiple times in accounting.
7. `GSTIN_Summary`: Counterparty-wise summary with net tax differences.
8. `Period_Summary`: Return filing period-wise breakdown.
9. `Audit_Trail`: Immutable action ledger with timestamps and user names.
10. `Methodology_&_Notes`: Statutory citations and banker-grade decimal math rules.

### F. Maker-Checker Four-Eyes Governance
- **Prepared By:** Articled Assistant / Junior Accountant.
- **Reviewed By:** CA Audit Manager with timestamp and remarks.
- **Approved By:** Chartered Accountant Partner with final lock.
- Supports re-opening completed projects with mandatory documented reasons.

---

## 2. Design System

Designed specifically for Indian CA firms and tax practitioners:
- **Primary Background:** Near-black `#111111`
- **Secondary Background:** Charcoal `#181818` / `#1C1C1C`
- **Main Text:** Warm Ivory `#F5F0E6`
- **Accent:** Muted Gold `#B69A61`
- **Supporting Text:** Neutral Grey `#8E877C` / `#C5BDB0`
- High-density spreadsheet grids with sticky headers, subtle scrollbars, and clear status indicators.

---

## 3. Getting Started & Development

### Prerequisites
- Node.js v20+ or v22+
- npm v10+

### Installation
```bash
npm install
```

### Running Locally
To run the full-stack server (Express backend + Vite client):
```bash
npm run dev
```
The application will be live at `http://localhost:3000`.

### Production Build
```bash
npm run build
npm start
```

---

## 4. Verification & Testing

The application includes an instant **"Load Sample CA Dataset"** feature containing a realistic test scenario for **M/s Zenith Infotech Solutions Pvt Ltd (GSTIN: 27AABCZ1234D1ZP, Maharashtra)**:
- 8 Exact Matches (TCS, Infosys, Dell India, Airtel, etc.)
- 3 Near Matches (Normalised punctuation differences, date offsets, and rounding differences)
- 1 Tax Component Mismatch (IGST vs CGST+SGST Place of Supply shift)
- 2 Missing in GSTR-2B (Vendor failed to file GSTR-1, Section 16(2)(aa) non-compliant)
- 1 Missing in Purchase Register (Microsoft Azure subscription in 2B only)
- 1 Duplicate Bill punched twice in Tally by junior clerk
- 1 Credit Note linked to prior invoice

Every single metric, control total, difference formula, and Excel export reconciles across all views.
