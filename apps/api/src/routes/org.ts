import { Hono } from 'hono';
import { withSpan } from '../lib/trace';
import { createOrgRepository } from '../lib/org';
import type { AppBindings, AppVariables } from '../types';

export function createOrgRoutes() {
  const app = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

  app.get('/api/org/summary', async (c) => {
    const repo = createOrgRepository(c.env?.DB);
    return c.json(await withSpan(c, 'org_summary', () => repo.getSummary()));
  });

  app.get('/api/org/offices', async (c) => {
    const repo = createOrgRepository(c.env?.DB);
    return c.json(
      await withSpan(c, 'org_offices', () =>
        repo.listOffices({
          country: c.req.query('country') || undefined,
          city: c.req.query('city') || undefined
        })
      )
    );
  });

  app.get('/api/org/workforce', async (c) => {
    const repo = createOrgRepository(c.env?.DB);
    const limit = Number(c.req.query('limit') ?? '1500');
    return c.json(
      await withSpan(c, 'org_workforce', () =>
        repo.listWorkforce({
          country: c.req.query('country') || undefined,
          city: c.req.query('city') || undefined,
          office: c.req.query('office') || undefined,
          department: c.req.query('department') || undefined,
          seniority: c.req.query('seniority') || undefined,
          status: c.req.query('status') || undefined,
          limit
        })
      )
    );
  });

  app.get('/api/org/filters', async (c) => {
    const repo = createOrgRepository(c.env?.DB);
    return c.json(await withSpan(c, 'org_filters', () => repo.listFilterOptions()));
  });

  app.get('/api/org/runtime-ops', async (c) => {
    const repo = createOrgRepository(c.env?.DB);
    const limit = Math.min(1000, Math.max(10, Number(c.req.query('limit') ?? '120')));
    return c.json(await withSpan(c, 'org_runtime_ops', () => repo.getRuntimeOpsSnapshot(limit)));
  });

  return app;
}
