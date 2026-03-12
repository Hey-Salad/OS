import { Employee, Department, OfficeName, Seniority, EmployeeStatus, DEPARTMENTS } from './types'

const OFFICES: OfficeName[] = ['San Francisco', 'New York', 'London', 'Tallinn', 'Zambia']

// ─── Name Generation Data ──────────────────────────────────────────────────────

const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
  "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
  "Timothy", "Deborah", "Ronald", "Stephanie", "Edward", "Rebecca", "Jason", "Sharon",
  "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
  "Nicholas", "Angela", "Eric", "Shirley", "Jonathan", "Anna", "Stephen", "Brenda",
  "Larry", "Pamela", "Justin", "Emma", "Scott", "Nicole", "Brandon", "Helen",
  "Benjamin", "Samantha", "Samuel", "Katherine", "Raymond", "Christine", "Gregory", "Debra",
  "Frank", "Rachel", "Alexander", "Carolyn", "Patrick", "Janet", "Jack", "Catherine",
  "Dennis", "Maria", "Jerry", "Heather", "Tyler", "Diane", "Aaron", "Ruth",
  "Jose", "Julie", "Adam", "Olivia", "Nathan", "Joyce", "Henry", "Virginia",
  "Wei", "Mei", "Yuki", "Akiko", "Raj", "Priya", "Chen", "Li",
  "Ahmed", "Fatima", "Omar", "Aisha", "Ivan", "Olga", "Dmitri", "Svetlana",
  "Carlos", "Maria", "Juan", "Sofia", "Pedro", "Isabella", "Miguel", "Valentina",
  "Kofi", "Ama", "Kwame", "Abena", "Tendai", "Chipo", "Thabo", "Lindiwe"
]

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
  "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
  "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
  "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
  "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
  "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza",
  "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers",
  "Long", "Ross", "Foster", "Jimenez", "Powell", "Jenkins", "Perry", "Russell",
  "Sullivan", "Bell", "Coleman", "Butler", "Henderson", "Barnes", "Gonzales", "Fisher",
  "Chen", "Wang", "Zhang", "Liu", "Yang", "Huang", "Wu", "Zhou",
  "Singh", "Kumar", "Sharma", "Patel", "Gupta", "Shah", "Verma", "Mehta",
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker",
  "Okonkwo", "Mensah", "Banda", "Phiri", "Mwamba", "Zulu", "Dlamini", "Nkomo"
]

// ─── Role Templates by Department ──────────────────────────────────────────────

const ROLE_TEMPLATES: Record<Department, Record<Seniority, string[]>> = {
  "Leadership": {
    "Junior": ["Executive Assistant", "Chief of Staff Associate"],
    "Mid": ["Strategy Analyst", "Business Operations Specialist"],
    "Senior": ["Senior Strategy Manager", "Executive Business Partner"],
    "Lead": ["Principal Strategist", "Lead Business Operations"],
    "Manager": ["Strategy Manager", "Operations Manager"],
    "Director": ["Director of Strategy", "Director of Operations"],
    "VP": ["VP of Strategy", "VP of Business Operations"],
    "C-Level": ["CEO", "COO", "President"]
  },
  "Financial Management": {
    "Junior": ["Financial Analyst I", "Accounting Associate"],
    "Mid": ["Financial Analyst II", "Staff Accountant"],
    "Senior": ["Senior Financial Analyst", "Senior Accountant"],
    "Lead": ["Lead Financial Analyst", "Principal Accountant"],
    "Manager": ["Finance Manager", "Accounting Manager"],
    "Director": ["Director of Finance", "Controller"],
    "VP": ["VP of Finance", "VP of Accounting"],
    "C-Level": ["CFO", "Chief Accounting Officer"]
  },
  "Sales & Revenue": {
    "Junior": ["Sales Development Rep", "Account Coordinator"],
    "Mid": ["Account Executive", "Sales Representative"],
    "Senior": ["Senior Account Executive", "Enterprise Sales Rep"],
    "Lead": ["Lead Account Executive", "Principal Sales Rep"],
    "Manager": ["Sales Manager", "Revenue Manager"],
    "Director": ["Director of Sales", "Director of Revenue"],
    "VP": ["VP of Sales", "VP of Revenue"],
    "C-Level": ["CRO", "Chief Sales Officer"]
  },
  "Marketing & Brand": {
    "Junior": ["Marketing Coordinator", "Content Associate"],
    "Mid": ["Marketing Specialist", "Brand Specialist"],
    "Senior": ["Senior Marketing Manager", "Senior Brand Manager"],
    "Lead": ["Lead Marketing Strategist", "Principal Brand Manager"],
    "Manager": ["Marketing Manager", "Brand Manager"],
    "Director": ["Director of Marketing", "Director of Brand"],
    "VP": ["VP of Marketing", "VP of Brand"],
    "C-Level": ["CMO", "Chief Brand Officer"]
  },
  "Product & Innovation": {
    "Junior": ["Associate Product Manager", "Product Analyst"],
    "Mid": ["Product Manager", "Innovation Specialist"],
    "Senior": ["Senior Product Manager", "Senior Innovation Manager"],
    "Lead": ["Lead Product Manager", "Principal PM"],
    "Manager": ["Group Product Manager", "Innovation Manager"],
    "Director": ["Director of Product", "Director of Innovation"],
    "VP": ["VP of Product", "VP of Innovation"],
    "C-Level": ["CPO", "Chief Innovation Officer"]
  },
  "Operations & Execution": {
    "Junior": ["Operations Coordinator", "Project Coordinator"],
    "Mid": ["Operations Specialist", "Project Manager"],
    "Senior": ["Senior Operations Manager", "Senior Project Manager"],
    "Lead": ["Lead Operations Manager", "Principal PM"],
    "Manager": ["Operations Manager", "Program Manager"],
    "Director": ["Director of Operations", "Director of Programs"],
    "VP": ["VP of Operations", "VP of Program Management"],
    "C-Level": ["COO", "Chief Operations Officer"]
  },
  "People & Culture": {
    "Junior": ["HR Coordinator", "Recruiting Coordinator"],
    "Mid": ["HR Business Partner", "Recruiter"],
    "Senior": ["Senior HRBP", "Senior Recruiter"],
    "Lead": ["Lead HRBP", "Lead Recruiter"],
    "Manager": ["HR Manager", "Talent Acquisition Manager"],
    "Director": ["Director of HR", "Director of Talent"],
    "VP": ["VP of People", "VP of Talent"],
    "C-Level": ["CHRO", "Chief People Officer"]
  },
  "Technology & Data": {
    "Junior": ["Software Engineer I", "Data Analyst I"],
    "Mid": ["Software Engineer II", "Data Engineer"],
    "Senior": ["Senior Software Engineer", "Senior Data Engineer"],
    "Lead": ["Staff Engineer", "Principal Data Engineer"],
    "Manager": ["Engineering Manager", "Data Manager"],
    "Director": ["Director of Engineering", "Director of Data"],
    "VP": ["VP of Engineering", "VP of Data"],
    "C-Level": ["CTO", "Chief Data Officer"]
  },
  "Consumer Experience": {
    "Junior": ["Customer Support Rep", "CX Associate"],
    "Mid": ["Customer Success Manager", "CX Specialist"],
    "Senior": ["Senior CSM", "Senior CX Manager"],
    "Lead": ["Lead CSM", "Principal CX Manager"],
    "Manager": ["Customer Success Manager", "CX Manager"],
    "Director": ["Director of Customer Success", "Director of CX"],
    "VP": ["VP of Customer Success", "VP of CX"],
    "C-Level": ["CCO", "Chief Customer Officer"]
  },
  "Legal & Compliance": {
    "Junior": ["Legal Assistant", "Compliance Analyst"],
    "Mid": ["Paralegal", "Compliance Specialist"],
    "Senior": ["Senior Counsel", "Senior Compliance Manager"],
    "Lead": ["Lead Counsel", "Principal Compliance Officer"],
    "Manager": ["Legal Manager", "Compliance Manager"],
    "Director": ["Director of Legal", "Director of Compliance"],
    "VP": ["VP of Legal", "VP of Compliance"],
    "C-Level": ["CLO", "General Counsel"]
  },
  "Communication": {
    "Junior": ["Communications Coordinator", "PR Associate"],
    "Mid": ["Communications Specialist", "PR Specialist"],
    "Senior": ["Senior Communications Manager", "Senior PR Manager"],
    "Lead": ["Lead Communications Strategist", "Principal PR Manager"],
    "Manager": ["Communications Manager", "PR Manager"],
    "Director": ["Director of Communications", "Director of PR"],
    "VP": ["VP of Communications", "VP of PR"],
    "C-Level": ["CCO", "Chief Communications Officer"]
  },
  "Risk Management": {
    "Junior": ["Risk Analyst I", "Security Analyst I"],
    "Mid": ["Risk Analyst II", "Security Engineer"],
    "Senior": ["Senior Risk Manager", "Senior Security Engineer"],
    "Lead": ["Lead Risk Manager", "Principal Security Engineer"],
    "Manager": ["Risk Manager", "Security Manager"],
    "Director": ["Director of Risk", "Director of Security"],
    "VP": ["VP of Risk", "VP of Security"],
    "C-Level": ["CRO", "CISO"]
  },
  "Partnerships & Ecosystem": {
    "Junior": ["Partnership Coordinator", "Business Development Rep"],
    "Mid": ["Partnership Manager", "BD Manager"],
    "Senior": ["Senior Partnership Manager", "Senior BD Manager"],
    "Lead": ["Lead Partnership Manager", "Principal BD Manager"],
    "Manager": ["Partnership Manager", "BD Manager"],
    "Director": ["Director of Partnerships", "Director of BD"],
    "VP": ["VP of Partnerships", "VP of Business Development"],
    "C-Level": ["Chief Partnership Officer", "Chief BD Officer"]
  },
  "Adaptability & Learning": {
    "Junior": ["L&D Coordinator", "Training Associate"],
    "Mid": ["L&D Specialist", "Training Specialist"],
    "Senior": ["Senior L&D Manager", "Senior Training Manager"],
    "Lead": ["Lead L&D Manager", "Principal Training Manager"],
    "Manager": ["L&D Manager", "Training Manager"],
    "Director": ["Director of L&D", "Director of Training"],
    "VP": ["VP of Learning", "VP of Development"],
    "C-Level": ["CLO", "Chief Learning Officer"]
  },
  "Sustainability & Social": {
    "Junior": ["Sustainability Coordinator", "CSR Associate"],
    "Mid": ["Sustainability Specialist", "CSR Specialist"],
    "Senior": ["Senior Sustainability Manager", "Senior CSR Manager"],
    "Lead": ["Lead Sustainability Manager", "Principal CSR Manager"],
    "Manager": ["Sustainability Manager", "CSR Manager"],
    "Director": ["Director of Sustainability", "Director of CSR"],
    "VP": ["VP of Sustainability", "VP of Social Impact"],
    "C-Level": ["Chief Sustainability Officer", "Chief Impact Officer"]
  }
}

// ─── Skills by Department ──────────────────────────────────────────────────────

const SKILLS_BY_DEPARTMENT: Record<Department, string[]> = {
  "Leadership": ["Strategic Planning", "Executive Communication", "Decision Making", "Stakeholder Management", "Vision Setting"],
  "Financial Management": ["Financial Analysis", "Budgeting", "Forecasting", "GAAP", "Excel", "Financial Modeling"],
  "Sales & Revenue": ["Salesforce", "Negotiation", "Pipeline Management", "Account Management", "Cold Outreach"],
  "Marketing & Brand": ["Digital Marketing", "Content Strategy", "SEO/SEM", "Brand Management", "Analytics"],
  "Product & Innovation": ["Product Strategy", "Roadmapping", "User Research", "Agile", "A/B Testing"],
  "Operations & Execution": ["Process Optimization", "Project Management", "Lean Six Sigma", "Vendor Management"],
  "People & Culture": ["Talent Acquisition", "Employee Relations", "HRIS", "Performance Management", "D&I"],
  "Technology & Data": ["Python", "JavaScript", "SQL", "AWS", "Machine Learning", "System Design"],
  "Consumer Experience": ["Customer Support", "Zendesk", "NPS Analysis", "Journey Mapping", "Empathy"],
  "Legal & Compliance": ["Contract Law", "Regulatory Compliance", "Risk Assessment", "GDPR", "IP Law"],
  "Communication": ["Public Relations", "Crisis Communication", "Copywriting", "Media Relations"],
  "Risk Management": ["Risk Assessment", "Business Continuity", "Audit", "Fraud Prevention", "SOX"],
  "Partnerships & Ecosystem": ["Partner Relations", "Deal Structuring", "Ecosystem Development", "Alliance Management"],
  "Adaptability & Learning": ["Instructional Design", "LMS", "Change Management", "Facilitation", "Coaching"],
  "Sustainability & Social": ["ESG Reporting", "Carbon Accounting", "CSR Strategy", "Impact Measurement"]
}

// ─── Office Distribution ───────────────────────────────────────────────────────

const OFFICE_HEADCOUNTS: Record<OfficeName, number> = {
  "San Francisco": 85,
  "New York": 65,
  "London": 45,
  "Tallinn": 55,
  "Zambia": 50
}

// ─── Seniority Distribution (approximate percentages) ──────────────────────────

const SENIORITY_WEIGHTS: Record<Seniority, number> = {
  "Junior": 20,
  "Mid": 30,
  "Senior": 25,
  "Lead": 10,
  "Manager": 8,
  "Director": 4,
  "VP": 2,
  "C-Level": 1
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function weightedRandomSeniority(): Seniority {
  const total = Object.values(SENIORITY_WEIGHTS).reduce((a, b) => a + b, 0)
  let random = Math.random() * total
  for (const [seniority, weight] of Object.entries(SENIORITY_WEIGHTS)) {
    random -= weight
    if (random <= 0) return seniority as Seniority
  }
  return "Mid"
}

function generateEmployeeId(index: number): string {
  return `HS-${String(1000 + index).padStart(4, '0')}`
}

function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@heysalad.com`
}

function generateStartDate(): string {
  const start = new Date('2020-01-01')
  const end = new Date('2024-12-31')
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().split('T')[0]
}

function getRandomStatus(): EmployeeStatus {
  const rand = Math.random()
  if (rand < 0.85) return "active"
  if (rand < 0.92) return "remote"
  if (rand < 0.97) return "on-leave"
  return "traveling"
}

function getRandomSkills(department: Department): string[] {
  const deptSkills = SKILLS_BY_DEPARTMENT[department]
  const numSkills = 2 + Math.floor(Math.random() * 3)
  const shuffled = [...deptSkills].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, numSkills)
}

// ─── Generate All Employees ────────────────────────────────────────────────────

function generateEmployees(): Employee[] {
  const employees: Employee[] = []
  let employeeIndex = 0
  const usedNames = new Set<string>()
  
  // Distribute employees across offices
  for (const office of OFFICES) {
    const headcount = OFFICE_HEADCOUNTS[office]
    const employeesPerDept = Math.floor(headcount / DEPARTMENTS.length)
    const remainder = headcount % DEPARTMENTS.length
    
    let deptIndex = 0
    for (const department of DEPARTMENTS) {
      // Add extra employee to first 'remainder' departments
      const deptHeadcount = employeesPerDept + (deptIndex < remainder ? 1 : 0)
      
      for (let i = 0; i < deptHeadcount; i++) {
        let firstName: string, lastName: string, fullName: string
        
        // Ensure unique names
        do {
          firstName = randomChoice(FIRST_NAMES)
          lastName = randomChoice(LAST_NAMES)
          fullName = `${firstName} ${lastName}`
        } while (usedNames.has(fullName))
        usedNames.add(fullName)
        
        const seniority = weightedRandomSeniority()
        const roles = ROLE_TEMPLATES[department][seniority]
        const role = randomChoice(roles)
        
        const employee: Employee = {
          id: generateEmployeeId(employeeIndex),
          firstName,
          lastName,
          email: generateEmail(firstName, lastName),
          department,
          role,
          seniority,
          office,
          status: getRandomStatus(),
          startDate: generateStartDate(),
          reportsTo: null, // Will be set in post-processing
          skills: getRandomSkills(department)
        }
        
        employees.push(employee)
        employeeIndex++
      }
      
      deptIndex++
    }
  }
  
  // Post-process: Set up reporting structure
  // C-Level reports to CEO, VPs report to C-Level of same dept, etc.
  const ceo = employees.find(e => e.role === "CEO")
  
  employees.forEach(emp => {
    if (emp.role === "CEO") {
      emp.reportsTo = null
    } else if (emp.seniority === "C-Level") {
      emp.reportsTo = ceo?.id || null
    } else {
      // Find a manager in the same department and office with higher seniority
      const seniorityOrder: Seniority[] = ["C-Level", "VP", "Director", "Manager", "Lead", "Senior", "Mid", "Junior"]
      const empSeniorityIndex = seniorityOrder.indexOf(emp.seniority)
      
      const potentialManagers = employees.filter(m => 
        m.department === emp.department &&
        m.office === emp.office &&
        seniorityOrder.indexOf(m.seniority) < empSeniorityIndex
      )
      
      if (potentialManagers.length > 0) {
        emp.reportsTo = randomChoice(potentialManagers).id
      } else {
        // Fall back to any senior person in same office
        const seniorInOffice = employees.find(m =>
          m.office === emp.office &&
          seniorityOrder.indexOf(m.seniority) < empSeniorityIndex
        )
        emp.reportsTo = seniorInOffice?.id || ceo?.id || null
      }
    }
  })
  
  return employees
}

// ─── Seed for consistent generation ────────────────────────────────────────────

// Use seeded random for consistent employee generation
let seed = 42
function seededRandom(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

// Override Math.random temporarily for generation
const originalRandom = Math.random
Math.random = seededRandom

export const employees: Employee[] = generateEmployees()

// Restore Math.random
Math.random = originalRandom

// ─── Helper Functions for Querying ─────────────────────────────────────────────

export function getEmployeeById(id: string): Employee | undefined {
  return employees.find(e => e.id === id)
}

export function getEmployeesByOffice(office: OfficeName): Employee[] {
  return employees.filter(e => e.office === office)
}

export function getEmployeesByDepartment(department: Department): Employee[] {
  return employees.filter(e => e.department === department)
}

export function getEmployeesByOfficeAndDepartment(office: OfficeName, department: Department): Employee[] {
  return employees.filter(e => e.office === office && e.department === department)
}

export function getDirectReports(managerId: string): Employee[] {
  return employees.filter(e => e.reportsTo === managerId)
}

export function searchEmployees(query: string): Employee[] {
  const lowerQuery = query.toLowerCase()
  return employees.filter(e =>
    e.firstName.toLowerCase().includes(lowerQuery) ||
    e.lastName.toLowerCase().includes(lowerQuery) ||
    e.email.toLowerCase().includes(lowerQuery) ||
    e.id.toLowerCase().includes(lowerQuery) ||
    e.role.toLowerCase().includes(lowerQuery) ||
    e.department.toLowerCase().includes(lowerQuery)
  )
}

export function getDepartmentStats(office?: OfficeName): Record<Department, number> {
  const filtered = office ? getEmployeesByOffice(office) : employees
  const stats: Record<string, number> = {}
  
  for (const dept of DEPARTMENTS) {
    stats[dept] = filtered.filter(e => e.department === dept).length
  }
  
  return stats as Record<Department, number>
}

export function getOfficeStats(): Record<OfficeName, number> {
  const stats: Record<string, number> = {}
  
  for (const office of OFFICES) {
    stats[office] = getEmployeesByOffice(office).length
  }
  
  return stats as Record<OfficeName, number>
}

export function getStatusStats(office?: OfficeName): Record<EmployeeStatus, number> {
  const filtered = office ? getEmployeesByOffice(office) : employees
  
  return {
    "active": filtered.filter(e => e.status === "active").length,
    "remote": filtered.filter(e => e.status === "remote").length,
    "on-leave": filtered.filter(e => e.status === "on-leave").length,
    "traveling": filtered.filter(e => e.status === "traveling").length
  }
}
