import { Hono } from 'hono';
import { routeManifest } from '../manifest';
import { attachTraceAttributes, withSpan } from '../lib/trace';
import { createRepository } from '../lib/repository';
import type { AppBindings, AppVariables } from '../types';

export function createFoundationRoutes() {
  const app = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

  app.get('/api', (c) => {
    const env = c.env ?? {};

    attachTraceAttributes(c, {
      'resource.has_d1': Boolean(env.DB),
      'resource.has_r2': Boolean(env.DOCUMENTS_BUCKET),
      'resource.has_vectorize': Boolean(env.VECTOR_INDEX)
    });

    return c.json({
      service: 'heysalad-os-api',
      phase: 'foundation',
      routes: routeManifest,
      bindings: {
        d1: Boolean(env.DB),
        r2: Boolean(env.DOCUMENTS_BUCKET),
        vectorize: Boolean(env.VECTOR_INDEX),
        anyway: Boolean(env.ANYWAY_BASE_URL && env.ANYWAY_API_KEY)
      }
    });
  });

  app.get('/api/offices', async (c) => {
    const repo = createRepository(c.env?.DB);
    const offices = await withSpan(c, 'list_offices', () => repo.listOffices());
    return c.json(offices);
  });

  app.post('/api/offices', async (c) => {
    const payload = await c.req.json();
    const repo = createRepository(c.env?.DB);
    const office = await withSpan(c, 'create_office', () => repo.createOffice(payload), {
      'office.name': typeof payload.name === 'string' ? payload.name : 'Untitled office'
    });
    attachTraceAttributes(c, { 'office.id': office.id });
    return c.json(office, 201);
  });

  app.get('/api/employees', async (c) => {
    const repo = createRepository(c.env?.DB);
    const employees = await withSpan(c, 'list_employees', () => repo.listEmployees());
    return c.json(employees);
  });

  app.post('/api/employees', async (c) => {
    const payload = await c.req.json();
    const repo = createRepository(c.env?.DB);
    const employee = await withSpan(c, 'create_employee', () => repo.createEmployee(payload), {
      'employee.name': typeof payload.name === 'string' ? payload.name : 'Unnamed employee'
    });
    attachTraceAttributes(c, {
      'employee.id': employee.id,
      'employee.name': employee.name,
      'model.provider': employee.model_provider,
      'model.name': employee.model_name
    });
    return c.json(employee, 201);
  });

  app.get('/api/projects', async (c) => {
    const repo = createRepository(c.env?.DB);
    const projects = await withSpan(c, 'list_projects', () => repo.listProjects());
    return c.json(projects);
  });

  app.post('/api/projects', async (c) => {
    const payload = await c.req.json();
    const repo = createRepository(c.env?.DB);
    const project = await withSpan(c, 'create_project', () => repo.createProject(payload), {
      'project.name': typeof payload.name === 'string' ? payload.name : 'Untitled project'
    });
    attachTraceAttributes(c, { 'project.id': project.id });
    return c.json(project, 201);
  });

  app.get('/api/tasks', async (c) => {
    const repo = createRepository(c.env?.DB);
    const tasks = await withSpan(c, 'list_tasks', () => repo.listTasks());
    return c.json(tasks);
  });

  app.post('/api/tasks', async (c) => {
    const payload = await c.req.json();
    const repo = createRepository(c.env?.DB);
    const task = await withSpan(c, 'create_task', () => repo.createTask(payload), {
      'task.title': typeof payload.title === 'string' ? payload.title : 'Untitled task',
      'kanban.status': typeof payload.status === 'string' ? payload.status : 'backlog'
    });
    attachTraceAttributes(c, {
      'task.id': task.id,
      'kanban.status': task.status,
      'project.id': task.project_id,
      'employee.id': task.assigned_employee_id
    });
    return c.json(task, 201);
  });

  return app;
}
