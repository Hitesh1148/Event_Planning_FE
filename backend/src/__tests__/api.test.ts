import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('PlanWise API Integration Tests', () => {
  it('GET /api/health returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.demoMode).toBe(true);
  });

  it('rejects protected routes without authorization header', async () => {
    const res = await request(app).get('/api/groups');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Authentication required');
  });

  it('logs in seeded demo user Alice and returns JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@planwise.local',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@planwise.local');
    expect(res.body.user.name).toBe('Alice Johnson');
  });

  it('fails login with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@planwise.local',
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid email or password');
  });

  it('retrieves groups for authenticated Alice', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@planwise.local',
        password: 'Password123!'
      });

    const token = loginRes.body.token;

    const groupRes = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${token}`);

    expect(groupRes.status).toBe(200);
    expect(groupRes.body.groups).toBeDefined();
    expect(groupRes.body.groups.length).toBeGreaterThan(0);
    expect(groupRes.body.groups.some((g: any) => g.name === 'Weekend Crew')).toBe(true);
  });
});
