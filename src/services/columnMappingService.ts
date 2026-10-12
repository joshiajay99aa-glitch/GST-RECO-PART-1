import { ColumnMappingDefinition } from '../types/gst';

export interface MappingFieldRule {
  key: keyof ColumnMappingDefinition;
  label: string;
  required: boolean;
  patterns: RegExp[];
  description: string;
}

export const MAPPING_FIELDS: MappingFieldRule[] = [
  {
    key: 'supplierGstinCol',
    label: 'Supplier / Counterparty GSTIN',
    required: true,
    description: '15-digit GSTIN of supplier or counterparty',
    patterns: [
      /^(supplier\s*)?gstin(\s*of\s*supplier)?$/i,
      /^ctin$/i,
      /^gstin_supplier$/i,
      /^gst\s*number$/i,
      /^gst\s*no\.?$/i,
      /^party\s*gstin$/i,
      /^vendor\s*gstin$/i,
    ],
  },
  {
    key: 'supplierNameCol',
    label: 'Supplier / Trade Name',
    required: false,
    description: 'Legal or trade name of vendor/supplier',
    patterns: [
      /^(supplier|vendor|party|legal|trade)\s*(name)?$/i,
      /^party$/i,
      /^cname$/i,
      /^name\s*of\s*supplier$/i,
    ],
  },
  {
    key: 'invoiceNumberCol',
    label: 'Invoice / Document Number',
    required: true,
    description: 'Invoice, Bill, Credit/Debit Note number',
    patterns: [
      /^(invoice|inv|doc|document|bill)\s*(no|number|num|\#)?\.?$/i,
      /^inum$/i,
      /^voucher\s*no\.?$/i,
      /^ref\s*no\.?$/i,
    ],
  },
  {
    key: 'invoiceDateCol',
    label: 'Invoice / Document Date',
    required: true,
    description: 'Date of invoice or voucher',
    patterns: [
      /^(invoice|inv|doc|document|bill|voucher)\s*date$/i,
      /^idate$/i,
      /^date$/i,
      /^dt$/i,
    ],
  },
  {
    key: 'docTypeCol',
    label: 'Document Type (INV / CRN / DBN)',
    required: false,
    description: 'Invoice, Credit Note, or Debit Note',
    patterns: [
      /^(doc|document|inv|invoice)\s*type$/i,
      /^type$/i,
      /^typ$/i,
      /^voucher\s*type$/i,
    ],
  },
  {
    key: 'taxableValueCol',
    label: 'Taxable Value / Amount',
    required: true,
    description: 'Assessable value on which GST is levied',
    patterns: [
      /^taxable\s*(value|amt|amount)?$/i,
      /^assessable\s*value$/i,
      /^taxable$/i,
      /^txval$/i,
      /^basic\s*(amount|value)$/i,
    ],
  },
  {
    key: 'igstCol',
    label: 'IGST (Integrated Tax)',
    required: false,
    description: 'Integrated Goods and Services Tax',
    patterns: [
      /^igst(\s*amt|\s*amount)?$/i,
      /^integrated\s*tax(\s*amount)?$/i,
      /^iamt$/i,
      /^igst_amount$/i,
    ],
  },
  {
    key: 'cgstCol',
    label: 'CGST (Central Tax)',
    required: false,
    description: 'Central Goods and Services Tax',
    patterns: [
      /^cgst(\s*amt|\s*amount)?$/i,
      /^central\s*tax(\s*amount)?$/i,
      /^camt$/i,
      /^cgst_amount$/i,
    ],
  },
  {
    key: 'sgstCol',
    label: 'SGST / UTGST (State Tax)',
    required: false,
    description: 'State / Union Territory Tax',
    patterns: [
      /^(sgst|utgst)(\s*\/\s*utgst)?(\s*amt|\s*amount)?$/i,
      /^state\s*tax(\s*amount)?$/i,
      /^samt$/i,
      /^sgst_amount$/i,
    ],
  },
  {
    key: 'cessCol',
    label: 'Cess (Compensation Cess)',
    required: false,
    description: 'Compensation Cess, if applicable',
    patterns: [
      /^cess(\s*amt|\s*amount)?$/i,
      /^compensation\s*cess$/i,
      /^csamt$/i,
    ],
  },
  {
    key: 'totalValueCol',
    label: 'Total Invoice Value',
    required: false,
    description: 'Gross invoice value including all taxes',
    patterns: [
      /^(total|gross|invoice|inv)\s*(value|amt|amount|val)$/i,
      /^val$/i,
      /^net\s*amount$/i,
      /^total$/i,
    ],
  },
  {
    key: 'placeOfSupplyCol',
    label: 'Place of Supply (POS)',
    required: false,
    description: 'State code or name where supply took place',
    patterns: [
      /^(place\s*of\s*supply|pos|state\s*code|supply\s*state)$/i,
    ],
  },
  {
    key: 'returnPeriodCol',
    label: 'Return Period / Filing Period',
    required: false,
    description: 'Filing period (e.g. 102024 or Oct-2024)',
    patterns: [
      /^(return\s*period|filing\s*period|period|fp|month)$/i,
    ],
  },
  {
    key: 'reverseChargeCol',
    label: 'Reverse Charge (RCM)',
    required: false,
    description: 'Yes/No indicator whether tax is payable under RCM',
    patterns: [
      /^(reverse\s*charge|rcm|sec\s*9\(3\))$/i,
      /^rev_chg$/i,
    ],
  },
  {
    key: 'itcEligibilityCol',
    label: 'ITC Eligibility / Status',
    required: false,
    description: 'ITC availability (Inputs, Capital Goods, Ineligible)',
    patterns: [
      /^(itc\s*eligibility|itc\s*available|eligibility|status)$/i,
      /^itc_elg$/i,
    ],
  },
];

/**
 * Automatically maps raw headers from uploaded file to standard GST column keys
 */
export const autoDetectColumnMapping = (headers: string[]): ColumnMappingDefinition => {
  const mapping: ColumnMappingDefinition = {};
  const cleanedHeaders = headers.map((h) => ({
    original: h,
    cleaned: String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ' '),
  }));

  for (const field of MAPPING_FIELDS) {
    // Exact or regex match
    for (const h of cleanedHeaders) {
      if (!h.original) continue;
      const matched = field.patterns.some((pattern) => pattern.test(h.original.trim()) || pattern.test(h.cleaned));
      if (matched && !(mapping as any)[field.key]) {
        (mapping as any)[field.key] = h.original;
        break;
      }
    }
  }

  return mapping;
};

export interface MappingTemplate {
  name: string;
  description: string;
  mapping: ColumnMappingDefinition;
}

export const PRESET_TEMPLATES: MappingTemplate[] = [
  {
    name: 'Official GST Portal GSTR-2B',
    description: 'Standard Excel download layout from GSTN portal B2B table',
    mapping: {
      supplierGstinCol: 'GSTIN of supplier',
      supplierNameCol: 'Trade/Legal name',
      invoiceNumberCol: 'Invoice number',
      docTypeCol: 'Invoice type',
      invoiceDateCol: 'Invoice date',
      totalValueCol: 'Invoice Value(₹)',
      placeOfSupplyCol: 'Place of supply',
      reverseChargeCol: 'Reverse Charge',
      taxableValueCol: 'Taxable Value (₹)',
      igstCol: 'Integrated Tax(₹)',
      cgstCol: 'Central Tax(₹)',
      sgstCol: 'State/UT Tax(₹)',
      cessCol: 'Cess(₹)',
      itcEligibilityCol: 'ITC Availability',
    },
  },
  {
    name: 'Tally Prime / ERP 9 Purchase Register',
    description: 'Standard columnar purchase register exported from Tally',
    mapping: {
      invoiceDateCol: 'Date',
      invoiceNumberCol: 'Voucher No.',
      supplierNameCol: 'Particulars',
      supplierGstinCol: 'GSTIN/UIN',
      docTypeCol: 'Voucher Type',
      taxableValueCol: 'Gross Total',
      igstCol: 'Input IGST',
      cgstCol: 'Input CGST',
      sgstCol: 'Input SGST',
      totalValueCol: 'Total',
    },
  },
  {
    name: 'Zoho Books / Cleartax',
    description: 'Columnar purchase bills export from Zoho Books or Cleartax',
    mapping: {
      supplierGstinCol: 'Vendor GSTIN',
      supplierNameCol: 'Vendor Name',
      invoiceNumberCol: 'Bill Number',
      invoiceDateCol: 'Bill Date',
      taxableValueCol: 'Taxable Amount',
      igstCol: 'IGST Amount',
      cgstCol: 'CGST Amount',
      sgstCol: 'SGST Amount',
      cessCol: 'Cess Amount',
      totalValueCol: 'Total Amount',
    },
  },
];
