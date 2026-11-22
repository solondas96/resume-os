// The fixture corpus: 16 resumes in varied layouts and professions.
// Each entry is the ground truth. build-corpus.mjs renders the PDFs and writes expected JSON from these.

export const dateStyles = {
  monthYear: (s, e) => `${s} – ${e}`,
  dashes: (s, e) => `${s}–${e}`,
};

export const CORPUS = [
  {
    id: 'swe-single',
    layout: 'single', heading: 'title', bullet: '•', headerStyle: 'company-role',
    name: 'Maya Chen', headline: 'Software Engineer | Distributed Systems',
    email: 'maya.chen@example.com', phone: '+1 (415) 555-0134', location: 'Lisbon, Portugal',
    summary: 'Software engineer with 8 years building reliable backend platforms.',
    experience: [
      { company: 'Acme Corp', role: 'Senior Software Engineer', start: 'Jan 2019', end: 'Present', bullets: ['Led migration of 40 services to Kubernetes, cutting deploy time by 60%', 'Mentored 5 engineers across 3 teams'] },
      { company: 'Globex Systems', role: 'Software Engineer', start: 'Jun 2016', end: 'Dec 2018', bullets: ['Built a billing pipeline processing 2M events per day with exactly-once delivery guarantees across three regions'] },
    ],
    education: [{ school: 'State University', degree: 'BSc Computer Science', start: '2012', end: '2016' }],
    skills: { 'Languages': ['TypeScript', 'Go', 'SQL'], 'Cloud': ['Kubernetes', 'AWS', 'Terraform'] },
  },
  {
    id: 'nurse-single-caps', layout: 'single', heading: 'caps', bullet: '•', headerStyle: 'role-company',
    name: 'Priya Natarajan', headline: 'Registered Nurse | Critical Care', email: 'priya.n@example.com', phone: '+1 (312) 555-0199', location: 'Chicago, IL',
    summary: 'Registered nurse with 9 years in intensive care and emergency medicine.',
    experience: [
      { company: 'St. Mary Medical Center', role: 'Charge Nurse, ICU', start: 'Jan 2019', end: 'Present', bullets: ['Supervised a team of 12 nurses across two overnight shifts', 'Reduced medication error reports by 35% through a new double-check protocol'] },
      { company: 'Lakeside Hospital', role: 'Staff Nurse, Emergency', start: 'Mar 2015', end: 'Dec 2018', bullets: ['Triaged up to 40 patients per shift during peak periods'] },
    ],
    education: [{ school: 'Illinois State University', degree: 'BSN Nursing', start: '2011', end: '2015' }],
    skills: { 'Clinical': ['ACLS', 'PALS', 'Ventilator management'], 'Systems': ['Epic', 'Cerner'] },
  },
  {
    id: 'accountant-twocol', layout: 'twocol', heading: 'title', bullet: '–', headerStyle: 'company-role',
    name: 'Daniel Okafor', headline: 'Senior Accountant | Financial Reporting', email: 'daniel.okafor@example.com', phone: '+1 (206) 555-0177', location: 'Seattle, WA',
    summary: 'Certified accountant focused on month-end close and audit readiness.',
    experience: [
      { company: 'Northwind Partners', role: 'Senior Accountant', start: 'Feb 2018', end: 'Present', bullets: ['Closed monthly books for 6 entities in under 4 business days', 'Automated intercompany reconciliations, removing 20 hours of manual work per month'] },
      { company: 'Pacific Audit Group', role: 'Staff Accountant', start: 'Aug 2014', end: 'Jan 2018', bullets: ['Supported external audits for 14 clients with zero material findings'] },
    ],
    education: [{ school: 'University of Washington', degree: 'BA Accounting', start: '2010', end: '2014' }],
    skills: { 'Systems': ['NetSuite', 'Excel', 'Power BI'], 'Certifications': ['CPA'] },
  },
  {
    id: 'teacher-sidebar', layout: 'sidebar', heading: 'title', bullet: '•', headerStyle: 'role-company',
    name: 'Grace Whitfield', headline: 'Secondary Mathematics Teacher', email: 'grace.whitfield@example.com', phone: '+1 (503) 555-0122', location: 'Portland, OR',
    summary: 'Teacher who turns hard topics into clear steps, with a record of raising test scores.',
    experience: [
      { company: 'Ridgeview High School', role: 'Mathematics Teacher', start: '2016', end: 'Present', bullets: ['Raised average end-of-year scores from 62% to 81% over three years', 'Ran an after-school tutoring program serving 60 students each semester'] },
      { company: 'Oakdale Middle School', role: 'Teacher', start: '2012', end: '2016', bullets: ['Designed a unit-based curriculum adopted by the whole maths department'] },
    ],
    education: [{ school: 'Portland State University', degree: 'MEd Secondary Education', start: '2010', end: '2012' }],
    skills: { 'Teaching': ['Differentiated instruction', 'Assessment design'], 'Tools': ['Google Classroom', 'Desmos'] },
  },
  {
    id: 'sales-table', layout: 'table', heading: 'title', bullet: '•', headerStyle: 'company-role',
    name: 'Marcus Lindqvist', headline: 'Enterprise Sales Manager', email: 'marcus.l@example.com', phone: '+1 (647) 555-0166', location: 'Toronto, ON',
    summary: 'Sales leader closing multi-year enterprise contracts in SaaS.',
    experience: [
      { company: 'Summit Software', role: 'Sales Manager', start: 'Mar 2017', end: 'Present', bullets: ['Grew enterprise pipeline by 3x, closing $4.2M in new annual revenue', 'Built and coached a team of 7 account executives'] },
      { company: 'Brightline Cloud', role: 'Account Executive', start: 'Jun 2013', end: 'Feb 2017', bullets: ['Exceeded quota in 11 of 14 quarters'] },
    ],
    education: [{ school: 'McGill University', degree: 'BCom Marketing', start: '2009', end: '2013' }],
    skills: { 'Sales': ['Salesforce', 'Forecasting', 'Negotiation'] },
  },
  {
    id: 'ux-dashes', layout: 'single', heading: 'rule', bullet: '•', headerStyle: 'company-role',
    name: 'Lena Virtanen', headline: 'Product Designer | Design Systems', email: 'lena.v@example.com', phone: '+358 40 555 0188', location: 'Helsinki, Finland',
    summary: 'Designer building accessible design systems used across product teams.',
    experience: [
      { company: 'Kestrel Labs', role: 'Lead Product Designer', start: '03/2020', end: 'now', bullets: ['Built a token system adopted by 12 product teams', 'Ran 30+ usability sessions that shaped the onboarding redesign'] },
      { company: 'Nordic Commerce', role: 'Product Designer', start: '2017', end: '2020', bullets: ['Redesigned checkout, improving completion by 14%'] },
    ],
    education: [{ school: 'Aalto University', degree: 'MA Interaction Design', start: '2014', end: '2016' }],
    skills: { 'Design': ['Figma', 'Prototyping', 'WCAG 2.1'], 'Research': ['Interviews', 'Usability testing'] },
  },
  {
    id: 'analyst-numbered', layout: 'single', heading: 'title', bullet: 'numbered', headerStyle: 'company-role',
    name: 'Aiko Tanaka', headline: 'Data Analyst | Retail Analytics', email: 'aiko.tanaka@example.com', phone: '+81 90 5550 0144', location: 'Tokyo, Japan',
    summary: 'Analyst turning sales data into pricing and inventory decisions.',
    experience: [
      { company: 'Meridian Retail', role: 'Data Analyst', start: 'Apr 2019', end: 'Present', bullets: ['Built the weekly pricing dashboard used by 40 store managers', 'Cut stockouts by 18% with a demand forecast model in Python'] },
      { company: 'Harbor Logistics', role: 'Junior Analyst', start: '2017', end: '2019', bullets: ['Automated route reporting, saving 6 hours of manual work each week'] },
    ],
    education: [{ school: 'University of Tokyo', degree: 'BSc Statistics', start: '2013', end: '2017' }],
    skills: { 'Analysis': ['SQL', 'Python', 'Tableau'] },
  },
  {
    id: 'chef-caps-season', layout: 'single', heading: 'caps', bullet: '•', headerStyle: 'role-company',
    name: 'Antoine Moreau', headline: 'Executive Chef | Restaurant Operations', email: 'antoine.moreau@example.com', phone: '+33 6 55 50 12 34', location: 'Lyon, France',
    summary: 'Chef running kitchens from opening to full service, with a focus on cost control.',
    experience: [
      { company: 'Maison Verte', role: 'Executive Chef', start: 'Summer 2018', end: 'Present', bullets: ['Reduced food cost from 34% to 28% of revenue without changing the menu price', 'Trained and led a brigade of 18 cooks'] },
      { company: 'Le Pavillon', role: 'Sous Chef', start: '2014', end: '2018', bullets: ['Opened the second dining room, reaching full covers in six weeks'] },
    ],
    education: [{ school: 'Le Cordon Bleu', degree: 'Diploma in Culinary Arts', start: 'Fall 2010', end: 'Spring 2012' }],
    skills: { 'Kitchen': ['Menu engineering', 'Food safety', 'Inventory'] },
  },
  {
    id: 'electrician-dashes', layout: 'twocol', heading: 'rule', bullet: '–', headerStyle: 'company-role',
    name: 'Samuel Brooks', headline: 'Master Electrician | Commercial Projects', email: 'samuel.brooks@example.com', phone: '+1 (480) 555-0111', location: 'Phoenix, AZ',
    summary: 'Licensed electrician delivering commercial installs on schedule and to code.',
    experience: [
      { company: 'Desert Power Systems', role: 'Project Foreman', start: '2020', end: 'Present', bullets: ['Ran three concurrent commercial builds worth $6M in total', 'Passed every city inspection on the first attempt across 22 projects'] },
      { company: 'Ironwood Electric', role: 'Journeyman Electrician', start: '2014', end: '2020', bullets: ['Installed switchgear and lighting for a 300,000 sq ft warehouse'] },
    ],
    education: [{ school: 'Maricopa Community College', degree: 'AAS Electrical Technology', start: '2011', end: '2013' }],
    skills: { 'Trade': ['NEC code', 'PLC wiring', 'Blueprint reading'] },
  },
  {
    id: 'lawyer-sidebar', layout: 'sidebar', heading: 'title', bullet: '•', headerStyle: 'role-company',
    name: 'Eleanor Hartley', headline: 'Corporate Counsel | M&A', email: 'eleanor.hartley@example.com', phone: '+1 (212) 555-0188', location: 'New York, NY',
    summary: 'Corporate lawyer advising on acquisitions and commercial contracts.',
    experience: [
      { company: 'Whitmore & Dale LLP', role: 'Senior Associate', start: 'Jan 2015', end: 'Dec 2019', bullets: ['Led due diligence on 9 acquisitions totalling $1.1B in deal value'] },
      { company: 'Halvorsen Industries', role: 'Corporate Counsel', start: 'Jan 2020', end: 'Present', bullets: ['Negotiated 60+ vendor contracts, cutting legal review time by a third'] },
    ],
    education: [{ school: 'Columbia Law School', degree: 'JD', start: '2008', end: '2011' }],
    skills: { 'Practice': ['M&A', 'Contract negotiation'], 'Admissions': ['New York Bar'] },
  },
  {
    id: 'retail-table-numbered', layout: 'table', heading: 'caps', bullet: 'numbered', headerStyle: 'company-role',
    name: 'Jordan Ellis', headline: 'Store Operations Manager', email: 'jordan.ellis@example.com', phone: '+1 (404) 555-0155', location: 'Atlanta, GA',
    summary: 'Retail manager with a record of strong staff retention and shrink reduction.',
    experience: [
      { company: 'Peachtree Outfitters', role: 'Store Manager', start: 'Feb 2017', end: 'Present', bullets: ['Reduced shrink from 2.4% to 1.1% of sales in one year', 'Kept staff turnover under 12% across 4 years'] },
      { company: 'Southside Apparel', role: 'Assistant Manager', start: 'Jul 2013', end: 'Jan 2017', bullets: ['Opened two new locations on time and on budget'] },
    ],
    education: [{ school: 'Georgia State University', degree: 'BBA Management', start: '2009', end: '2013' }],
    skills: { 'Operations': ['Inventory control', 'Scheduling', 'Loss prevention'] },
  },
  {
    id: 'pharmacist-single', layout: 'single', heading: 'title', bullet: '•', headerStyle: 'company-role',
    name: 'Rahul Mehta', headline: 'Clinical Pharmacist | Oncology', email: 'rahul.mehta@example.com', phone: '+1 (617) 555-0133', location: 'Boston, MA',
    summary: 'Pharmacist focused on medication safety in oncology care.',
    education: [{ school: 'Northeastern University', degree: 'PharmD', start: '2010', end: '2014' }],
    experience: [
      { company: 'Charles River Cancer Center', role: 'Clinical Pharmacist', start: 'Sep 2016', end: 'Present', bullets: ['Built a chemotherapy dose-check protocol that caught 40+ errors in its first year'] },
      { company: 'Riverside Pharmacy', role: 'Staff Pharmacist', start: 'Jun 2014', end: 'Aug 2016', bullets: ['Counselled over 200 patients a month on new prescriptions'] },
    ],
    skills: { 'Clinical': ['Oncology dosing', 'Medication reconciliation'] },
  },
  {
    id: 'marketing-twocol-toDate', layout: 'twocol', heading: 'title', bullet: '•', headerStyle: 'company-role',
    name: 'Chloe Martin', headline: 'Marketing Manager | Growth', email: 'chloe.martin@example.com', phone: '+44 20 5550 1234', location: 'London, UK',
    summary: 'Marketing manager running lifecycle and paid acquisition programmes.',
    experience: [
      { company: 'Bramble Media', role: 'Marketing Manager', start: 'Mar 2017', end: 'to date', bullets: ['Grew email revenue by 45% through a new lifecycle programme', 'Owned a paid acquisition budget of £800K a year'] },
      { company: 'Quill Agency', role: 'Account Executive', start: 'Mar 2015', end: 'Feb 2017', bullets: ['Managed 8 client accounts across retail and travel'] },
    ],
    education: [{ school: 'University of Leeds', degree: 'BA Marketing', start: '2011', end: '2014' }],
    skills: { 'Marketing': ['HubSpot', 'Google Ads', 'SEO'] },
  },
  {
    id: 'teacher-education-first', layout: 'single', heading: 'rule', bullet: '•', headerStyle: 'role-company',
    name: 'Omar Haddad', headline: 'Primary School Teacher', email: 'omar.haddad@example.com', phone: '+1 (416) 555-0170', location: 'Toronto, ON',
    summary: 'Primary teacher building reading confidence through small groups.',
    education: [{ school: 'University of Toronto', degree: 'BEd Primary', start: 'Fall 2012', end: 'Spring 2016' }],
    experience: [
      { company: 'Maple Grove Public School', role: 'Grade 3 Teacher', start: 'Sep 2016', end: 'Present', bullets: ['Raised reading levels for 70% of the class across one school year', 'Led the school literacy committee'] },
    ],
    skills: { 'Teaching': ['Guided reading', 'Phonics'] },
  },
  {
    id: 'pm-projects', layout: 'single', heading: 'title', bullet: '▪', headerStyle: 'company-role',
    name: 'Nadia Kowalski', headline: 'Product Manager | B2B Platforms', email: 'nadia.k@example.com', phone: '+48 22 555 0121', location: 'Warsaw, Poland',
    summary: 'Product manager shipping B2B platform features with measurable adoption.',
    experience: [
      { company: 'Vertex Cloud', role: 'Product Manager', start: 'Jan 2019', end: 'Present', bullets: ['Shipped the audit-log feature used by 80% of enterprise accounts', 'Set the quarterly roadmap with 4 engineering leads'] },
      { company: 'Ostrava Digital', role: 'Associate Product Manager', start: 'Jul 2016', end: 'Dec 2018', bullets: ['Ran discovery interviews with 45 customers'] },
    ],
    education: [{ school: 'Warsaw School of Economics', degree: 'MSc Management', start: '2014', end: '2016' }],
    projects: [{ title: 'Open API Gateway', description: 'Internal platform for partner integrations', start: '2021', end: '2021' }],
    skills: { 'Product': ['Roadmapping', 'A/B testing'], 'Data': ['SQL', 'Amplitude'] },
  },
  {
    id: 'hr-table-certs', layout: 'table', heading: 'title', bullet: '•', headerStyle: 'company-role',
    name: 'Fatima Al-Sayed', headline: 'HR Generalist | Talent Operations', email: 'fatima.alsayed@example.com', phone: '+971 50 555 0190', location: 'Dubai, UAE',
    summary: 'HR generalist covering recruitment, onboarding and employee relations.',
    experience: [
      { company: 'Gulf Logistics Group', role: 'HR Generalist', start: 'Apr 2018', end: 'Present', bullets: ['Cut time-to-hire from 52 to 31 days for roles under 60 headcount', 'Launched a structured onboarding programme adopted company-wide'] },
      { company: 'Emirates Retail', role: 'HR Assistant', start: 'Jan 2015', end: 'Mar 2018', bullets: ['Processed payroll and benefits for 400 employees each month'] },
    ],
    education: [{ school: 'American University of Sharjah', degree: 'BSc Human Resources', start: '2011', end: '2015' }],
    certifications: ['SHRM-CP', 'Certified Payroll Professional'],
    skills: { 'HR': ['Recruitment', 'Employee relations', 'Onboarding'] },
  },
];
