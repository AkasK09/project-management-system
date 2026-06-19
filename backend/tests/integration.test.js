const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

describe('Integration Tests - End-to-End User Flow', () => {
  let token;
  let userId;
  let projectId;
  let taskId;
  const testEmail = `testuser_${Date.now()}@example.com`;

  afterAll(async () => {
    // Cleanup database test entries
    try {
      if (taskId) {
        await prisma.task.deleteMany({ where: { id: taskId } });
      }
      if (projectId) {
        await prisma.project.deleteMany({ where: { id: projectId } });
      }
      if (userId) {
        await prisma.user.deleteMany({ where: { id: userId } });
      }
    } catch (err) {
      console.error('Test cleanup failed:', err);
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should successfully register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Integration Test User',
        email: testEmail,
        password: 'securePassword123'
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    
    token = res.body.token;
    userId = res.body.user.id;
  });

  it('should fail registration if email is duplicate', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Integration Test User',
        email: testEmail,
        password: 'securePassword123'
      });

    expect(res.status).toBe(400);
  });

  it('should login the registered user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'securePassword123'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.fullName).toBe('Integration Test User');
  });

  it('should create a project under authenticated user', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectName: 'Test Integration Project',
        description: 'A project created during integration testing',
        status: 'In Progress'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.projectName).toBe('Test Integration Project');

    projectId = res.body.id;
  });

  it('should create a task inside the created project', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId: projectId,
        taskName: 'Test Integration Task',
        description: 'A task inside our integration project',
        priority: 'High',
        status: 'Pending'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.taskName).toBe('Test Integration Task');

    taskId = res.body.id;
  });
});
