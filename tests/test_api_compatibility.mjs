const BASE = 'http://localhost:8080/api';

async function testAll() {
  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Meta
  await check('GET /api/meta', async () => {
    const res = await fetch(`${BASE}/meta`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.roles || !data.domainStatuses || !data.statuses) throw new Error('Missing keys in meta: ' + Object.keys(data));
  });

  // 2. CSRF
  await check('GET /api/auth/csrf', async () => {
    const res = await fetch(`${BASE}/auth/csrf`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.csrf) throw new Error('Missing csrf property: ' + JSON.stringify(data));
  });

  // 3. Login Admin
  let cookies = [];
  let adminCsrf = '';
  await check('POST /api/auth/login (Admin)', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@linkbridge.io', password: 'Admin@123' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    cookies = rawCookies.map(c => c.split(';')[0]);
    const data = await res.json();
    if (!data.user || data.user.role !== 'admin' || !data.csrf) {
      throw new Error('Unexpected login response: ' + JSON.stringify(data));
    }
    adminCsrf = data.csrf;
  });

  const cookieHeader = cookies.join('; ');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': cookieHeader,
    'X-CSRF-Token': adminCsrf
  };

  // 4. Me
  await check('GET /api/auth/me', async () => {
    const res = await fetch(`${BASE}/auth/me`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.user || data.user.email !== 'admin@linkbridge.io' || !data.csrf) throw new Error('Invalid user in /me');
  });

  // 5. Dashboard (matches React Dashboard)
  await check('GET /api/dashboard', async () => {
    const res = await fetch(`${BASE}/dashboard`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.kpis || !data.charts || !data.recentActivity) throw new Error('Missing dashboard fields: ' + Object.keys(data));
    const k = data.kpis;
    if (k.totalDomains == null || k.totalExchanges == null || k.liveBacklinks == null) {
      throw new Error('Missing KPIs: ' + Object.keys(k));
    }
  });

  // 6. Domains list
  await check('GET /api/domains', async () => {
    const res = await fetch(`${BASE}/domains?page=1&limit=25`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.domains || typeof data.total !== 'number') throw new Error('Invalid domains structure');
    if (data.domains.length === 0) throw new Error('No domains returned');
    const d0 = data.domains[0];
    if (!d0.ref || !d0.domain) throw new Error('Domain object missing ref or domain');
  });

  // 7. Domain lookup
  await check('GET /api/domains/lookup?domain=abcsoftware.com', async () => {
    const res = await fetch(`${BASE}/domains/lookup?domain=abcsoftware.com`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.exists || !data.domain || !data.history) throw new Error('Lookup invalid response: ' + JSON.stringify(data));
  });

  // 8. Domain detail (matches React DomainProfile)
  await check('GET /api/domains/DOM-00001', async () => {
    const res = await fetch(`${BASE}/domains/DOM-00001`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.domain || !data.stats || !data.contacts || !data.ourRequests || !data.clientRequests || !data.exchanges || !data.backlinks || !data.verificationHistory || !data.activity) {
      throw new Error('Missing related entities in domain detail: ' + Object.keys(data));
    }
  });

  // 9. Our Requests
  await check('GET /api/our-requests', async () => {
    const res = await fetch(`${BASE}/our-requests?page=1&limit=25`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.requests || typeof data.total !== 'number') throw new Error('Invalid our-requests structure: ' + Object.keys(data));
  });

  // 10. Client Requests
  await check('GET /api/client-requests', async () => {
    const res = await fetch(`${BASE}/client-requests?page=1&limit=25`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.requests || typeof data.total !== 'number') throw new Error('Invalid client-requests structure');
  });

  // 11. Exchanges
  await check('GET /api/exchanges', async () => {
    const res = await fetch(`${BASE}/exchanges?page=1&limit=25`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.exchanges || typeof data.total !== 'number') throw new Error('Invalid exchanges structure');
  });

  // 12. Exchange detail
  await check('GET /api/exchanges/EX-00001', async () => {
    const res = await fetch(`${BASE}/exchanges/EX-00001`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.exchange) throw new Error('Invalid exchange detail: ' + Object.keys(data));
  });

  // 13. Backlinks
  await check('GET /api/backlinks', async () => {
    const res = await fetch(`${BASE}/backlinks?page=1&limit=25`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.backlinks || typeof data.total !== 'number') throw new Error('Invalid backlinks structure');
  });

  // 14. Verification Queue & History & Lost
  await check('GET /api/verification/queue', async () => {
    const res = await fetch(`${BASE}/verification/queue`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.queue) throw new Error('Invalid queue structure: ' + Object.keys(data));
  });

  await check('GET /api/verification/history', async () => {
    const res = await fetch(`${BASE}/verification/history?limit=50`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.history) throw new Error('Invalid history structure');
  });

  await check('GET /api/verification/lost', async () => {
    const res = await fetch(`${BASE}/verification/lost?page=1&limit=25`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.backlinks || typeof data.total !== 'number') throw new Error('Invalid lost backlinks structure');
  });

  // 15. Contacts
  await check('GET /api/contacts', async () => {
    const res = await fetch(`${BASE}/contacts?page=1&limit=25`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.contacts || typeof data.total !== 'number') throw new Error('Invalid contacts structure');
  });

  // 16. Follow-ups
  await check('GET /api/followups', async () => {
    const res = await fetch(`${BASE}/followups?page=1&limit=50`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.followUps || typeof data.total !== 'number') throw new Error('Invalid followUps structure');
  });

  await check('GET /api/followups/due-today', async () => {
    const res = await fetch(`${BASE}/followups/due-today`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.followUps || typeof data.total !== 'number') throw new Error('Invalid followUps due-today structure');
  });

  // 17. Targets & Anchors
  await check('GET /api/targets', async () => {
    const res = await fetch(`${BASE}/targets?page=1&limit=25`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.targets || typeof data.total !== 'number') throw new Error('Invalid targets structure');
  });

  await check('GET /api/anchors', async () => {
    const res = await fetch(`${BASE}/anchors?page=1&limit=25`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.anchors || !data.distribution || typeof data.total !== 'number') throw new Error('Invalid anchors structure');
  });

  // 18. Team
  await check('GET /api/team', async () => {
    const res = await fetch(`${BASE}/team`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.members) throw new Error('Invalid team structure');
  });

  // 19. Activity
  await check('GET /api/activity', async () => {
    const res = await fetch(`${BASE}/activity?page=1&limit=50`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.logs || typeof data.total !== 'number') throw new Error('Invalid activity structure');
  });

  // 20. Notifications (matches React Layout)
  await check('GET /api/notifications?unread_only=true', async () => {
    const res = await fetch(`${BASE}/notifications?unread_only=true`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.notifications || typeof data.unread !== 'number') throw new Error('Invalid notifications structure: ' + Object.keys(data));
  });

  // 21. Settings
  await check('GET /api/settings', async () => {
    const res = await fetch(`${BASE}/settings`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.settings) throw new Error('Invalid settings structure');
  });

  // 22. Search (matches React Layout Ctrl+K)
  await check('GET /api/search?q=tech', async () => {
    const res = await fetch(`${BASE}/search?q=tech`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.results || !data.results.domains || !data.results.exchanges) throw new Error('Invalid search structure: ' + Object.keys(data));
  });

  // 23. Reports preview (matches React Reports)
  await check('POST /api/reports/preview', async () => {
    const res = await fetch(`${BASE}/reports/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ type: 'backlinks' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.data || typeof data.total !== 'number') throw new Error('Invalid report preview structure: ' + Object.keys(data));
  });

  // 24. Users management
  await check('GET /api/users', async () => {
    const res = await fetch(`${BASE}/users`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.users) throw new Error('Invalid users structure');
  });

  console.log(`\n========================================`);
  console.log(`TOTAL: Passed=${passed}, Failed=${failed}`);
  console.log(`========================================`);
  if (failed > 0) process.exit(1);
}

testAll().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
