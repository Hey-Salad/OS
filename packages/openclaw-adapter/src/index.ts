import type { Agent, Approval, HeySaladDataset, Session, Signal, TimelineEvent } from '@heysalad-os/domain';
import { demoData } from '@heysalad-os/domain';

export interface RuntimeSnapshot {
  agents: Agent[];
  sessions: Session[];
  approvals: Approval[];
  timeline: TimelineEvent[];
  signals: Signal[];
}

export interface RuntimeSummary {
  activeAgents: number;
  approvalsPending: number;
  unhealthyAgents: number;
  activeSessions: number;
}

export const normalizeRuntime = (input?: Partial<RuntimeSnapshot>): RuntimeSnapshot => ({
  agents: input?.agents ?? [],
  sessions: input?.sessions ?? [],
  approvals: (input?.approvals ?? []).filter((approval) => approval.status === 'pending'),
  timeline: [...(input?.timeline ?? [])].sort((a, b) => b.happenedAt.localeCompare(a.happenedAt)),
  signals: input?.signals ?? []
});

export const summarizeRuntime = (snapshot: RuntimeSnapshot): RuntimeSummary => ({
  activeAgents: snapshot.agents.filter((agent) => agent.status === 'active').length,
  approvalsPending: snapshot.approvals.length,
  unhealthyAgents: snapshot.agents.filter((agent) => ['degraded', 'offline'].includes(agent.status)).length,
  activeSessions: snapshot.sessions.filter((session) => ['running', 'attention'].includes(session.state)).length
});

export interface MissionViewModel {
  id: string;
  name: string;
  status: string;
  objective: string;
  progress: number;
  agents: Agent[];
  approvalsPending: Approval[];
  latestEvent?: TimelineEvent;
  signals: Signal[];
}

export const buildMissionViewModels = (dataset: HeySaladDataset): MissionViewModel[] =>
  dataset.missions.map((mission) => ({
    id: mission.id,
    name: mission.name,
    status: mission.status,
    objective: mission.objective,
    progress: mission.progress,
    agents: dataset.agents.filter((agent) => mission.agents.includes(agent.id)),
    approvalsPending: dataset.approvals.filter((approval) => approval.missionId === mission.id && approval.status === 'pending'),
    latestEvent: dataset.timeline.find((event) => event.missionId === mission.id),
    signals: dataset.signals.filter((signal) => signal.missionId === mission.id)
  }));

export const getDemoRuntimeSnapshot = (): RuntimeSnapshot =>
  normalizeRuntime({
    agents: demoData.agents,
    sessions: demoData.sessions,
    approvals: demoData.approvals,
    timeline: demoData.timeline,
    signals: demoData.signals
  });
