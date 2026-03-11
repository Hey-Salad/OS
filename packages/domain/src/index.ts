export type Status = 'healthy' | 'watch' | 'attention' | 'offline';
export type AgentState = 'active' | 'idle' | 'approvals' | 'degraded' | 'offline';
export type SessionState = 'running' | 'queued' | 'completed' | 'attention';
export type ApprovalRisk = 'low' | 'medium' | 'high';

export interface Workspace {
  id: string;
  name: string;
  region: string;
  mission: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  owner: string;
  status: AgentState;
  skills: string[];
  currentMissionId: string;
  currentSessionId?: string;
  lastHeartbeatMinutesAgo: number;
  throughput: number;
  backlog: number;
}

export interface Session {
  id: string;
  agentId: string;
  title: string;
  state: SessionState;
  startedAt: string;
  channel: string;
}

export interface Approval {
  id: string;
  missionId: string;
  agentId: string;
  title: string;
  summary: string;
  risk: ApprovalRisk;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export interface Signal {
  id: string;
  missionId: string;
  kind: 'revenue' | 'risk' | 'ops' | 'delivery';
  label: string;
  value: string;
  status: Status;
}

export interface TimelineEvent {
  id: string;
  missionId: string;
  agentId?: string;
  type: 'session' | 'approval' | 'signal' | 'operator';
  title: string;
  detail: string;
  happenedAt: string;
}

export interface CompanyEntity {
  id: string;
  name: string;
  kind: 'workspace' | 'brand' | 'customer' | 'supplier' | 'channel';
  region: string;
  status: Status;
  owner: string;
}

export interface ProductInitiative {
  id: string;
  name: string;
  stage: 'live' | 'beta' | 'planning';
  owner: string;
  linkedMissionId: string;
  revenueModel: string;
  status: Status;
}

export interface Mission {
  id: string;
  name: string;
  objective: string;
  status: Status;
  operator: string;
  progress: number;
  agents: string[];
  approvalsOpen: number;
  initiativeId: string;
}

export interface HeySaladDataset {
  workspace: Workspace;
  agents: Agent[];
  sessions: Session[];
  approvals: Approval[];
  signals: Signal[];
  timeline: TimelineEvent[];
  missions: Mission[];
  entities: CompanyEntity[];
  initiatives: ProductInitiative[];
}

export const demoData: HeySaladDataset = {
  workspace: {
    id: 'ws-heysalad-core',
    name: 'HeySalad HQ',
    region: 'London / Cloudflare Edge',
    mission: 'Run a calm, high-signal human+agent company.'
  },
  missions: [
    {
      id: 'mission-growth-loop',
      name: 'Growth Loop',
      objective: 'Turn fresh launches into compounding operator-visible revenue.',
      status: 'healthy',
      operator: 'Ava',
      progress: 74,
      agents: ['agent-scout', 'agent-composer'],
      approvalsOpen: 1,
      initiativeId: 'initiative-salad-club'
    },
    {
      id: 'mission-support-shield',
      name: 'Support Shield',
      objective: 'Keep customer response times under 8 minutes during spikes.',
      status: 'watch',
      operator: 'Milo',
      progress: 61,
      agents: ['agent-keeper', 'agent-liaison'],
      approvalsOpen: 2,
      initiativeId: 'initiative-concierge'
    },
    {
      id: 'mission-launch-lab',
      name: 'Launch Lab',
      objective: 'Coordinate product drops, partner comms, and post-launch fixes.',
      status: 'attention',
      operator: 'June',
      progress: 42,
      agents: ['agent-composer', 'agent-broker'],
      approvalsOpen: 1,
      initiativeId: 'initiative-office'
    }
  ],
  agents: [
    {
      id: 'agent-scout',
      name: 'Scout',
      role: 'Market sensing + signal triage',
      owner: 'Ava',
      status: 'active',
      skills: ['github', 'weather', 'gemini'],
      currentMissionId: 'mission-growth-loop',
      currentSessionId: 'session-401',
      lastHeartbeatMinutesAgo: 2,
      throughput: 88,
      backlog: 3
    },
    {
      id: 'agent-composer',
      name: 'Composer',
      role: 'Campaign drafting + launch orchestration',
      owner: 'June',
      status: 'approvals',
      skills: ['oracle', 'github', 'slack'],
      currentMissionId: 'mission-launch-lab',
      currentSessionId: 'session-402',
      lastHeartbeatMinutesAgo: 5,
      throughput: 71,
      backlog: 5
    },
    {
      id: 'agent-keeper',
      name: 'Keeper',
      role: 'Support queue governor',
      owner: 'Milo',
      status: 'degraded',
      skills: ['tmux', 'mcporter', 'openai-whisper-api'],
      currentMissionId: 'mission-support-shield',
      currentSessionId: 'session-403',
      lastHeartbeatMinutesAgo: 11,
      throughput: 54,
      backlog: 12
    },
    {
      id: 'agent-liaison',
      name: 'Liaison',
      role: 'Customer recovery + escalation handoff',
      owner: 'Milo',
      status: 'idle',
      skills: ['slack', 'github', 'gemini'],
      currentMissionId: 'mission-support-shield',
      lastHeartbeatMinutesAgo: 7,
      throughput: 66,
      backlog: 4
    },
    {
      id: 'agent-broker',
      name: 'Broker',
      role: 'Partner ops + approvals routing',
      owner: 'June',
      status: 'active',
      skills: ['github', 'oracle', 'mcporter'],
      currentMissionId: 'mission-launch-lab',
      currentSessionId: 'session-404',
      lastHeartbeatMinutesAgo: 1,
      throughput: 79,
      backlog: 2
    }
  ],
  sessions: [
    { id: 'session-401', agentId: 'agent-scout', title: 'Trend sweep / March edge prompts', state: 'running', startedAt: '2026-03-09T17:58:00Z', channel: 'webchat' },
    { id: 'session-402', agentId: 'agent-composer', title: 'Launch copy awaiting legal sign-off', state: 'attention', startedAt: '2026-03-09T17:41:00Z', channel: 'slack' },
    { id: 'session-403', agentId: 'agent-keeper', title: 'Support queue overload mitigation', state: 'running', startedAt: '2026-03-09T17:22:00Z', channel: 'discord' },
    { id: 'session-404', agentId: 'agent-broker', title: 'Partner SKU sync + billing confirmation', state: 'queued', startedAt: '2026-03-09T18:08:00Z', channel: 'api' }
  ],
  approvals: [
    { id: 'approval-1', missionId: 'mission-growth-loop', agentId: 'agent-composer', title: 'Approve launch email batch', summary: '14k recipients, revenue segment A/B split, send at 19:00.', risk: 'medium', status: 'pending', requestedAt: '2026-03-09T18:05:00Z' },
    { id: 'approval-2', missionId: 'mission-support-shield', agentId: 'agent-keeper', title: 'Issue goodwill credits', summary: '£840 total credits across 17 delayed concierge orders.', risk: 'high', status: 'pending', requestedAt: '2026-03-09T17:46:00Z' },
    { id: 'approval-3', missionId: 'mission-launch-lab', agentId: 'agent-broker', title: 'Publish partner pricing update', summary: 'Sync revised wholesale ladder to Shopify + partner portal.', risk: 'high', status: 'pending', requestedAt: '2026-03-09T17:32:00Z' },
    { id: 'approval-4', missionId: 'mission-support-shield', agentId: 'agent-liaison', title: 'Escalate 3 VIP recoveries', summary: 'Hand off to human operator with transcript bundles attached.', risk: 'low', status: 'pending', requestedAt: '2026-03-09T17:18:00Z' }
  ],
  signals: [
    { id: 'signal-1', missionId: 'mission-growth-loop', kind: 'revenue', label: 'Launch conversion', value: '+14.8%', status: 'healthy' },
    { id: 'signal-2', missionId: 'mission-support-shield', kind: 'ops', label: 'Median response time', value: '11m 24s', status: 'attention' },
    { id: 'signal-3', missionId: 'mission-launch-lab', kind: 'delivery', label: 'Partner readiness', value: '62%', status: 'watch' },
    { id: 'signal-4', missionId: 'mission-launch-lab', kind: 'risk', label: 'Approval latency', value: '27m', status: 'attention' }
  ],
  timeline: [
    { id: 'event-1', missionId: 'mission-growth-loop', agentId: 'agent-scout', type: 'signal', title: 'Scout detected conversion spike', detail: 'Social proof variant outperforming control by 14.8%.', happenedAt: '2026-03-09T18:11:00Z' },
    { id: 'event-2', missionId: 'mission-support-shield', agentId: 'agent-keeper', type: 'approval', title: 'Keeper requested goodwill credits', detail: 'High-risk due to refund budget threshold.', happenedAt: '2026-03-09T17:46:00Z' },
    { id: 'event-3', missionId: 'mission-launch-lab', agentId: 'agent-composer', type: 'session', title: 'Composer paused pending legal sign-off', detail: 'Outbound launch copy ready, blocked on final review.', happenedAt: '2026-03-09T17:41:00Z' },
    { id: 'event-4', missionId: 'mission-support-shield', type: 'operator', title: 'Milo reassigned overflow queue', detail: 'Liaison now handling VIP recoveries.', happenedAt: '2026-03-09T17:28:00Z' },
    { id: 'event-5', missionId: 'mission-launch-lab', agentId: 'agent-broker', type: 'signal', title: 'Broker synced partner inventory', detail: '12 of 19 partner SKUs now reconciled.', happenedAt: '2026-03-09T17:14:00Z' }
  ],
  entities: [
    { id: 'entity-1', name: 'HeySalad HQ', kind: 'workspace', region: 'London', status: 'healthy', owner: 'Ava' },
    { id: 'entity-2', name: 'Salad Club', kind: 'brand', region: 'UK + EU', status: 'healthy', owner: 'June' },
    { id: 'entity-3', name: 'Concierge Beta', kind: 'customer', region: 'UK', status: 'watch', owner: 'Milo' },
    { id: 'entity-4', name: 'EdgeGrocer Partners', kind: 'supplier', region: 'EMEA', status: 'attention', owner: 'June' },
    { id: 'entity-5', name: 'WhatsApp Commerce', kind: 'channel', region: 'Global', status: 'healthy', owner: 'Ava' }
  ],
  initiatives: [
    { id: 'initiative-salad-club', name: 'Salad Club', stage: 'live', owner: 'Ava', linkedMissionId: 'mission-growth-loop', revenueModel: 'Subscription + upsell', status: 'healthy' },
    { id: 'initiative-concierge', name: 'Concierge Recovery', stage: 'beta', owner: 'Milo', linkedMissionId: 'mission-support-shield', revenueModel: 'High-touch retention', status: 'watch' },
    { id: 'initiative-office', name: 'Office Launch Kit', stage: 'planning', owner: 'June', linkedMissionId: 'mission-launch-lab', revenueModel: 'B2B launch bundles', status: 'attention' }
  ]
};

export const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));
