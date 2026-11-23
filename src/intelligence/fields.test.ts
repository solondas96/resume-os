// @vitest-environment node
/**
 * Matching test per non-tech field. Each field has a realistic resume passage written in common
 * phrasings, and the skills a reader would expect it to show. The generated dataset must recognise
 * at least 70% of them. The passages are fixed in advance and not tuned to the dictionary.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { installSkillsDataset, resetSkillsDataset, extractSkills, canonicalSkill } from './skills';

const dataset = JSON.parse(readFileSync(join(process.cwd(), 'public', 'data', 'skills.json'), 'utf8'));

const CASES: { field: string; expected: string[]; passage: string }[] = [
  {
    field: 'Healthcare',
    expected: ['Patient Care', 'Medication Administration', 'Electronic Health Records', 'Triage', 'Infection Control', 'Vital Signs Monitoring', 'Care Planning', 'Wound Care', 'Clinical Documentation', 'Patient Education'],
    passage: 'Provided patient care on a 30-bed medical ward. Medication administration and charting in electronic health records (EHR). Performed triage in the emergency bay and enforced infection control. Recorded vital signs, wound dressing and care plans. Gave patient teaching on diabetes self-care.',
  },
  {
    field: 'Education',
    expected: ['Lesson Planning', 'Classroom Management', 'Differentiated Instruction', 'Student Assessment', 'Parent Communication', 'Special Educational Needs', 'Individual Education Plans', 'Learning Management Systems', 'Safeguarding', 'Literacy Instruction'],
    passage: 'Wrote lesson plans for Years 3 to 6. Classroom management using positive reinforcement. Differentiated teaching for mixed-ability groups. Student assessment and progress monitoring. Led parent-teacher conferences. Supported special needs support pupils and wrote IEPs. Ran the lms for homework. Child protection lead and safeguarding training. Phonics and reading instruction.',
  },
  {
    field: 'Sales',
    expected: ['Prospecting', 'Lead Generation', 'Account Management', 'Pipeline Management', 'Cold Calling', 'Quota Attainment', 'Negotiation', 'Closing Deals', 'CRM Software', 'Upselling'],
    passage: 'Prospecting and lead generation for enterprise accounts. Managed key account management for 40 clients. Owned the sales pipeline end to end. Cold calling and cold outreach. Hitting quota for four quarters. Contract negotiation with procurement teams. Closing sales over one million pounds. Logged activity in salesforce. Cross-selling to existing customers.',
  },
  {
    field: 'Marketing',
    expected: ['Content Marketing', 'Social Media Marketing', 'Email Marketing', 'Search Engine Optimisation', 'Paid Search', 'Marketing Analytics', 'Brand Management', 'Campaign Management', 'Market Research', 'Copywriting'],
    passage: 'Content strategy and content creation for the company blog. Social media management across four channels. Email campaigns with a 35% open rate. SEO and ppc campaigns. Web analytics reporting each month. Brand strategy refresh for the launch. Campaign planning for seasonal promotions. Market analysis of competitors. Ad copy and copywriting for landing pages.',
  },
  {
    field: 'Customer Service',
    expected: ['Customer Support', 'Ticket Management', 'Complaint Resolution', 'De-escalation', 'Active Listening', 'Help Desk Support', 'Customer Satisfaction', 'Call Handling', 'First Contact Resolution', 'Escalation Management'],
    passage: 'Customer care for 60 calls a day. Ticket management in Zendesk. Complaint resolution and handling complaints with empathy. Defusing conflict with upset customers. Active listening on every call. Helpdesk tickets for the wider team. Improved CSAT scores by 12 points. Inbound calls and telephone support. Resolving on first contact in most cases. Escalations to team leads.',
  },
  {
    field: 'Administration',
    expected: ['Office Administration', 'Calendar Management', 'Record Keeping', 'Data Entry', 'Minute Taking', 'Travel Arrangements', 'Invoice Processing', 'Document Management', 'Microsoft Office', 'Spreadsheet Management'],
    passage: 'Office administration for a 12-person team. Calendar management and diary management for two directors. Record keeping in the shared drive. Data entry of supplier orders. Minute taking for board meetings. Travel arrangements and booking travel. Processing invoices every week. Document control for contracts. Microsoft Excel and ms office. Maintained spreadsheets for budgets.',
  },
  {
    field: 'Finance and Accounting',
    expected: ['Financial Reporting', 'Month-end Close', 'Accounts Payable', 'Reconciliation', 'Budgeting', 'Variance Analysis', 'General Ledger', 'Tax Compliance', 'Payroll Processing', 'Xero'],
    passage: 'Financial reporting to the board each month. Month-end close within five working days. Accounts payable and supplier payments. Bank reconciliation every week. Budget preparation for three cost centres. Variance analysis on actuals. General ledger maintenance. Tax returns and taxation filings. Payroll administration for 200 staff. Used Xero for bookkeeping.',
  },
  {
    field: 'Human Resources',
    expected: ['Recruitment', 'Interviewing', 'Employee Onboarding', 'Employee Relations', 'Performance Management', 'Employment Law', 'Benefits Administration', 'Learning and Development', 'Workforce Planning', 'HRIS'],
    passage: 'Recruiting for engineering and sales roles. Conducting interviews with hiring managers. Employee onboarding for 80 hires a year. Staff relations and employee engagement. Performance reviews twice a year. Labour law compliance. Employee benefits administration. Learning and development calendar for managers. Succession planning for leadership roles. Workday administration.',
  },
  {
    field: 'Operations and Logistics',
    expected: ['Inventory Management', 'Supply Chain Management', 'Warehouse Operations', 'Logistics Coordination', 'Process Improvement', 'Demand Planning', 'Vendor Management', 'Procurement', 'Order Fulfilment', 'Quality Control'],
    passage: 'Inventory management for 4,000 product lines. Supply chain operations with 30 suppliers. Warehousing across two sites. Shipping coordination with carriers. Continuous improvement projects on the packing line. Demand forecasting for peak season. Supplier relations and supplier management. Procurement of raw materials. Order fulfillment within 24 hours. Quality inspection before dispatch.',
  },
  {
    field: 'Hospitality and Food Service',
    expected: ['Food Safety', 'Menu Planning', 'Table Service', 'Cash Handling', 'Point of Sale', 'Guest Relations', 'Housekeeping', 'Reservations Management', 'Event Catering', 'Bar Service'],
    passage: 'Food hygiene and HACCP compliance. Menu development each season. Waiting tables in a 90-cover restaurant. Till operation and cash reconciliation. POS systems for orders. Guest services and hospitality service. Room cleaning and housekeeping standards. Reservation systems and bookings. Catering for weddings. Bartending on weekends.',
  },
  {
    field: 'Construction and Trades',
    expected: ['Site Supervision', 'Health and Safety Inspections', 'Blueprint Reading', 'Carpentry', 'Electrical Installation', 'Plumbing', 'Power Tools', 'Plastering', 'Bricklaying', 'Cost Estimating'],
    passage: 'Site supervision of a 20-person crew. Health and safety inspections every week. Blueprint reading and technical drawings. Carpentry and joinery for fit-outs. Electrical wiring to code. Plumbing installation in new builds. Power tool operation on site. Plasterwork on new builds. Brickwork and masonry. Estimating and quoting jobs.',
  },
  {
    field: 'Legal',
    expected: ['Legal Research', 'Contract Drafting', 'Contract Review', 'Due Diligence', 'Litigation Support', 'Regulatory Compliance', 'Case Management', 'Intellectual Property', 'Data Protection Law', 'Mediation'],
    passage: 'Legal research on case law for the corporate team. Contract drafting for SaaS vendors. Contract review of NDAs. Legal due diligence for acquisitions. Litigation support and trial preparation. Regulatory compliance programme for the bank. Case management for 40 matters. IP and trademarks filings. GDPR compliance reviews. Alternative dispute resolution and mediation.',
  },
];

describe('non-tech fields: the dataset recognises at least 70% of each field\'s skills', () => {
  beforeAll(() => installSkillsDataset(dataset));
  afterAll(() => resetSkillsDataset());

  for (const c of CASES) {
    it(`${c.field}: at least 70% of the expected skills are recognised`, () => {
      const found = new Set(extractSkills(c.passage));
      const hits = c.expected.filter((e) => found.has(e));
      const rate = hits.length / c.expected.length;
      const missed = c.expected.filter((e) => !found.has(e));
      expect(rate, `${c.field}: ${Math.round(rate * 100)}% recognised; missed: ${missed.join(', ')}`).toBeGreaterThanOrEqual(0.7);
    });
  }

  it('a sentence with no professional skills yields none of the expected names (negative)', () => {
    const found = extractSkills('Enjoys hiking, cooking for friends and reading novels on the weekend.');
    expect(found.some((x) => CASES.some((c) => c.expected.includes(x)))).toBe(false);
  });

  it('a work activity from O*NET is recognised by its name', () => {
    expect(canonicalSkill('Review art or design materials')).toBe('Review art or design materials');
  });

  it('a field supplement alias resolves to its canonical name', () => {
    expect(canonicalSkill('EHR')).toBe('Electronic Health Records');
    expect(canonicalSkill('csat')).toBe('Customer Satisfaction');
  });
});
