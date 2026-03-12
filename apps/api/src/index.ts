import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { tracingMiddleware } from './lib/trace';
import { createFoundationRoutes } from './routes/foundation';
import { createRagRoutes } from './routes/rag';
import { createWorkflowRoutes } from './routes/workflows';
import { createRuntimeRoutes } from './routes/runtime';
import { createOrgRoutes } from './routes/org';
import type { AppBindings, AppVariables } from './types';

const app = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

const allowedOrigins = new Set([
  'https://cloud-os.heysalad.app',
  'https://api-cloud-os.heysalad.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

app.use(
  '*',
  cors({
    origin: (origin) => (origin && allowedOrigins.has(origin) ? origin : null),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
);
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
app.route('/', createOrgRoutes());
app.route('/', createRagRoutes());
app.route('/', createWorkflowRoutes());

export default app;
