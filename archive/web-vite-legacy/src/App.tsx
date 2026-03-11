import { useMemo } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { demoData, type Agent, type ApprovalRisk, type ProductInitiative, type Signal, type Status } from '@heysalad-os/domain';
import { buildMissionViewModels, getDemoRuntimeSnapshot, summarizeRuntime } from '@heysalad-os/openclaw-adapter';

const statusTone: Record<Status, string> = {
  healthy: 'healthy',
  watch: 'watch',
  attention: 'attention',
  offline: 'offline'
};

const riskTone: Record<ApprovalRisk, string> = {
  low: 'healthy',
  medium: 'watch',
  high: 'attention'
};

const nav = [
  ['/', 'Home', '⌂'],
  ['/mission-control', 'Mission Control', '◎'],
  ['/agents', 'Agents', '◌'],
  ['/entities', 'Company', '◇'],
  ['/initiatives', 'Products', '▣']
] as const;

const signalGlyph: Record<Signal['kind'], string> = {
  revenue: '£',
  risk: '!',
  ops: '◌',
  delivery: '→'
};

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function PanelHeader({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="panel-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {aside ? <div className="panel-header-aside">{aside}</div> : null}
    </div>
  );
}

function SystemBar() {
  const now = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London'
  }).format(new Date('2026-03-09T20:42:00Z'));

  return (
    <header className="system-bar shell-panel">
      <div className="system-block brand-block">
        <div className="traffic-lights" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <img
          className="brand-logo"
          src="https://raw.githubusercontent.com/Hey-Salad/.github/main/HeySalad%20Logo%20Black.svg"
          alt="HeySalad"
        />
        <div>
          <span className="eyebrow">HeySalad OS</span>
          <strong>{demoData.workspace.name}</strong>
        </div>
      </div>

      <div className="signal-marquee">
        {demoData.signals.map((signal) => (
          <div key={signal.id} className={`signal-chip ${statusTone[signal.status]}`}>
            <span>{signalGlyph[signal.kind]}</span>
            <strong>{signal.value}</strong>
            <small>{signal.label}</small>
          </div>
        ))}
      </div>

      <div className="system-block status-block">
        <Badge tone="healthy">Live shell</Badge>
        <div className="operator-stamp">
          <strong>Operator</strong>
          <small>{now}</small>
        </div>
      </div>
    </header>
  );
}

function SideRail() {
  const hotApprovals = demoData.approvals.filter((item) => item.risk === 'high').length;

  return (
    <aside className="side-rail shell-panel">
      <div className="rail-top">
        <div className="rail-brand-tile">
          <div className="rail-brand-mark">HS</div>
          <div>
            <span className="eyebrow">Shell</span>
            <strong>Control rail</strong>
          </div>
        </div>

        <nav className="rail-nav" aria-label="Primary">
          {nav.map(([to, label, glyph]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}>
              <span className="rail-icon" aria-hidden="true">{glyph}</span>
              <span className="rail-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="rail-bottom">
        <div className="mini-stack shell-card">
          <span className="eyebrow">Mode</span>
          <strong>Control room</strong>
        </div>
        <div className="mini-stack shell-card alert">
          <span className="eyebrow">Hot queue</span>
          <strong>{hotApprovals}</strong>
        </div>
      </div>
    </aside>
  );
}

function MetricsStrip() {
  const runtime = getDemoRuntimeSnapshot();
  const summary = summarizeRuntime(runtime);

  return (
    <div className="metrics-strip">
      <section className="metric-panel shell-panel"><span className="eyebrow">Agents</span><strong>{summary.activeAgents}</strong></section>
      <section className="metric-panel shell-panel"><span className="eyebrow">Approvals</span><strong>{summary.approvalsPending}</strong></section>
      <section className="metric-panel shell-panel"><span className="eyebrow">Sessions</span><strong>{summary.activeSessions}</strong></section>
      <section className="metric-panel shell-panel"><span className="eyebrow">Attention</span><strong>{summary.unhealthyAgents}</strong></section>
    </div>
  );
}

function TwinCanvas() {
  const missions = buildMissionViewModels(demoData);
  const featuredAgents = demoData.agents.slice(0, 5);

  return (
    <section className="window-panel">
      <PanelHeader eyebrow="Company twin" title="Workspace" aside={<Badge tone="healthy">Twin active</Badge>} />
      <div className="twin-shell shell-panel">
        <div className="grid-raster" aria-hidden="true" />
        <div className="shell-glow shell-glow-a" />
        <div className="shell-glow shell-glow-b" />

        <article className="zone-card zone-command shell-card">
          <span className="eyebrow">Command deck</span>
          <strong>{demoData.workspace.mission}</strong>
          <div className="stack-list compact-space">
            {missions.map((mission) => (
              <div key={mission.id} className="progress-cluster-row">
                <div className="row-between">
                  <span>{mission.name}</span>
                  <small>{mission.progress}%</small>
                </div>
                <div className="progress-bar"><span className={statusTone[mission.status as Status]} style={{ width: `${mission.progress}%` }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="zone-card zone-map shell-card">
          <span className="eyebrow">Spatial view</span>
          <div className="company-map">
            {demoData.entities.slice(0, 4).map((entity) => (
              <div key={entity.id} className={`map-node ${statusTone[entity.status]}`}>
                <small>{entity.kind}</small>
                <strong>{entity.name}</strong>
              </div>
            ))}
            <div className="map-link map-link-h" />
            <div className="map-link map-link-v" />
          </div>
        </article>

        <article className="zone-card zone-feed shell-card">
          <span className="eyebrow">Hot approvals</span>
          <div className="stack-list">
            {demoData.approvals.slice(0, 3).map((approval) => (
              <div key={approval.id} className="approval-row">
                <div>
                  <strong>{approval.title}</strong>
                  <small>{approval.summary}</small>
                </div>
                <Badge tone={riskTone[approval.risk]}>{approval.risk}</Badge>
              </div>
            ))}
          </div>
        </article>

        <article className="zone-card zone-ribbon shell-card">
          <span className="eyebrow">Session ribbon</span>
          <div className="session-ribbon">
            {demoData.sessions.map((session) => (
              <div key={session.id} className="session-pill">
                <small>{session.channel}</small>
                <strong>{session.title}</strong>
              </div>
            ))}
          </div>
        </article>

        {featuredAgents.map((agent, index) => {
          const tone = agent.status === 'offline' ? 'offline' : agent.status === 'degraded' || agent.status === 'approvals' ? 'watch' : 'healthy';
          return (
            <article key={agent.id} className={`zone-card agent-node shell-card ${tone} lane-${index + 1}`}>
              <div className="row-between">
                <span className="eyebrow">{agent.role}</span>
                <Badge tone={tone}>{agent.status}</Badge>
              </div>
              <strong>{agent.name}</strong>
              <small>{agent.owner}</small>
              <div className="progress-bar compact"><span className={tone} style={{ width: `${agent.throughput}%` }} /></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MissionControlScene() {
  const missions = buildMissionViewModels(demoData);

  return (
    <>
      <MetricsStrip />
      <section className="window-panel">
        <PanelHeader eyebrow="Mission Control" title="Active lanes" aside={<Link className="ghost-button" to="/agents">Open roster</Link>} />
        <div className="lane-grid">
          {missions.map((mission) => (
            <article key={mission.id} className="lane-window shell-panel">
              <div className="row-between">
                <span className="eyebrow">{mission.latestEvent?.happenedAt.slice(11, 16) ?? 'Live'}</span>
                <Badge tone={statusTone[mission.status as Status]}>{mission.status}</Badge>
              </div>
              <h3>{mission.name}</h3>
              <div className="progress-bar"><span className={statusTone[mission.status as Status]} style={{ width: `${mission.progress}%` }} /></div>
              <div className="meta-grid three-up">
                <span>{mission.progress}%</span>
                <span>{mission.agents.length} agents</span>
                <span>{mission.approvalsPending.length} approvals</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function AgentDesk({ agent }: { agent: Agent }) {
  const mission = demoData.missions.find((entry) => entry.id === agent.currentMissionId);
  const tone = agent.status === 'offline' ? 'offline' : agent.status === 'degraded' || agent.status === 'approvals' ? 'watch' : 'healthy';

  return (
    <article className="desk-card shell-panel">
      <div className="row-between">
        <div>
          <span className="eyebrow">{agent.owner}</span>
          <h3>{agent.name}</h3>
        </div>
        <Badge tone={tone}>{agent.status}</Badge>
      </div>
      <small>{mission?.name}</small>
      <div className="progress-bar compact"><span className={tone} style={{ width: `${agent.throughput}%` }} /></div>
      <div className="meta-grid three-up">
        <span>{agent.role}</span>
        <span>{agent.backlog} backlog</span>
        <span>{agent.lastHeartbeatMinutesAgo}m</span>
      </div>
    </article>
  );
}

function AgentsScene() {
  return (
    <section className="window-panel">
      <PanelHeader eyebrow="Agents" title="Operator desks" aside={<Badge tone="healthy">{demoData.agents.length} online roster</Badge>} />
      <div className="desk-grid">
        {demoData.agents.map((agent) => <AgentDesk key={agent.id} agent={agent} />)}
      </div>
    </section>
  );
}

function EntitiesScene() {
  return (
    <section className="window-panel">
      <PanelHeader eyebrow="Company" title="Spatial graph" aside={<Badge tone="healthy">{demoData.entities.length} nodes</Badge>} />
      <div className="entity-grid">
        {demoData.entities.map((entity) => (
          <article key={entity.id} className={`entity-card shell-panel ${statusTone[entity.status]}`}>
            <span className="eyebrow">{entity.kind}</span>
            <h3>{entity.name}</h3>
            <div className="meta-grid two-up">
              <span>{entity.region}</span>
              <span>{entity.owner}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductCard({ initiative }: { initiative: ProductInitiative }) {
  const mission = demoData.missions.find((entry) => entry.id === initiative.linkedMissionId);

  return (
    <article className="product-card shell-panel">
      <div className="row-between">
        <div>
          <span className="eyebrow">{initiative.stage}</span>
          <h3>{initiative.name}</h3>
        </div>
        <Badge tone={statusTone[initiative.status]}>{initiative.status}</Badge>
      </div>
      <small>{initiative.revenueModel}</small>
      <div className="meta-grid two-up">
        <span>Owner {initiative.owner}</span>
        <span>Mission {mission?.name}</span>
      </div>
    </article>
  );
}

function InitiativesScene() {
  return (
    <section className="window-panel">
      <PanelHeader eyebrow="Products" title="Product stack" aside={<Badge tone="watch">{demoData.initiatives.length} active bets</Badge>} />
      <div className="product-grid">
        {demoData.initiatives.map((initiative) => <ProductCard key={initiative.id} initiative={initiative} />)}
      </div>
    </section>
  );
}

function InspectorPanel() {
  const location = useLocation();
  const runtime = summarizeRuntime(getDemoRuntimeSnapshot());

  if (location.pathname === '/mission-control') {
    return (
      <aside className="inspector shell-panel">
        <div className="panel-header tight"><div><span className="eyebrow">Inspector</span><h2>Approvals</h2></div></div>
        <div className="stack-list">
          {demoData.approvals.map((approval) => (
            <div key={approval.id} className="inspector-item shell-card">
              <div>
                <strong>{approval.title}</strong>
                <small>{approval.requestedAt.slice(11, 16)}</small>
              </div>
              <Badge tone={riskTone[approval.risk]}>{approval.risk}</Badge>
            </div>
          ))}
        </div>
        <small>{runtime.approvalsPending} pending decisions</small>
      </aside>
    );
  }

  if (location.pathname === '/agents') {
    return (
      <aside className="inspector shell-panel">
        <div className="panel-header tight"><div><span className="eyebrow">Inspector</span><h2>Skills</h2></div></div>
        <div className="stack-list">
          {demoData.agents.map((agent) => (
            <div key={agent.id} className="inspector-item shell-card stackish">
              <strong>{agent.name}</strong>
              <small>{agent.skills.join(' · ')}</small>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  if (location.pathname === '/entities') {
    return (
      <aside className="inspector shell-panel">
        <div className="panel-header tight"><div><span className="eyebrow">Inspector</span><h2>Regions</h2></div></div>
        <div className="stack-list">
          {demoData.entities.map((entity) => (
            <div key={entity.id} className="inspector-item shell-card stackish">
              <strong>{entity.name}</strong>
              <small>{entity.region}</small>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  if (location.pathname === '/initiatives') {
    return (
      <aside className="inspector shell-panel">
        <div className="panel-header tight"><div><span className="eyebrow">Inspector</span><h2>Owners</h2></div></div>
        <div className="stack-list">
          {demoData.initiatives.map((initiative) => (
            <div key={initiative.id} className="inspector-item shell-card stackish">
              <strong>{initiative.name}</strong>
              <small>{initiative.owner}</small>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="inspector shell-panel">
      <div className="panel-header tight"><div><span className="eyebrow">Inspector</span><h2>Now</h2></div></div>
      <div className="stack-list">
        {demoData.timeline.slice(0, 4).map((event) => (
          <div key={event.id} className="inspector-item shell-card stackish">
            <strong>{event.title}</strong>
            <small>{event.detail}</small>
          </div>
        ))}
      </div>
      <small>{demoData.workspace.region}</small>
    </aside>
  );
}

function ActivityDock() {
  return (
    <section className="activity-dock shell-panel">
      {demoData.timeline.map((event) => (
        <article key={event.id} className="dock-card shell-card">
          <span className="eyebrow">{event.type}</span>
          <strong>{event.title}</strong>
          <small>{event.happenedAt.slice(11, 16)}</small>
        </article>
      ))}
    </section>
  );
}

function HomeScene() {
  return (
    <>
      <MetricsStrip />
      <TwinCanvas />
    </>
  );
}

function DesktopShell() {
  const location = useLocation();
  const title = useMemo(() => nav.find(([path]) => path === location.pathname)?.[1] ?? 'Workspace', [location.pathname]);

  return (
    <div className="desktop-shell">
      <SystemBar />
      <div className="desktop-grid">
        <SideRail />
        <main className="desktop-main">
          <section className="main-shell shell-panel">
            <div className="main-shell-top">
              <div>
                <span className="eyebrow">Active app</span>
                <strong>{title}</strong>
              </div>
              <div className="window-tabs">
                <span className="tab active">Workspace</span>
                <span className="tab">Twin</span>
                <span className="tab">Signals</span>
              </div>
            </div>
            <Routes>
              <Route path="/" element={<HomeScene />} />
              <Route path="/mission-control" element={<MissionControlScene />} />
              <Route path="/agents" element={<AgentsScene />} />
              <Route path="/entities" element={<EntitiesScene />} />
              <Route path="/initiatives" element={<InitiativesScene />} />
            </Routes>
          </section>
        </main>
        <InspectorPanel />
      </div>
      <ActivityDock />
    </div>
  );
}

export function App() {
  return <DesktopShell />;
}
