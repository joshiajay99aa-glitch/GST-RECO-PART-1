import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // Initialize Gemini API
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // 1. Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
  });

  // 2. AI Exception Analysis Endpoint
  app.post('/api/ai/analyze-exception', async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured in server environment. Please configure GEMINI_API_KEY in the Secrets panel.',
        });
      }

      const { matchGroup, clientInfo } = req.body;
      if (!matchGroup) {
        return res.status(400).json({ error: 'matchGroup is required' });
      }

      const prompt = `You are a Senior Indian Chartered Accountant and Tax Audit Specialist on the GST Reconciliation Pro platform.
Analyze this specific GST reconciliation discrepancy strictly using the provided deterministic facts:

CLIENT DETAILS:
Legal Name: ${clientInfo?.legalName || 'Client'}
GSTIN: ${clientInfo?.gstin || 'N/A'}
State: ${clientInfo?.stateName || 'N/A'}

RECONCILIATION EXCEPTION DETAILS:
Match Group ID: ${matchGroup.id}
Classification Status: ${matchGroup.matchStatus}
Matching Rule Applied: ${matchGroup.matchingRuleApplied}
Date Difference: ${matchGroup.dateDiffDays ?? 'N/A'} days

BOOKS RECORD (Purchase Register):
${
  matchGroup.booksRecord
    ? JSON.stringify(
        {
          SupplierGSTIN: matchGroup.booksRecord.supplierGstin,
          SupplierName: matchGroup.booksRecord.supplierName,
          InvoiceNo: matchGroup.booksRecord.invoiceNumber,
          InvoiceDate: matchGroup.booksRecord.invoiceDate,
          TaxableValue: matchGroup.booksRecord.taxableValue,
          IGST: matchGroup.booksRecord.igst,
          CGST: matchGroup.booksRecord.cgst,
          SGST: matchGroup.booksRecord.sgst,
          SourceRef: `${matchGroup.booksRecord.sourceFileName} (Row ${matchGroup.booksRecord.sourceRowNumber})`,
        },
        null,
        2
      )
    : 'None (Record missing in Books)'
}

PORTAL RECORD (GSTR-2B / GSTR-2A):
${
  matchGroup.portalRecord
    ? JSON.stringify(
        {
          SupplierGSTIN: matchGroup.portalRecord.supplierGstin,
          SupplierName: matchGroup.portalRecord.supplierName,
          InvoiceNo: matchGroup.portalRecord.invoiceNumber,
          InvoiceDate: matchGroup.portalRecord.invoiceDate,
          TaxableValue: matchGroup.portalRecord.taxableValue,
          IGST: matchGroup.portalRecord.igst,
          CGST: matchGroup.portalRecord.cgst,
          SGST: matchGroup.portalRecord.sgst,
          SourceRef: `${matchGroup.portalRecord.sourceFileName} (Row ${matchGroup.portalRecord.sourceRowNumber})`,
        },
        null,
        2
      )
    : 'None (Record missing in Portal)'
}

DIFFERENCES (Books minus Portal):
Taxable Value Diff: ₹${matchGroup.diffTaxable}
IGST Diff: ₹${matchGroup.diffIgst}
CGST Diff: ₹${matchGroup.diffCgst}
SGST Diff: ₹${matchGroup.diffSgst}
Total Value Diff: ₹${matchGroup.diffTotal}

INSTRUCTIONS:
Provide a structured, executive CA Audit Memo with:
1. ### Verified Facts & Discrepancy Summary
   - State exact numbers and difference direction.
2. ### Probable Root Cause Analysis
   - Distinctly separate confirmed facts from plausible hypotheses (e.g., supplier late filing, Place of Supply classification mismatch between Sec 10 & 12 IGST Act, timing difference, duplicate punching in ERP).
3. ### Statutory ITC Implication
   - Discuss relevance of CGST Act Section 16(2)(aa), Rule 36(4), and potential risk of DRC-01B / ASMT-10 notice.
4. ### Actionable Audit Recommendation & Next Steps
   - Clear checklist for accounts payable team (e.g., follow up with vendor for GSTR-1 amendment in Table 9A, reverse ITC under Table 4(B)(2) until reflected, check payment within 180 days).

Keep tone professional, crisp, and authoritative. Do not alter any figures.`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.2,
          },
        });
      } catch (geminiErr: any) {
        console.warn('Gemini 3.8 Flash temporary spike, trying fallback model gemini-flash-latest...', geminiErr?.message);
        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            temperature: 0.2,
          },
        });
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Error in analyze-exception:', error);
      res.status(500).json({ error: error?.message || 'Failed to analyze exception' });
    }
  });

  // 3. AI Draft Communication Endpoint (Client Query Memo or GST Notice Reply)
  app.post('/api/ai/draft-communication', async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured in server environment.',
        });
      }

      const { type, records, clientInfo, additionalNotes } = req.body;
      let promptTitle = '';

      if (type === 'client_query') {
        promptTitle = `Draft a formal Audit Query Memorandum from Chartered Accountants to the client's Chief Financial Officer / Accounts Payable team regarding unresolved GST reconciliation exceptions.
Include an itemized table with Invoice Number, Supplier GSTIN, Tax Difference, and specific documentary clarification required (e.g. proof of payment, revised e-Invoice, GSTR-1 amendment confirmation).`;
      } else if (type === 'notice_reply') {
        promptTitle = `Draft an official, legally grounded written submission in response to a GST Department Notice (Form GST ASMT-10 / DRC-01) issued for variance between ITC availed in GSTR-3B and GSTR-2B.
Cite relevant provisions: Section 16(2), Section 38, Rule 36(4), and CBIC Circular No. 183/15/2022-GST & Circular No. 193/05/2023-GST. Provide detailed reconciliation schedules, bona fide compliance statements, and pray for dropping of proposed tax demand and interest.`;
      } else {
        promptTitle = `Draft an Executive CA Audit Note summarizing key findings and control deficiencies in the client's GST input tax credit management.`;
      }

      const prompt = `CLIENT INFORMATION:
Legal Name: ${clientInfo?.legalName || 'Client Name'}
GSTIN: ${clientInfo?.gstin || '27AABCU0000A1Z1'}
State: ${clientInfo?.stateName || 'Maharashtra'}

ADDITIONAL AUDITOR NOTES:
${additionalNotes || 'Standard statutory review for the quarter.'}

EXCEPTION RECORDS SUMMARY:
${JSON.stringify(records, null, 2)}

TASK:
${promptTitle}

FORMATTING REQUIREMENTS:
- Proper legal letterhead formatting
- Reference numbers and dates placeholder
- Precise tabular breakdown where appropriate
- Clear prayer / action requested at the end`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.25,
          },
        });
      } catch (geminiErr: any) {
        console.warn('Gemini 3.8 Flash temporary spike, trying fallback model gemini-flash-latest...', geminiErr?.message);
        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            temperature: 0.25,
          },
        });
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Error drafting communication:', error);
      res.status(500).json({ error: error?.message || 'Failed to draft communication' });
    }
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GST Reconciliation Pro full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start GST Reconciliation Pro server:', err);
  process.exit(1);
});
