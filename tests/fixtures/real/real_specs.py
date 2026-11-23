"""Made-up people, companies and numbers. Expected values use canonical dates ("Mar 2019", "Present")."""

def exp(company, role, start, end, bullets):
    return {'company': company, 'role': role, 'start': start, 'end': end, 'bullets': bullets}

def edu(school, degree, start, end):
    return {'school': school, 'degree': degree, 'start': start, 'end': end}

PHOTO = None  # set by build when a photo file is needed

SPECS = [
    {
        'id': 'libreoffice-us-letter',
        'page': 'Letter',
        'name': 'Ava Thompson',
        'headline': 'Operations Analyst | Supply Chain',
        'email': 'ava.thompson@example.com', 'phone': '(503) 555-0142',
        'contact': 'ava.thompson@example.com  |  (503) 555-0142  |  Portland, OR',
        'sections': [
            {'title': 'Summary', 'blocks': [('p', 'Analyst who turns warehouse data into decisions that cut waste.')]},
            {'title': 'Experience', 'blocks': [
                ('entry', 'Northwind Logistics — Operations Analyst', 'Jan 2019 – Present'),
                ('bullet', 'Cut stockouts by 18% with a weekly demand forecast'),
                ('bullet', 'Built the carrier scorecard used by 40 dispatchers'),
                ('entry', 'Cascade Retail — Inventory Clerk', 'Jun 2016 – Dec 2018'),
                ('bullet', 'Reconciled stock counts across six distribution sites'),
            ]},
            {'title': 'Education', 'blocks': [('entry', 'Oregon State University', 'BSc Industrial Engineering | 2012 – 2016')]},
            {'title': 'Skills', 'blocks': [('p', 'Excel, SQL, Tableau, Power BI')]},
        ],
        'experience': [
            exp('Northwind Logistics', 'Operations Analyst', 'Jan 2019', 'Present', ['Cut stockouts by 18% with a weekly demand forecast', 'Built the carrier scorecard used by 40 dispatchers']),
            exp('Cascade Retail', 'Inventory Clerk', 'Jun 2016', 'Dec 2018', ['Reconciled stock counts across six distribution sites']),
        ],
        'education': [edu('Oregon State University', 'BSc Industrial Engineering', 'Sep 2012', 'Jun 2016')],
        'skills': ['Excel', 'SQL', 'Tableau', 'Power BI'],
    },
    {
        'id': 'libreoffice-a4-uk',
        'page': 'A4',
        'name': 'Oliver Bennett',
        'headline': 'Credit Risk Analyst',
        'email': 'oliver.bennett@example.co.uk', 'phone': '+44 20 7946 0123',
        'contact': 'oliver.bennett@example.co.uk  |  +44 20 7946 0123  |  London, UK',
        'sections': [
            {'title': 'Profile', 'blocks': [('p', 'Risk analyst with six years in retail and commercial lending.')]},
            {'title': 'Experience', 'blocks': [
                ('entry', 'Harbourline Bank — Senior Analyst', '01/03/2019 – 15/08/2022'),
                ('bullet', 'Reduced provision variance by 12% through a revised loss model'),
                ('bullet', 'Led the quarterly stress-test submission for two portfolios'),
                ('entry', 'Crescent Finance Ltd — Analyst', '04/09/2016 – 28/02/2019'),
                ('bullet', 'Built monthly arrears reporting for the collections team'),
            ]},
            {'title': 'Education', 'blocks': [('entry', 'University of Bristol', 'MSc Financial Mathematics | 09/2014 – 06/2015')]},
            {'title': 'Skills', 'blocks': [('p', 'SAS, Python, IFRS 9, Excel')]},
        ],
        'experience': [
            exp('Harbourline Bank', 'Senior Analyst', 'Mar 2019', 'Aug 2022', ['Reduced provision variance by 12% through a revised loss model', 'Led the quarterly stress-test submission for two portfolios']),
            exp('Crescent Finance Ltd', 'Analyst', 'Sep 2016', 'Feb 2019', ['Built monthly arrears reporting for the collections team']),
        ],
        'education': [edu('University of Bristol', 'MSc Financial Mathematics', 'Sep 2014', 'Jun 2015')],
        'skills': ['SAS', 'Python', 'IFRS 9', 'Excel'],
    },
    {
        'id': 'libreoffice-a4-india',
        'page': 'A4',
        'name': 'Ananya Rao',
        'headline': 'Senior Software Engineer',
        'email': 'ananya.rao@example.in', 'phone': '+91 98765 43210',
        'contact': 'ananya.rao@example.in  |  +91 98765 43210  |  Bengaluru, Karnataka',
        'personal': ['Date of birth: 14/07/1990', 'Current CTC: 28 LPA', 'Expected CTC: 36 LPA', 'Notice period: 60 days'],
        'sections': [
            {'title': 'Summary', 'blocks': [('p', 'Backend engineer building payment systems for a fintech with 2M users.')]},
            {'title': 'Work Experience', 'blocks': [
                ('entry', 'Nimbus Software Pvt Ltd — Senior Software Engineer', 'Jun 2017 – Mar 2021'),
                ('bullet', 'Built the settlement service handling 40,000 transactions a day'),
                ('bullet', 'Cut p95 latency from 900 ms to 220 ms by moving reads to a cache'),
                ('entry', 'Kestrel Systems — Software Engineer', '07/2021 – Present'),
                ('bullet', 'Leads a team of five on the card issuing platform'),
            ]},
            {'title': 'Education', 'blocks': [('entry', 'Visvesvaraya Technological University', 'BE Computer Science | 2008 – 2012')]},
            {'title': 'Skills', 'blocks': [('p', 'Java, Kotlin, PostgreSQL, Kafka, AWS')]},
        ],
        'experience': [
            exp('Nimbus Software Pvt Ltd', 'Senior Software Engineer', 'Jun 2017', 'Mar 2021', ['Built the settlement service handling 40,000 transactions a day', 'Cut p95 latency from 900 ms to 220 ms by moving reads to a cache']),
            exp('Kestrel Systems', 'Software Engineer', 'Jul 2021', 'Present', ['Leads a team of five on the card issuing platform']),
        ],
        'education': [edu('Visvesvaraya Technological University', 'BE Computer Science', 'Jun 2008', 'Jun 2012')],
        'skills': ['Java', 'Kotlin', 'PostgreSQL', 'Kafka', 'AWS'],
    },
    {
        'id': 'libreoffice-a4-eu',
        'page': 'A4',
        'name': 'Lukas Weber',
        'headline': 'Project Manager, Industrial Automation',
        'email': 'lukas.weber@example.de', 'phone': '+49 30 1234 5678',
        'contact': 'lukas.weber@example.de  |  +49 30 1234 5678  |  Berlin, Germany',
        'personal': ['Date of birth: 22.03.1985', 'Nationality: German', 'Driving licence: B'],
        'sections': [
            {'title': 'Profile', 'blocks': [('p', 'Project manager delivering automation lines on time and within budget.')]},
            {'title': 'Experience', 'blocks': [
                ('entry', 'Rheinwerk Automation GmbH — Project Manager', '03/2018 – Present'),
                ('bullet', 'Delivered three production lines, 8% under budget'),
                ('entry', 'Elbe Engineering AG — Project Engineer', '09/2014 – 02/2018'),
                ('bullet', 'Commissioned PLC control systems at two plants'),
            ]},
            {'title': 'Education', 'blocks': [('entry', 'Technische Universität Dresden', 'Dipl.-Ing. Mechatronics | 2004 – 2010')]},
            {'title': 'Skills', 'blocks': [('p', 'Siemens TIA Portal, Scrum, German, English')]},
        ],
        'experience': [
            exp('Rheinwerk Automation GmbH', 'Project Manager', 'Mar 2018', 'Present', ['Delivered three production lines, 8% under budget']),
            exp('Elbe Engineering AG', 'Project Engineer', 'Sep 2014', 'Feb 2018', ['Commissioned PLC control systems at two plants']),
        ],
        'education': [edu('Technische Universität Dresden', 'Dipl.-Ing. Mechatronics', 'Sep 2004', 'Jun 2010')],
        'skills': ['Siemens TIA Portal', 'Scrum', 'German', 'English'],
    },
    {
        'id': 'libreoffice-letter-photo',
        'page': 'Letter',
        'photo': 'src/photo.png',
        'name': 'Grace Okafor',
        'headline': 'Registered Nurse | Emergency Care',
        'email': 'grace.okafor@example.com', 'phone': '(713) 555-0188',
        'contact': 'grace.okafor@example.com  |  (713) 555-0188  |  Houston, TX',
        'sections': [
            {'title': 'Summary', 'blocks': [('p', 'Emergency nurse with eight years in trauma and triage.')]},
            {'title': 'Experience', 'blocks': [
                ('entry', 'Bayview Medical Center — Charge Nurse', 'Feb 2019 – Present'),
                ('bullet', 'Coordinated triage for up to 60 patients per shift'),
                ('bullet', 'Trained 14 new nurses in sepsis protocols'),
                ('entry', 'Gulf Coast Hospital — Staff Nurse', 'Jul 2015 – Jan 2019'),
                ('bullet', 'Administered IV therapy and medication for a 24-bed unit'),
            ]},
            {'title': 'Education', 'blocks': [('entry', 'Houston Community College', 'ADN Nursing | 2011 – 2015')]},
            {'title': 'Skills', 'blocks': [('p', 'ACLS, PALS, IV therapy, Epic')]},
        ],
        'experience': [
            exp('Bayview Medical Center', 'Charge Nurse', 'Feb 2019', 'Present', ['Coordinated triage for up to 60 patients per shift', 'Trained 14 new nurses in sepsis protocols']),
            exp('Gulf Coast Hospital', 'Staff Nurse', 'Jul 2015', 'Jan 2019', ['Administered IV therapy and medication for a 24-bed unit']),
        ],
        'education': [edu('Houston Community College', 'ADN Nursing', 'Sep 2011', 'May 2015')],
        'skills': ['ACLS', 'PALS', 'IV therapy', 'Epic'],
    },
    {
        'id': 'libreoffice-three-page',
        'page': 'A4',
        'three_page_filler': 150,
        'name': 'Samuel Iyer',
        'headline': 'Director of Marketing',
        'email': 'samuel.iyer@example.com', 'phone': '+1 (416) 555-0199',
        'contact': 'samuel.iyer@example.com  |  +1 (416) 555-0199  |  Toronto, ON',
        'sections': [
            {'title': 'Summary', 'blocks': [('p', 'Marketing leader with fifteen years building brands and growth teams.')]},
            {'title': 'Experience', 'blocks': [
                ('entry', 'Maplewood Brands — Director of Marketing', 'Apr 2017 – Present'),
                ('bullet', 'Grew paid acquisition revenue by 60% over three years'),
                ('bullet', 'Managed a team of 12 across brand, performance and content'),
                ('entry', 'Lakeshore Media — Marketing Manager', 'Mar 2012 – Mar 2017'),
                ('bullet', 'Launched the loyalty programme with 200,000 members in year one'),
                ('entry', 'Pinecrest Agency — Account Lead', 'Jun 2009 – Feb 2012'),
                ('bullet', 'Ran campaigns for eight retail clients'),
            ]},
            {'title': 'Education', 'blocks': [('entry', 'Ryerson University', 'BComm Marketing | 2005 – 2009')]},
            {'title': 'Skills', 'blocks': [('p', 'HubSpot, Google Ads, SEO, Salesforce')]},
        ],
        'experience': [
            exp('Maplewood Brands', 'Director of Marketing', 'Apr 2017', 'Present', ['Grew paid acquisition revenue by 60% over three years', 'Managed a team of 12 across brand, performance and content']),
            exp('Lakeshore Media', 'Marketing Manager', 'Mar 2012', 'Mar 2017', ['Launched the loyalty programme with 200,000 members in year one']),
            exp('Pinecrest Agency', 'Account Lead', 'Jun 2009', 'Feb 2012', ['Ran campaigns for eight retail clients']),
        ],
        'education': [edu('Ryerson University', 'BComm Marketing', 'Sep 2005', 'Jun 2009')],
        'skills': ['HubSpot', 'Google Ads', 'SEO', 'Salesforce'],
    },
    {
        'id': 'scanned-image-only',
        'kind': 'scanned',
        'name': 'Priya Desai',
        'email': None, 'phone': None,
        'contact': 'priya.desai@example.com',
        'sections': [{'title': 'Experience', 'blocks': [('bullet', 'Scanned page with no text layer')]}],
        'experience': [], 'education': [], 'skills': [],
    },
]
