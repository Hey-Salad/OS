import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { zambiaProvinces, zambiaOfficeBlueprints } from './org/zambia.mjs';
import { departments, seniorityBands, capabilityClusters, roleFor, firstNames, lastNames } from './org/workforce-config.mjs';

const workforceTarget = Number(process.argv[2] ?? 1000);
const target = Number.isFinite(workforceTarget) && workforceTarget >= 300 ? Math.floor(workforceTarget) : 1000;
const now = new Date().toISOString();

const countriesPath = resolve(process.cwd(), 'apps/api/seeds/countries.global.seed.json');
const countries = JSON.parse(readFileSync(countriesPath, 'utf8'));

const sqlText = buildEnterpriseSeedSql(countries, { now, workforceTarget: target });
const outPath = resolve(process.cwd(), 'apps/api/scripts/generated-enterprise-seed.sql');
writeFileSync(outPath, sqlText, 'utf8');

console.log(`Generated ${outPath} for target workforce ${target}`);

function buildEnterpriseSeedSql(countryRows, opts) {
  const { now: ts, workforceTarget: headcountTarget } = opts;

  const random = createRng(912887);
  const randomInt = (min, max) => Math.floor(random() * (max - min + 1)) + min;

  const worldRegionId = 'region-world';
  const africaRegionId = 'region-africa';

  const allCountries = countryRows
    .map((c) => ({
      id: `country-${c.iso2.toLowerCase()}`,
      iso2: c.iso2,
      iso3: c.iso3 ?? null,
      name: c.name,
      continent: c.continent || 'Other',
      subregion: c.subregion ?? null,
      capital: c.capital ?? null,
      lat: numberOrNull(c.lat),
      lng: numberOrNull(c.lng),
      currency_code: c.currency_code ?? null,
      timezone_primary: c.timezone_primary ?? null
    }))
    .filter((c) => c.iso2 && c.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  const africaCountries = allCountries.filter((c) => c.continent === 'Africa');
  const zambia = allCountries.find((c) => c.iso2 === 'ZM');
  if (!zambia) {
    throw new Error('Zambia (ZM) must be present in countries.global.seed.json');
  }

  const provinceRows = zambiaProvinces.map((p) => ({
    id: `province-zm-${slug(p.name)}`,
    country_id: zambia.id,
    code: p.code,
    name: p.name,
    province_type: 'province'
  }));

  const cityRows = [];
  for (const province of zambiaProvinces) {
    const provinceId = `province-zm-${slug(province.name)}`;
    for (const city of province.cities) {
      cityRows.push({
        id: `city-zm-${slug(city.name)}`,
        country_id: zambia.id,
        province_id: provinceId,
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        timezone: 'Africa/Lusaka',
        population: null,
        is_capital: city.name === 'Lusaka' ? 1 : 0
      });
    }
  }

  const countryCapitalCityRows = allCountries
    .filter((c) => c.iso2 !== 'ZM')
    .map((c) => ({
      id: `city-${c.iso2.toLowerCase()}-${slug(c.capital || c.name)}`,
      country_id: c.id,
      province_id: null,
      name: c.capital || `${c.name} Capital`,
      lat: c.lat,
      lng: c.lng,
      timezone: c.timezone_primary,
      population: null,
      is_capital: 1
    }));

  const cityById = new Map([...cityRows, ...countryCapitalCityRows].map((city) => [city.id, city]));

  const legalEntities = allCountries.map((c) => ({
    id: `entity-${c.iso2.toLowerCase()}`,
    country_id: c.id,
    name: `HeySalad ${c.name} Ltd`,
    entity_type: 'limited_company',
    registration_number: `${c.iso2}-HS-${randomInt(1000, 9999)}`,
    tax_id: `${c.iso2}${randomInt(100000, 999999)}`,
    active: 1
  }));

  const offices = [];

  for (const blueprint of zambiaOfficeBlueprints) {
    const city = cityRows.find((c) => c.name === blueprint.cityName);
    const province = provinceRows.find((p) => p.code === blueprint.provinceCode);
    if (!city || !province) continue;
    offices.push({
      id: `office-zm-${slug(blueprint.officeName)}`,
      name: blueprint.officeName,
      city: city.name,
      country: 'Zambia',
      country_code: 'ZM',
      flag: '🇿🇲',
      lat: city.lat,
      lng: city.lng,
      office_type: blueprint.officeType,
      provider: null,
      region_code: 'africa',
      active: 1,
      country_id: zambia.id,
      city_id: city.id,
      province_id: province.id,
      region_id: africaRegionId,
      legal_entity_id: 'entity-zm',
      capacity: 120,
      metadata_json: JSON.stringify({ tier: blueprint.officeType, expansion: 'zambia-multi-city' })
    });
  }

  for (const c of africaCountries) {
    if (c.iso2 === 'ZM') continue;
    const cityId = `city-${c.iso2.toLowerCase()}-${slug(c.capital || c.name)}`;
    const city = cityById.get(cityId);
    offices.push({
      id: `office-${c.iso2.toLowerCase()}-${slug(c.capital || c.name)}`,
      name: `${c.name} National Office`,
      city: city?.name ?? c.name,
      country: c.name,
      country_code: c.iso2,
      flag: flagFromIso2(c.iso2),
      lat: city?.lat ?? c.lat,
      lng: city?.lng ?? c.lng,
      office_type: 'national',
      provider: null,
      region_code: 'africa',
      active: 1,
      country_id: c.id,
      city_id: city?.id ?? null,
      province_id: null,
      region_id: africaRegionId,
      legal_entity_id: `entity-${c.iso2.toLowerCase()}`,
      capacity: 40,
      metadata_json: JSON.stringify({ expansion: 'africa-country-presence' })
    });
  }

  for (const c of allCountries) {
    if (africaCountries.some((a) => a.iso2 === c.iso2)) continue;
    const cityId = `city-${c.iso2.toLowerCase()}-${slug(c.capital || c.name)}`;
    const city = cityById.get(cityId);
    offices.push({
      id: `office-${c.iso2.toLowerCase()}-${slug(c.capital || c.name)}`,
      name: `${c.name} Global Office`,
      city: city?.name ?? c.name,
      country: c.name,
      country_code: c.iso2,
      flag: flagFromIso2(c.iso2),
      lat: city?.lat ?? c.lat,
      lng: city?.lng ?? c.lng,
      office_type: 'global',
      provider: null,
      region_code: 'global',
      active: 1,
      country_id: c.id,
      city_id: city?.id ?? null,
      province_id: null,
      region_id: worldRegionId,
      legal_entity_id: `entity-${c.iso2.toLowerCase()}`,
      capacity: 25,
      metadata_json: JSON.stringify({ expansion: 'global-country-presence' })
    });
  }

  const departmentRows = departments.map((dept) => ({
    id: `dept-${dept.code}`,
    code: dept.code,
    name: dept.name,
    parent_department_id: null,
    active: 1
  }));

  const capabilityClusterRows = capabilityClusters.map((cluster) => ({
    id: `cluster-${cluster.code}`,
    code: cluster.code,
    name: cluster.name,
    description: `${cluster.name} capability cluster`
  }));

  const capabilityRows = capabilityClusters.flatMap((cluster) =>
    cluster.capabilities.map((capability) => ({
      id: `cap-${cluster.code}-${slug(capability)}`,
      cluster_id: `cluster-${cluster.code}`,
      code: `${cluster.code}_${slug(capability)}`,
      name: capability,
      description: `${capability} capability`
    }))
  );

  const officeHeadcounts = allocateHeadcount(offices, headcountTarget, randomInt);

  const agents = [];
  const employees = [];
  const reportingLines = [];
  const agentCapabilities = [];
  const teams = [];

  let personCounter = 0;
  let globalExecId = null;

  for (const office of offices) {
    const officeCount = officeHeadcounts.get(office.id) ?? 0;
    if (officeCount <= 0) continue;

    const departmentAlloc = allocateByWeights(departments, officeCount, randomInt);

    for (const [deptCode, deptCount] of departmentAlloc.entries()) {
      if (deptCount <= 0) continue;

      const teamId = `team-${office.id}-${deptCode}`;
      teams.push({
        id: teamId,
        department_id: `dept-${deptCode}`,
        office_id: office.id,
        name: `${office.city} ${departments.find((d) => d.code === deptCode)?.name ?? deptCode}`,
        purpose: 'Autonomous operating team',
        active: 1
      });

      for (let i = 0; i < deptCount; i += 1) {
        personCounter += 1;

        const seniority = pickWeighted(seniorityBands, randomInt);
        const firstName = firstNames[randomInt(0, firstNames.length - 1)];
        const lastName = `${lastNames[randomInt(0, lastNames.length - 1)]}${personCounter > 1200 ? personCounter % 37 : ''}`;
        const fullName = `${firstName} ${lastName}`;
        const employeeId = `EMP-${String(personCounter).padStart(5, '0')}`;
        const agentId = `agent-${employeeId.toLowerCase()}`;

        const capabilityCluster = capabilityClusterRows[randomInt(0, capabilityClusterRows.length - 1)];
        const relevantCapabilities = capabilityRows.filter((cap) => cap.cluster_id === capabilityCluster.id);
        const skills = relevantCapabilities.slice(0, Math.min(3, relevantCapabilities.length)).map((cap) => cap.name);

        const role = roleFor(deptCode, seniority, randomInt);

        const employee = {
          id: employeeId,
          name: fullName,
          title: role,
          team_id: teamId,
          office_id: office.id,
          status: randomStatus(randomInt),
          model_provider: 'openai',
          model_name: 'gpt-5-mini',
          budget_daily_usd: seniorityBudget(seniority, 'daily'),
          budget_monthly_usd: seniorityBudget(seniority, 'monthly'),
          persona_json: JSON.stringify({ office: office.name, department: deptCode, seniority }),
          capabilities_json: JSON.stringify(skills),
          active: 1,
          runtime_agent_id: agentId,
          department_id: `dept-${deptCode}`,
          seniority_band: seniority,
          reports_to_employee_id: null,
          country_id: office.country_id,
          city_id: office.city_id
        };

        employees.push(employee);

        const agent = {
          id: agentId,
          name: fullName,
          role,
          owner: 'HeySalad OS',
          status: runtimeStatusFromEmployeeStatus(employee.status, randomInt),
          mission_id: `mission-${office.country_code.toLowerCase()}`,
          current_session_id: null,
          skills_json: JSON.stringify(skills),
          throughput: randomInt(38, 96),
          backlog: randomInt(0, 9),
          last_heartbeat_at: ts,
          source: 'enterprise-seed',
          metadata_json: JSON.stringify({
            employeeId,
            department: departmentRows.find((d) => d.id === employee.department_id)?.name,
            seniority,
            office: office.name,
            city: office.city,
            country: office.country,
            countryCode: office.country_code,
            reportsTo: null,
            type: 'employee-agent'
          }),
          employee_id: employeeId,
          office_id: office.id,
          country_id: office.country_id,
          city_id: office.city_id,
          department_id: employee.department_id,
          team_id: teamId,
          seniority_band: seniority,
          reports_to_agent_id: null,
          capability_cluster_id: capabilityCluster.id,
          legal_entity_id: office.legal_entity_id,
          active_flag: 1,
          budget_daily_limit_usd: employee.budget_daily_usd,
          budget_monthly_limit_usd: employee.budget_monthly_usd
        };

        agents.push(agent);

        if (!globalExecId && seniority === 'C-Level') {
          globalExecId = agentId;
        }

        for (const capability of relevantCapabilities.slice(0, 2 + randomInt(0, 1))) {
          agentCapabilities.push({
            id: `agcap-${agentId}-${capability.id}`,
            agent_id: agentId,
            capability_id: capability.id,
            level: randomInt(2, 5)
          });
        }
      }
    }
  }

  if (!globalExecId && agents[0]) {
    globalExecId = agents[0].id;
    agents[0].seniority_band = 'C-Level';
    agents[0].role = 'Global Chief Operations Agent';
    employees.find((e) => e.id === agents[0].employee_id).seniority_band = 'C-Level';
    employees.find((e) => e.id === agents[0].employee_id).title = agents[0].role;
  }

  const rank = ['C-Level', 'VP', 'Director', 'Manager', 'Lead', 'Senior', 'Mid', 'Junior'];

  for (const agent of agents) {
    if (agent.id === globalExecId) continue;

    const sameTeamManagers = agents
      .filter((candidate) =>
        candidate.team_id === agent.team_id &&
        rank.indexOf(candidate.seniority_band) < rank.indexOf(agent.seniority_band)
      )
      .sort((a, b) => rank.indexOf(a.seniority_band) - rank.indexOf(b.seniority_band));

    const sameOfficeManagers = agents
      .filter((candidate) =>
        candidate.office_id === agent.office_id &&
        rank.indexOf(candidate.seniority_band) < rank.indexOf(agent.seniority_band)
      )
      .sort((a, b) => rank.indexOf(a.seniority_band) - rank.indexOf(b.seniority_band));

    const manager = sameTeamManagers[0] ?? sameOfficeManagers[0] ?? agents.find((candidate) => candidate.id === globalExecId) ?? null;

    if (manager) {
      agent.reports_to_agent_id = manager.id;
      const employee = employees.find((e) => e.runtime_agent_id === agent.id);
      if (employee) {
        employee.reports_to_employee_id = manager.employee_id;
      }
      reportingLines.push({
        id: `report-${agent.id}`,
        agent_id: agent.id,
        manager_agent_id: manager.id,
        relationship_type: 'direct',
        active: 1
      });

      const metadata = JSON.parse(agent.metadata_json);
      metadata.reportsTo = manager.id;
      agent.metadata_json = JSON.stringify(metadata);
    }
  }

  const missionRows = offices
    .map((office) => ({
      id: `mission-${office.country_code.toLowerCase()}`,
      name: `${office.country} Growth Mission`,
      objective: `Operate ${office.country} office network and deliver regional execution KPIs.`,
      status: 'healthy',
      operator_name: 'HeySalad OS',
      progress: randomInt(22, 91),
      metadata_json: JSON.stringify({ officeId: office.id, country: office.country, track: office.region_code }),
      business_unit_id: office.region_id === africaRegionId ? 'bu-africa' : 'bu-global',
      region_id: office.region_id,
      department_id: null,
      budget_id: `budget-mission-${office.country_code.toLowerCase()}`,
      queue_id: `queue-${office.id}`
    }))
    .filter((mission, idx, arr) => arr.findIndex((m) => m.id === mission.id) === idx);

  const budgetRows = [
    {
      id: 'budget-global-operations',
      name: 'Global Operations Budget',
      scope_type: 'global',
      scope_id: 'heysalad-os',
      period_start: `${new Date().getUTCFullYear()}-01-01`,
      period_end: `${new Date().getUTCFullYear()}-12-31`,
      currency: 'USD',
      amount_total: headcountTarget * 3200,
      amount_committed: headcountTarget * 2100,
      amount_spent: headcountTarget * 1700,
      status: 'active'
    },
    ...missionRows.map((mission) => ({
      id: `budget-mission-${mission.id.replace('mission-', '')}`,
      name: `${mission.name} Budget`,
      scope_type: 'mission',
      scope_id: mission.id,
      period_start: `${new Date().getUTCFullYear()}-01-01`,
      period_end: `${new Date().getUTCFullYear()}-12-31`,
      currency: 'USD',
      amount_total: randomInt(120000, 820000),
      amount_committed: randomInt(80000, 400000),
      amount_spent: randomInt(40000, 280000),
      status: 'active'
    }))
  ];

  const queueRows = offices.map((office) => ({
    id: `queue-${office.id}`,
    name: `${office.city} Priority Queue`,
    queue_type: 'office',
    mission_id: `mission-${office.country_code.toLowerCase()}`,
    department_id: null,
    office_id: office.id,
    priority: randomInt(30, 90),
    status: 'active',
    metadata_json: JSON.stringify({ country: office.country })
  }));

  const workflowRows = queueRows.slice(0, Math.min(80, queueRows.length)).map((queue) => ({
    id: `workflow-${queue.id}`,
    mission_id: queue.mission_id,
    queue_id: queue.id,
    owner_agent_id: agents[randomInt(0, agents.length - 1)]?.id ?? null,
    name: `${queue.name} Daily Orchestration`,
    status: randomInt(0, 10) > 7 ? 'attention' : 'running',
    progress: randomInt(8, 96),
    metadata_json: JSON.stringify({ automation: true })
  }));

  const runtimeTasks = [];
  for (const queue of queueRows.slice(0, Math.min(120, queueRows.length))) {
    const taskCount = randomInt(2, 6);
    for (let i = 0; i < taskCount; i += 1) {
      runtimeTasks.push({
        id: `rtask-${queue.id}-${i + 1}`,
        queue_id: queue.id,
        mission_id: queue.mission_id,
        assigned_agent_id: agents[randomInt(0, agents.length - 1)]?.id ?? null,
        title: `Work item ${i + 1} for ${queue.name}`,
        state: ['queued', 'running', 'blocked'][randomInt(0, 2)],
        priority: randomInt(1, 100),
        escalation_level: randomInt(0, 2),
        payload_json: JSON.stringify({ slaMinutes: randomInt(30, 360) })
      });
    }
  }

  const sessionRows = agents.slice(0, Math.min(900, agents.length)).map((agent, idx) => ({
    id: `session-${agent.id}`,
    agent_id: agent.id,
    title: `Session ${idx + 1}`,
    state: ['running', 'queued', 'attention', 'completed'][randomInt(0, 3)],
    channel: ['ops', 'sales', 'finance', 'engineering'][randomInt(0, 3)],
    peer_label: agent.name,
    started_at: ts,
    queue_id: `queue-${agent.office_id}`,
    workload_score: randomInt(10, 100),
    metadata_json: JSON.stringify({ country: agent.country_id })
  }));

  const approvalPolicies = [
    {
      id: 'policy-budget-high-risk',
      name: 'High-risk budget change policy',
      scope_type: 'budget',
      scope_id: null,
      risk_level: 'high',
      required_approver_seniority: 'Director',
      metadata_json: JSON.stringify({ thresholdUsd: 50000 }),
      active: 1
    },
    {
      id: 'policy-mission-escalation',
      name: 'Mission escalation policy',
      scope_type: 'mission',
      scope_id: null,
      risk_level: 'medium',
      required_approver_seniority: 'Manager',
      metadata_json: JSON.stringify({ escalationLevel: 2 }),
      active: 1
    }
  ];

  const approvalRows = missionRows.slice(0, Math.min(160, missionRows.length)).map((mission, idx) => {
    const agent = agents[randomInt(0, agents.length - 1)] ?? null;
    const pending = randomInt(0, 10) > 6;
    return {
      id: `approval-${idx + 1}`,
      mission_id: mission.id,
      agent_id: agent?.id ?? null,
      title: `${mission.name} approval ${idx + 1}`,
      summary: 'Approval required for cross-functional routing and budget release.',
      risk: ['low', 'medium', 'high'][randomInt(0, 2)],
      status: pending ? 'pending' : ['approved', 'rejected'][randomInt(0, 1)],
      requested_at: ts,
      decided_at: pending ? null : ts,
      decision_source: pending ? null : 'operator',
      decision_note: pending ? null : 'seeded decision',
      external_ref: null,
      metadata_json: JSON.stringify({ mission: mission.id }),
      policy_id: randomInt(0, 10) > 4 ? 'policy-mission-escalation' : 'policy-budget-high-risk',
      required_seniority: randomInt(0, 10) > 6 ? 'Director' : 'Manager',
      escalated_to_agent_id: pending ? globalExecId : null
    };
  });

  const activityRows = approvalRows.slice(0, 300).map((approval, idx) => ({
    id: `event-${idx + 1}`,
    mission_id: approval.mission_id,
    agent_id: approval.agent_id,
    session_id: sessionRows[idx % Math.max(1, sessionRows.length)]?.id ?? null,
    approval_id: approval.id,
    event_type: approval.status === 'pending' ? 'approval_requested' : 'approval_decision',
    title: approval.title,
    detail: approval.summary,
    happened_at: ts,
    source: 'enterprise-seed',
    metadata_json: JSON.stringify({ status: approval.status })
  }));

  const auditRows = [
    {
      id: 'audit-seed-start',
      actor_type: 'system',
      actor_id: 'seed-engine',
      event_type: 'seed_started',
      scope_type: 'deployment',
      scope_id: 'enterprise-v1',
      severity: 'info',
      payload_json: JSON.stringify({ workforceTarget: headcountTarget }),
      created_at: ts
    },
    {
      id: 'audit-seed-complete',
      actor_type: 'system',
      actor_id: 'seed-engine',
      event_type: 'seed_completed',
      scope_type: 'deployment',
      scope_id: 'enterprise-v1',
      severity: 'info',
      payload_json: JSON.stringify({ offices: offices.length, agents: agents.length }),
      created_at: ts
    }
  ];

  const staffingPlan = {
    id: 'staffing-plan-global-v1',
    name: 'Global Workforce Plan V1',
    horizon: '2026',
    status: 'active',
    effective_from: `${new Date().getUTCFullYear()}-01-01`,
    effective_to: `${new Date().getUTCFullYear()}-12-31`,
    metadata_json: JSON.stringify({ workforceTarget: headcountTarget })
  };

  const staffingLines = offices.map((office) => {
    const count = officeHeadcounts.get(office.id) ?? 0;
    return {
      id: `staff-${office.id}`,
      staffing_plan_id: staffingPlan.id,
      office_id: office.id,
      country_id: office.country_id,
      department_id: null,
      seniority_band: null,
      planned_headcount: count,
      active_headcount: Math.max(0, Math.floor(count * 0.82))
    };
  });

  const businessUnits = [
    {
      id: 'bu-africa',
      name: 'Africa Business Unit',
      region_id: africaRegionId,
      lead_agent_id: globalExecId,
      status: 'active'
    },
    {
      id: 'bu-global',
      name: 'Global Business Unit',
      region_id: worldRegionId,
      lead_agent_id: globalExecId,
      status: 'active'
    }
  ];

  const budgetAllocations = departments.map((dept) => ({
    id: `alloc-${dept.code}`,
    budget_id: 'budget-global-operations',
    department_id: `dept-${dept.code}`,
    office_id: null,
    mission_id: null,
    amount_allocated: Math.round((dept.weight / sum(departments.map((d) => d.weight))) * (headcountTarget * 3200)),
    amount_spent: Math.round((dept.weight / sum(departments.map((d) => d.weight))) * (headcountTarget * 1700)),
    metadata_json: JSON.stringify({ weight: dept.weight })
  }));

  const sql = [];
  sql.push('PRAGMA foreign_keys = OFF;');
  sql.push('BEGIN TRANSACTION;');

  const truncateOrder = [
    'audit_events',
    'activity_events',
    'approval_decision_queue',
    'runtime_approvals',
    'runtime_workflow_steps',
    'runtime_workflows',
    'runtime_tasks',
    'runtime_sessions',
    'runtime_queues',
    'runtime_agents',
    'org_reporting_lines',
    'org_agent_capabilities',
    'employees',
    'org_teams',
    'missions',
    'org_budget_allocations',
    'org_budgets',
    'org_staffing_plan_lines',
    'org_staffing_plans',
    'approval_policies',
    'org_regional_business_units',
    'org_capabilities',
    'org_capability_clusters',
    'org_departments',
    'offices',
    'org_legal_entities',
    'org_cities',
    'org_provinces',
    'org_regions',
    'org_countries',
    'runtime_sync_log'
  ];

  for (const table of truncateOrder) {
    sql.push(`DELETE FROM ${table};`);
  }

  insertRows(sql, 'org_regions', [
    { id: worldRegionId, code: 'WORLD', name: 'World', region_type: 'global', parent_region_id: null },
    { id: africaRegionId, code: 'AFRICA', name: 'Africa', region_type: 'continent', parent_region_id: worldRegionId }
  ], ts);

  insertRows(sql, 'org_countries', allCountries, ts);
  insertRows(sql, 'org_provinces', provinceRows, ts);
  insertRows(sql, 'org_cities', [...cityRows, ...countryCapitalCityRows], ts);
  insertRows(sql, 'org_legal_entities', legalEntities, ts);

  insertRows(sql, 'offices', offices, ts);
  insertRows(sql, 'org_departments', departmentRows, ts);
  insertRows(sql, 'org_capability_clusters', capabilityClusterRows, ts);
  insertRows(sql, 'org_capabilities', capabilityRows, ts);
  insertRows(sql, 'org_staffing_plans', [staffingPlan], ts);
  insertRows(sql, 'org_staffing_plan_lines', staffingLines, ts);
  insertRows(sql, 'org_regional_business_units', businessUnits, ts);
  insertRows(sql, 'org_budgets', budgetRows, ts);
  insertRows(sql, 'org_budget_allocations', budgetAllocations, ts);
  insertRows(sql, 'approval_policies', approvalPolicies, ts);

  insertRows(sql, 'missions', missionRows, ts);
  insertRows(sql, 'org_teams', teams, ts);
  insertRows(sql, 'employees', employees, ts);
  insertRows(sql, 'runtime_agents', agents, ts);
  insertRows(sql, 'org_agent_capabilities', agentCapabilities, ts);
  insertRows(sql, 'org_reporting_lines', reportingLines, ts);

  insertRows(sql, 'runtime_queues', queueRows, ts);
  insertRows(sql, 'runtime_tasks', runtimeTasks, ts);
  insertRows(sql, 'runtime_workflows', workflowRows, ts);

  const workflowSteps = workflowRows.flatMap((workflow) =>
    ['intake', 'triage', 'execution', 'qa', 'closeout'].map((stepKey, index) => ({
      id: `step-${workflow.id}-${stepKey}`,
      workflow_id: workflow.id,
      step_key: stepKey,
      assigned_agent_id: agents[(index + randomInt(0, agents.length - 1)) % agents.length]?.id ?? null,
      state: index < 2 ? 'completed' : index === 2 ? 'running' : 'pending',
      started_at: ts,
      finished_at: index < 2 ? ts : null,
      metadata_json: JSON.stringify({ order: index + 1 })
    }))
  );
  insertRows(sql, 'runtime_workflow_steps', workflowSteps, ts);

  insertRows(sql, 'runtime_sessions', sessionRows, ts);
  insertRows(sql, 'runtime_approvals', approvalRows, ts);
  insertRows(sql, 'activity_events', activityRows, ts, ['happened_at']);
  insertRows(sql, 'audit_events', auditRows, ts, ['created_at']);

  insertRows(sql, 'runtime_sync_log', [
    {
      id: 'sync-enterprise-seed',
      source: 'enterprise-seed',
      agent_count: agents.length,
      session_count: sessionRows.length,
      approval_count: approvalRows.length,
      activity_count: activityRows.length,
      happened_at: ts,
      metadata_json: JSON.stringify({ offices: offices.length, countries: allCountries.length, africaCountries: africaCountries.length, workforceTarget: headcountTarget })
    }
  ], ts, ['happened_at']);

  sql.push('COMMIT;');
  sql.push('PRAGMA foreign_keys = ON;');

  return `${sql.join('\n')}\n`;
}

function insertRows(lines, tableName, rows, nowIso, explicitTimestamps = []) {
  if (!rows.length) return;
  const skipAutoTimestamps = new Set(explicitTimestamps);

  for (const rawRow of rows) {
    const row = { ...rawRow };
    if (!('created_at' in row) && !skipAutoTimestamps.has('created_at')) row.created_at = nowIso;
    if (!('updated_at' in row) && !skipAutoTimestamps.has('updated_at')) row.updated_at = nowIso;

    const keys = Object.keys(row);
    const values = keys.map((key) => toSqlValue(row[key]));
    lines.push(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${values.join(', ')});`);
  }
}

function toSqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function allocateHeadcount(offices, target, randomInt) {
  const map = new Map();
  const minPerOffice = target >= offices.length ? 1 : 0;
  let assigned = 0;

  for (const office of offices) {
    const base = minPerOffice + (office.country_code === 'ZM' ? 3 : 0);
    map.set(office.id, base);
    assigned += base;
  }

  const prioritized = offices
    .map((office) => {
      let weight = 1;
      if (office.country_code === 'ZM') weight += 8;
      if (office.region_code === 'africa') weight += 3;
      if (office.office_type === 'hq') weight += 4;
      return { office, weight };
    })
    .sort((a, b) => b.weight - a.weight);

  while (assigned < target) {
    const pick = prioritized[randomInt(0, Math.min(80, prioritized.length - 1))];
    map.set(pick.office.id, (map.get(pick.office.id) ?? 0) + 1);
    assigned += 1;
  }

  return map;
}

function allocateByWeights(weightedRows, total, randomInt) {
  const result = new Map(weightedRows.map((row) => [row.code, 0]));
  const weightSum = sum(weightedRows.map((row) => row.weight));

  for (const row of weightedRows) {
    const portion = Math.floor((row.weight / weightSum) * total);
    result.set(row.code, portion);
  }

  let assigned = sum(Array.from(result.values()));
  while (assigned < total) {
    const row = weightedRows[randomInt(0, weightedRows.length - 1)];
    result.set(row.code, (result.get(row.code) ?? 0) + 1);
    assigned += 1;
  }

  return result;
}

function pickWeighted(rows, randomInt) {
  const total = sum(rows.map((row) => row.weight));
  let cursor = randomInt(0, 100000) / 100000 * total;

  for (const row of rows) {
    cursor -= row.weight;
    if (cursor <= 0) return row.key;
  }

  return rows[rows.length - 1].key;
}

function runtimeStatusFromEmployeeStatus(status, randomInt) {
  if (status === 'active') return randomInt(0, 10) > 6 ? 'active' : 'idle';
  if (status === 'remote') return 'idle';
  if (status === 'on-leave') return 'offline';
  if (status === 'traveling') return 'degraded';
  return 'idle';
}

function randomStatus(randomInt) {
  const roll = randomInt(1, 100);
  if (roll <= 62) return 'active';
  if (roll <= 82) return 'remote';
  if (roll <= 93) return 'traveling';
  return 'on-leave';
}

function seniorityBudget(seniority, period) {
  const multipliers = {
    Junior: { daily: 7, monthly: 120 },
    Mid: { daily: 12, monthly: 260 },
    Senior: { daily: 20, monthly: 430 },
    Lead: { daily: 28, monthly: 620 },
    Manager: { daily: 35, monthly: 780 },
    Director: { daily: 50, monthly: 1200 },
    VP: { daily: 68, monthly: 1700 },
    'C-Level': { daily: 95, monthly: 2400 }
  };
  return multipliers[seniority]?.[period] ?? 18;
}

function flagFromIso2(iso2) {
  if (!iso2 || iso2.length !== 2) return '🏢';
  const codePoints = iso2.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sum(values) {
  return values.reduce((acc, value) => acc + value, 0);
}

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}
