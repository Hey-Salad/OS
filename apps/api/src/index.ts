import { Hono } from 'hono';
import { tracingMiddleware } from './lib/trace';
import { createFoundationRoutes } from './routes/foundation';
import { createRagRoutes } from './routes/rag';
import { createWorkflowRoutes } from './routes/workflows';
import { createRuntimeRoutes } from './routes/runtime';
import type { AppBindings, AppVariables } from './types';

const app = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

app.use('*', tracingMiddleware);

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'heysalad-os-api',
    phase: 'foundation'
  })
);

app.route('/', createFoundationRoutes());
app.route('/', createRuntimeRoutes());
app.route('/', createRagRoutes());
app.route('/', createWorkflowRoutes());

export default app;
