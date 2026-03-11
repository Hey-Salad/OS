import { describe, expect, it } from 'vitest';
import { byId, demoData } from './index';

describe('domain demo data', () => {
  it('keeps core collections populated for the MVP UI', () => {
    expect(demoData.missions.length).toBeGreaterThanOrEqual(3);
    expect(demoData.agents.length).toBeGreaterThanOrEqual(5);
    expect(demoData.approvals.every((approval) => approval.status === 'pending')).toBe(true);
  });

  it('keeps cross-links internally consistent', () => {
    const missions = byId(demoData.missions);
    const agents = byId(demoData.agents);
    const initiatives = byId(demoData.initiatives);

    for (const agent of demoData.agents) {
      expect(missions[agent.currentMissionId]).toBeDefined();
    }

    for (const mission of demoData.missions) {
      expect(initiatives[mission.initiativeId]).toBeDefined();
      expect(mission.agents.every((agentId) => agents[agentId])).toBe(true);
    }
  });
});
