import { Hono } from 'hono';
import type { Context } from 'hono';
import { attachTraceAttributes, withSpan } from '../lib/trace';
import type { AppBindings, AppVariables } from '../types';

export function createWorkflowRoutes() {
  const app = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

  app.post('/api/employees/:id/run', async (c) => {
    await withSpan(c, 'load_employee', async () => c.req.param('id'));
    attachTraceAttributes(c, {
      'workflow.name': 'employee.execute_task',
      'employee.id': c.req.param('id')
    });
    return notImplemented(c, 'Employee execution arrives in Phase 3 after bounded workflow orchestration is wired.');
  });

  app.post('/api/tasks/:id/execute', async (c) => {
    await withSpan(c, 'load_task', async () => c.req.param('id'));
    attachTraceAttributes(c, {
      'workflow.name': 'employee.execute_task',
      'task.id': c.req.param('id')
    });
    return notImplemented(c, 'Task execution arrives in Phase 3 after workflow_runs and task_events are active.');
  });

  app.post('/api/tasks/:id/status', async (c) => {
    const payload = await c.req.json().catch(() => ({}));
    await withSpan(c, 'update_task_status', async () => payload);
    attachTraceAttributes(c, {
      'workflow.name': 'task.assign',
      'task.id': c.req.param('id'),
      'kanban.status': typeof payload.status === 'string' ? payload.status : null
    });
    return notImplemented(c, 'Task status transitions will persist task_events in Phase 3.');
  });

  app.post('/api/workflows/run', async (c) => {
    const payload = await c.req.json().catch(() => ({}));
    await withSpan(c, 'assemble_workflow_request', async () => payload);
    attachTraceAttributes(c, {
      'workflow.name': typeof payload.workflow_name === 'string' ? payload.workflow_name : 'unknown'
    });
    return notImplemented(c, 'Generic workflow execution is reserved for Phase 3.');
  });

  return app;
}

function notImplemented(c: Context, message: string) {
  return c.json({ ok: false, status: 'not_implemented', message }, 501);
}
