import type { Context, MiddlewareHandler } from 'hono';
import { createId, nowIso } from './ids';
import type { AppBindings, AppVariables, TraceContext, TraceEnvelope, TraceEvent, UsageMetric } from '../types';

export const tracingMiddleware: MiddlewareHandler<{
  Bindings: AppBindings;
  Variables: AppVariables;
}> = async (c, next) => {
  const workflowName = resolveWorkflowName(c);
  const trace: TraceContext = {
    traceId: createId('trace'),
    workflowName,
    startedAt: nowIso(),
    attributes: {
      'http.method': c.req.method,
      'http.path': new URL(c.req.url).pathname,
      'workflow.name': workflowName
    }
  };

  c.set('trace', trace);
  c.set('traceEvents', []);
  c.set('usageMetrics', []);

  await next();

  await flushTrace(c);
};

export async function withSpan<T>(
  c: Context<{ Bindings: AppBindings; Variables: AppVariables }>,
  name: string,
  run: () => Promise<T>,
  attributes?: TraceEvent['attributes']
): Promise<T> {
  const span: TraceEvent = { name, startedAt: nowIso(), attributes, status: 'ok' };
  c.var.traceEvents.push(span);

  try {
    const result = await run();
    span.endedAt = nowIso();
    return result;
  } catch (error) {
    span.endedAt = nowIso();
    span.status = 'error';
    span.error = error instanceof Error ? error.message : String(error);
    throw error;
  }
}

export function attachTraceAttributes(
  c: Context<{ Bindings: AppBindings; Variables: AppVariables }>,
  attributes: Record<string, string | number | boolean | null | undefined>
): void {
  Object.assign(c.var.trace.attributes, attributes);
}

export function recordUsageMetric(
  c: Context<{ Bindings: AppBindings; Variables: AppVariables }>,
  metric: UsageMetric
): void {
  c.var.usageMetrics.push(metric);
}

async function flushTrace(c: Context<{ Bindings: AppBindings; Variables: AppVariables }>): Promise<void> {
  const started = Date.parse(c.var.trace.startedAt);
  const finishedAt = nowIso();
  const envelope: TraceEnvelope = {
    trace: c.var.trace,
    spans: c.var.traceEvents,
    usage: c.var.usageMetrics,
    finishedAt,
    durationMs: Math.max(0, Date.parse(finishedAt) - started)
  };

  c.header('x-heysalad-trace-id', envelope.trace.traceId);
  c.header('x-heysalad-workflow', envelope.trace.workflowName);
  c.header('x-heysalad-trace-spans', String(envelope.spans.length));
  c.header('x-heysalad-usage-events', String(envelope.usage.length));

  const env = c.env ?? {};

  if (!env.ANYWAY_BASE_URL || !env.ANYWAY_API_KEY) {
    return;
  }

  try {
    await fetch(`${env.ANYWAY_BASE_URL.replace(/\/$/, '')}/traces`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.ANYWAY_API_KEY}`
      },
      body: JSON.stringify({
        dataset: env.ANYWAY_DATASET ?? 'heysalad-os',
        environment: env.ANYWAY_ENVIRONMENT ?? 'development',
        ...envelope
      })
    });
  } catch {
    // Observability should stay non-fatal.
  }
}

function resolveWorkflowName(c: Context): string {
  const pathname = new URL(c.req.url).pathname;
  if (pathname.startsWith('/api/rag/ingest')) return 'rag.ingest_document';
  if (pathname.startsWith('/api/rag/query')) return 'rag.query';
  if (pathname.includes('/execute')) return 'employee.execute_task';
  if (pathname.includes('/status')) return 'task.assign';
  return `http.${c.req.method.toLowerCase()}.${pathname.replace(/^\//, '').replace(/\//g, '.') || 'root'}`;
}
