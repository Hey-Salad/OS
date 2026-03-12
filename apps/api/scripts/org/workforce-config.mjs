export const departments = [
  { code: 'leadership', name: 'Leadership', weight: 3 },
  { code: 'finance', name: 'Financial Management', weight: 6 },
  { code: 'sales', name: 'Sales & Revenue', weight: 11 },
  { code: 'marketing', name: 'Marketing & Brand', weight: 8 },
  { code: 'product', name: 'Product & Innovation', weight: 9 },
  { code: 'operations', name: 'Operations & Execution', weight: 14 },
  { code: 'people', name: 'People & Culture', weight: 6 },
  { code: 'technology', name: 'Technology & Data', weight: 14 },
  { code: 'consumer', name: 'Consumer Experience', weight: 9 },
  { code: 'legal', name: 'Legal & Compliance', weight: 5 },
  { code: 'risk', name: 'Risk Management', weight: 5 },
  { code: 'partnerships', name: 'Partnerships & Ecosystem', weight: 5 },
  { code: 'sustainability', name: 'Sustainability & Social', weight: 2 },
  { code: 'communications', name: 'Communication', weight: 3 }
];

export const seniorityBands = [
  { key: 'Junior', weight: 32 },
  { key: 'Mid', weight: 28 },
  { key: 'Senior', weight: 19 },
  { key: 'Lead', weight: 8 },
  { key: 'Manager', weight: 7 },
  { key: 'Director', weight: 4 },
  { key: 'VP', weight: 1.5 },
  { key: 'C-Level', weight: 0.5 }
];

export const capabilityClusters = [
  { code: 'delivery', name: 'Delivery Systems', capabilities: ['Workflow orchestration', 'Queue management', 'SLA governance'] },
  { code: 'analytics', name: 'Analytics & Intelligence', capabilities: ['Forecasting', 'Anomaly detection', 'KPI modeling'] },
  { code: 'governance', name: 'Governance & Compliance', capabilities: ['Policy interpretation', 'Risk controls', 'Approval control'] },
  { code: 'growth', name: 'Growth Execution', capabilities: ['Demand generation', 'Pipeline operations', 'Partner enablement'] },
  { code: 'platform', name: 'Platform Engineering', capabilities: ['Cloud architecture', 'Automation pipelines', 'Agent runtime operations'] }
];

const roleByDepartment = {
  leadership: ['Strategy Operator', 'Chief of Staff Agent', 'Executive Operations Agent'],
  finance: ['Finance Planning Agent', 'Accounting Controls Agent', 'Treasury Agent'],
  sales: ['Revenue Operations Agent', 'Account Growth Agent', 'Pipeline Agent'],
  marketing: ['Brand Operations Agent', 'Campaign Optimization Agent', 'Content Strategy Agent'],
  product: ['Product Strategy Agent', 'Experience Optimization Agent', 'Research Agent'],
  operations: ['Operations Coordinator Agent', 'Program Execution Agent', 'Service Routing Agent'],
  people: ['Talent Operations Agent', 'Workforce Planning Agent', 'People Support Agent'],
  technology: ['Platform Engineer Agent', 'Data Systems Agent', 'AI Runtime Engineer Agent'],
  consumer: ['Customer Success Agent', 'Support Orchestrator Agent', 'CX Insights Agent'],
  legal: ['Compliance Counsel Agent', 'Policy Review Agent', 'Regulatory Monitoring Agent'],
  risk: ['Risk Monitoring Agent', 'Security Governance Agent', 'Continuity Agent'],
  partnerships: ['Partner Operations Agent', 'Ecosystem Development Agent', 'Alliance Agent'],
  sustainability: ['Impact Reporting Agent', 'Sustainability Program Agent', 'ESG Data Agent'],
  communications: ['Internal Communications Agent', 'PR Operations Agent', 'Crisis Comms Agent']
};

export function roleFor(departmentCode, seniorityBand, randomInt) {
  const base = roleByDepartment[departmentCode] ?? roleByDepartment.operations;
  const suffix = seniorityBand === 'C-Level'
    ? 'Chief Agent'
    : seniorityBand === 'VP'
      ? 'VP Agent'
      : seniorityBand === 'Director'
        ? 'Director Agent'
        : seniorityBand === 'Manager'
          ? 'Manager Agent'
          : seniorityBand === 'Lead'
            ? 'Lead Agent'
            : seniorityBand === 'Senior'
              ? 'Senior Agent'
              : seniorityBand === 'Junior'
                ? 'Associate Agent'
                : 'Operator Agent';
  return `${base[randomInt(0, base.length - 1)]} ${suffix}`;
}

export const firstNames = [
  'Amina', 'Tendai', 'Kwame', 'Chipo', 'Fatou', 'Lerato', 'Sibusiso', 'Mariam', 'Thabo', 'Nomsa',
  'Ife', 'Zola', 'Aisha', 'Kato', 'Nala', 'Baraka', 'Mpho', 'Olu', 'Rudo', 'Tariro',
  'Musa', 'Hawa', 'Jelani', 'Nyasha', 'Kendi', 'Amara', 'Neo', 'Mandla', 'Lindiwe', 'Chisomo',
  'Jade', 'Noah', 'Liam', 'Emma', 'Olivia', 'Mason', 'Ava', 'Ethan', 'Sophia', 'Lucas'
];

export const lastNames = [
  'Banda', 'Zulu', 'Mwamba', 'Phiri', 'Nkosi', 'Ndlovu', 'Okafor', 'Mensah', 'Diallo', 'Kamau',
  'Adeyemi', 'Abebe', 'Moyo', 'Dlamini', 'Mbeki', 'Muller', 'Patel', 'Khan', 'Silva', 'Haddad',
  'Garcia', 'Johnson', 'Chen', 'Singh', 'Williams', 'Brown', 'Lopez', 'Kim', 'Taylor', 'Anderson'
];
