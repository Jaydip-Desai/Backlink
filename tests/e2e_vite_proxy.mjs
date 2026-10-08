// E2E Verification Script through Vite Proxy (http://localhost:5173/api)
// Tests Admin, Manager, and Executive roles and verifies all critical workflows

const PROXY_BASE = 'http://localhost:5173/api';

async function runE2E() {
  let passed = 0;
  let failed = 0;

  async function step(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ✗ ${name}: ${e.message}`);
      failed++;
    }
  }

  async function loginAs(email, password, expectedRole) {
    // 1. Get CSRF from Vite proxy
    const csrfRes = await fetch(`${PROXY_BASE}/auth/csrf`);
    if (!csrfRes.ok) throw new Error(`CSRF fetch failed: HTTP ${csrfRes.status}`);
    const csrfData = await csrfRes.json();
    if (!csrfData.csrf) throw new Error('Missing csrf in response');

    // 2. Login
    const loginRes = await fetch(`${PROXY_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!loginRes.ok) throw new Error(`Login failed for ${email}: HTTP ${loginRes.status}`);
    const loginData = await loginRes.json();
    if (loginData.user?.role !== expectedRole) {
      throw new Error(`Role mismatch for ${email}. Expected ${expectedRole}, got ${loginData.user?.role}`);
    }

    const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie')];
    const cookies = setCookies.map(c => c.split(';')[0]).join('; ');
    return {
      user: loginData.user,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'X-CSRF-Token': loginData.csrf || csrfData.csrf
      }
    };
  }

  console.log('\n=== TEST SUITE 1: Vite Proxy & Auth for All Roles ===');
  
  let adminSession;
  await step('Login as Admin (Aarav Mehta)', async () => {
    adminSession = await loginAs('admin@linkbridge.io', 'Admin@123', 'admin');
  });

  let managerSession;
  await step('Login as Manager (Sara Chen)', async () => {
    managerSession = await loginAs('sara@linkbridge.io', 'Sara@123', 'manager');
  });

  let execSession;
  await step('Login as Executive (Rahul Verma)', async () => {
    execSession = await loginAs('rahul@linkbridge.io', 'Rahul@123', 'executive');
  });

  console.log('\n=== TEST SUITE 2: Dashboard & Core Data Contracts ===');
  await step('Dashboard KPIs, Charts & Activity', async () => {
    const res = await fetch(`${PROXY_BASE}/dashboard`, { headers: adminSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!d.kpis || typeof d.kpis.totalDomains !== 'number') throw new Error('Invalid kpis');
    if (!d.charts || !Array.isArray(d.charts.backlinksOverTime)) throw new Error('Invalid charts');
    if (!Array.isArray(d.recentActivity)) throw new Error('Invalid recentActivity');
  });

  await step('Meta dictionary and status configurations', async () => {
    const res = await fetch(`${PROXY_BASE}/meta`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!d.domainStatuses || !d.statuses?.live) throw new Error('Invalid meta definitions');
  });

  console.log('\n=== TEST SUITE 3: Domains & Duplicate Detection Workflow ===');
  await step('List Domains with Pagination and Sorting', async () => {
    const res = await fetch(`${PROXY_BASE}/domains?page=1&limit=10&sort=da&order=desc`, { headers: adminSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!d.domains || d.domains.length === 0) throw new Error('No domains returned');
    if (typeof d.total !== 'number') throw new Error('Missing total count');
  });

  await step('Domain Duplicate Check (Existing domain)', async () => {
    const res = await fetch(`${PROXY_BASE}/domains/lookup?domain=https://abcsoftware.com/about`, { headers: adminSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!d.exists || d.normalized !== 'abcsoftware.com' || !d.history) {
      throw new Error('Duplicate check failed: ' + JSON.stringify(d));
    }
  });

  await step('Domain Duplicate Check (New fresh domain)', async () => {
    const res = await fetch(`${PROXY_BASE}/domains/lookup?domain=fresh-brand-new-site-2026.org`, { headers: adminSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (d.exists !== false) throw new Error('Expected exists=false');
  });

  await step('Domain Full Profile & Relationships', async () => {
    const res = await fetch(`${PROXY_BASE}/domains/DOM-00001`, { headers: adminSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!d.domain || d.domain.ref !== 'DOM-00001') throw new Error('Domain ref mismatch');
    if (!Array.isArray(d.contacts) || !Array.isArray(d.ourRequests) || !Array.isArray(d.clientRequests) || !Array.isArray(d.exchanges) || !Array.isArray(d.backlinks) || !Array.isArray(d.verificationHistory) || !Array.isArray(d.activity)) {
      throw new Error('Missing relationship arrays on domain profile');
    }
  });

  console.log('\n=== TEST SUITE 4: Outreach & Exchange Workflow ===');
  await step('Our Requests listing & filtering', async () => {
    const res = await fetch(`${PROXY_BASE}/our-requests?page=1&limit=25`, { headers: execSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.requests)) throw new Error('Invalid requests array');
  });

  await step('Client Requests listing & filtering', async () => {
    const res = await fetch(`${PROXY_BASE}/client-requests?page=1&limit=25`, { headers: execSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.requests)) throw new Error('Invalid requests array');
  });

  await step('Exchanges listing & details', async () => {
    const res = await fetch(`${PROXY_BASE}/exchanges?page=1&limit=25`, { headers: managerSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.exchanges) || d.exchanges.length === 0) throw new Error('Invalid exchanges array');
    const exRef = d.exchanges[0].ref;
    const detailRes = await fetch(`${PROXY_BASE}/exchanges/${exRef}`, { headers: managerSession.headers });
    if (!detailRes.ok) throw new Error(`HTTP ${detailRes.status}`);
    const detail = await detailRes.json();
    if (!detail.exchange || !Array.isArray(detail.backlinks)) throw new Error('Invalid exchange detail structure');
  });

  console.log('\n=== TEST SUITE 5: Verification & Lost Backlinks ===');
  await step('Backlinks listing', async () => {
    const res = await fetch(`${PROXY_BASE}/backlinks?page=1&limit=25`, { headers: execSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.backlinks)) throw new Error('Invalid backlinks list');
  });

  await step('Verification Queue & History', async () => {
    const qRes = await fetch(`${PROXY_BASE}/verification/queue`, { headers: adminSession.headers });
    if (!qRes.ok) throw new Error(`Queue HTTP ${qRes.status}`);
    const qData = await qRes.json();
    if (!Array.isArray(qData.queue)) throw new Error('Queue is not an array');

    const hRes = await fetch(`${PROXY_BASE}/verification/history?limit=25`, { headers: adminSession.headers });
    if (!hRes.ok) throw new Error(`History HTTP ${hRes.status}`);
    const hData = await hRes.json();
    if (!Array.isArray(hData.history)) throw new Error('History is not an array');
  });

  await step('Lost Backlinks listing', async () => {
    const res = await fetch(`${PROXY_BASE}/verification/lost?page=1&limit=25`, { headers: adminSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.backlinks) || typeof d.total !== 'number') throw new Error('Invalid lost backlinks response');
  });

  console.log('\n=== TEST SUITE 6: Analytics (Targets, Anchors, Contacts, Follow-ups) ===');
  await step('Target URLs Analytics', async () => {
    const res = await fetch(`${PROXY_BASE}/targets?page=1&limit=25`, { headers: adminSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.targets)) throw new Error('Invalid targets array');
  });

  await step('Anchor Text Distribution & Analytics', async () => {
    const res = await fetch(`${PROXY_BASE}/anchors?page=1&limit=25`, { headers: adminSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.anchors) || !Array.isArray(d.distribution)) throw new Error('Invalid anchors response');
  });

  await step('Contacts listing', async () => {
    const res = await fetch(`${PROXY_BASE}/contacts?page=1&limit=25`, { headers: execSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.contacts)) throw new Error('Invalid contacts list');
  });

  await step('Follow-ups due today and list', async () => {
    const res = await fetch(`${PROXY_BASE}/followups?page=1&limit=50`, { headers: execSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.followUps)) throw new Error('Invalid followUps list');
  });

  console.log('\n=== TEST SUITE 7: Admin Features (Reports, Search, Notifications, Users) ===');
  await step('Team Productivity Dashboard', async () => {
    const res = await fetch(`${PROXY_BASE}/team`, { headers: managerSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.members) || d.members.length === 0) throw new Error('Invalid team members list');
  });

  await step('Global Quick Search (Ctrl+K)', async () => {
    const res = await fetch(`${PROXY_BASE}/search?q=tech`, { headers: adminSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!d.results || !Array.isArray(d.results.domains) || !Array.isArray(d.results.exchanges)) {
      throw new Error('Invalid search results structure');
    }
  });

  await step('Report Preview & Generation', async () => {
    const res = await fetch(`${PROXY_BASE}/reports/preview`, {
      method: 'POST',
      headers: adminSession.headers,
      body: JSON.stringify({ type: 'backlinks' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.data) || typeof d.total !== 'number') throw new Error('Invalid report preview');
  });

  await step('Unread Notifications Badge', async () => {
    const res = await fetch(`${PROXY_BASE}/notifications?unread_only=true`, { headers: adminSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (typeof d.unread !== 'number') throw new Error('Missing unread count');
  });

  await step('User Management (Admin only)', async () => {
    const res = await fetch(`${PROXY_BASE}/users`, { headers: adminSession.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(d.users) || d.users.length === 0) throw new Error('Invalid users list');
  });

  console.log('\n=================================================');
  console.log(`E2E RESULT: ${passed} Passed, ${failed} Failed`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runE2E().catch(err => {
  console.error('E2E Fatal error:', err);
  process.exit(1);
});
