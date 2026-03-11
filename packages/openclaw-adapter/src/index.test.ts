import { describe, expect, it } from 'vitest';
import { demoData } from '@heysalad-os/domain';
import { buildMissionViewModels, getDemoRuntimeSnapshot, normalizeRuntime, summarizeRuntime } from './index';

describe('openclaw adapter', () => {
  it('normalizes missing runtime surfaces safely', () => {
    const snapshot = normalizeRuntime();
    expect(snapshot.agents).toEqual([]);
    expect(snapshot.approvals).toEqual([]);
    expect(snapshot.timeline).toEqual([]);
  });

  it('keeps only pending approvals and sorts timeline newest-first', () => {
    const snapshot = normalizeRuntime({
      approvals: [...demoData.approvals, { ...demoData.approvals[0], id: 'done', status: 'approved' }],
      timeline: [...demoData.timeline].reverse()
    });

    expect(snapshot.approvals).toHaveLength(demoData.approvals.length);
    expect(snapshot.timeline[0]?.happenedAt >= snapshot.timeline[1]?.happenedAt).toBe(true);
  });

  it('summarizes runtime health for mission control cards', () => {
    const summary = summarizeRuntime(getDemoRuntimeSnapshot());
    expect(summary.activeAgents).toBe(2);
    expect(summary.unhealthyAgents).toBe(1);
    expect(summary.approvalsPending).toBe(4);
    expect(summary.activeSessions).toBe(3);
  });

  it('builds mission view models with linked agents, approvals, and signals', () => {
    const models = buildMissionViewModels(demoData);
    const supportMission = models.find((model) => model.id === 'mission-support-shield');

    expect(models).toHaveLength(demoData.missions.length);
    expect(supportMission?.agents.map((agent) => agent.id)).toContain('agent-keeper');
    expect(supportMission?.approvalsPending).toHaveLength(2);
    expect(supportMission?.signals[0]?.label).toBe('Median response time');
  });
});
