// Comprehensive Security & Penetration Verification Suite
// Tests RBAC, IDOR, CSRF, Rate Limiting, SQLi defense, Security Headers, Bounded Pagination

const BASE = 'http://localhost:8080/api';

async function runSecurityMatrix() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  [FAIL] ${name}: ${e.message}`);
      failed++;
    }
  }

  async function login(email, password) {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error(`Login failed for ${email}: HTTP ${res.status}`);
    const data = await res.json();
    const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    const cookies = rawCookies.map(c => c.split(';')[0]).join('; ');
    return {
      user: data.user,
      token: data.token,
      csrf: data.csrf,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'X-CSRF-Token': data.csrf
      }
    };
  }

  console.log('\n==================================================');
  console.log('1. RBAC & PRIVILEGE ESCALATION TESTS');
  console.log('==================================================');

  const admin = await login('admin@linkbridge.io', 'Admin@123');
  const manager = await login('sara@linkbridge.io', 'Sara@123');
  const executive = await login('rahul@linkbridge.io', 'Rahul@123');

  await test('Executive blocked from User Administration (GET /api/users -> 403)', async () => {
    const res = await fetch(`${BASE}/users`, { headers: executive.headers });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('Executive blocked from System Settings Mutation (PUT /api/settings -> 403)', async () => {
    const res = await fetch(`${BASE}/settings`, {
      method: 'PUT',
      headers: executive.headers,
      body: JSON.stringify({ company_name: 'Hacked Inc' })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('Executive blocked from Activity Logs (GET /api/activity -> 403)', async () => {
    const res = await fetch(`${BASE}/activity`, { headers: executive.headers });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('Executive blocked from Data Import Execution (POST /api/import/execute -> 403)', async () => {
    const res = await fetch(`${BASE}/import/execute`, {
      method: 'POST',
      headers: executive.headers,
      body: JSON.stringify({ data: [{ domain: 'evil.com' }] })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('Manager blocked from User Administration (GET /api/users -> 403)', async () => {
    const res = await fetch(`${BASE}/users`, { headers: manager.headers });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('Manager blocked from Modifying Settings (PUT /api/settings -> 403)', async () => {
    const res = await fetch(`${BASE}/settings`, {
      method: 'PUT',
      headers: manager.headers,
      body: JSON.stringify({ company_name: 'Manager Update' })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('Admin allowed full access to Users and Activity (200 OK)', async () => {
    const uRes = await fetch(`${BASE}/users`, { headers: admin.headers });
    if (uRes.status !== 200) throw new Error(`Expected 200, got ${uRes.status}`);
    const aRes = await fetch(`${BASE}/activity`, { headers: admin.headers });
    if (aRes.status !== 200) throw new Error(`Expected 200, got ${aRes.status}`);
  });

  console.log('\n==================================================');
  console.log('2. IDOR / HORIZONTAL ACCESS CONTROL TESTS');
  console.log('==================================================');

  // Admin creates an our_request owned by Admin (id: 1)
  const createAdminReq = await fetch(`${BASE}/our-requests`, {
    method: 'POST',
    headers: admin.headers,
    body: JSON.stringify({
      our_website: 'https://admin-owned.com',
      partner_domain: 'partner-site.com',
      target_url: 'https://admin-owned.com/page',
      assigned_to: admin.user.id
    })
  });
  const adminReqData = await createAdminReq.json();
  const adminReqRef = adminReqData.ref;

  await test(`Executive blocked from modifying unassigned request ${adminReqRef} (403 Forbidden)`, async () => {
    const res = await fetch(`${BASE}/our-requests/${adminReqRef}`, {
      method: 'PUT',
      headers: executive.headers,
      body: JSON.stringify({ notes: 'Malicious modification by unauthorized executive' })
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  // Admin creates a backlink owned by Admin
  const createAdminBl = await fetch(`${BASE}/backlinks`, {
    method: 'POST',
    headers: admin.headers,
    body: JSON.stringify({
      exchange_id: 1,
      referring_domain: 'admin-bl-test.com',
      referring_page_url: 'https://admin-bl-test.com/links',
      target_url: 'https://admin-owned.com/page',
      assigned_to: admin.user.id
    })
  });
  const adminBlData = await createAdminBl.json();
  const adminBlRef = adminBlData.ref;

  await test(`Executive blocked from modifying unassigned backlink ${adminBlRef} (403 Forbidden)`, async () => {
    const res = await fetch(`${BASE}/backlinks/${adminBlRef}`, {
      method: 'PUT',
      headers: executive.headers,
      body: JSON.stringify({ notes: 'IDOR tamper attempt' })
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  await test('Executive blocked from assigning records to other users (Privilege Escalation)', async () => {
    const res = await fetch(`${BASE}/our-requests`, {
      method: 'POST',
      headers: executive.headers,
      body: JSON.stringify({
        our_website: 'https://executive-test.com',
        partner_domain: 'partner-test.com',
        target_url: 'https://executive-test.com/page',
        assigned_to: admin.user.id
      })
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  console.log('\n==================================================');
  console.log('3. CSRF DOUBLE-SUBMIT PROTECTION TESTS');
  console.log('==================================================');

  await test('State-changing POST fails when X-CSRF-Token is omitted (403 Forbidden)', async () => {
    const headersWithoutCsrf = {
      'Content-Type': 'application/json',
      'Cookie': admin.headers.Cookie
    };
    const res = await fetch(`${BASE}/reports/preview`, {
      method: 'POST',
      headers: headersWithoutCsrf,
      body: JSON.stringify({ type: 'backlinks' })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    const data = await res.json();
    if (!data.error || !data.error.includes('CSRF')) {
      throw new Error(`Expected CSRF error message, got: ${JSON.stringify(data)}`);
    }
  });

  await test('State-changing POST fails when X-CSRF-Token is forged/mismatched (403 Forbidden)', async () => {
    const headersTamperedCsrf = {
      'Content-Type': 'application/json',
      'Cookie': admin.headers.Cookie,
      'X-CSRF-Token': 'forged-token-abc-123'
    };
    const res = await fetch(`${BASE}/reports/preview`, {
      method: 'POST',
      headers: headersTamperedCsrf,
      body: JSON.stringify({ type: 'backlinks' })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('State-changing POST succeeds when X-CSRF-Token matches cookie (200 OK)', async () => {
    const res = await fetch(`${BASE}/reports/preview`, {
      method: 'POST',
      headers: admin.headers,
      body: JSON.stringify({ type: 'backlinks' })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  console.log('\n==================================================');
  console.log('4. RATE LIMITING & BRUTE FORCE DEFENSE');
  console.log('==================================================');

  await test('Rapid repeated failed logins trigger HTTP 429 Too Many Requests', async () => {
    const targetEmail = `bruteforce_test_${Date.now()}@example.com`;
    let got429 = false;

    for (let i = 0; i < 7; i++) {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: 'WrongPassword123' })
      });
      if (res.status === 429) {
        got429 = true;
        const body = await res.json();
        if (!body.error || !body.error.toLowerCase().includes('too many failed')) {
          throw new Error(`Unexpected 429 response message: ${JSON.stringify(body)}`);
        }
        break;
      }
    }
    if (!got429) throw new Error('Failed to trigger HTTP 429 after rapid failed attempts');
  });

  console.log('\n==================================================');
  console.log('5. SQL INJECTION DEFENSE & BOUNDED PAGINATION');
  console.log('==================================================');

  await test('SQL Injection in sort parameter safely sanitized (200 OK without SQL error)', async () => {
    const res = await fetch(`${BASE}/domains?sort=da;DROP+TABLE+users;--&order=asc`, {
      headers: admin.headers
    });
    if (res.status !== 200) throw new Error(`Expected 200 OK fallback, got ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.domains)) throw new Error('Expected domains array');
  });

  await test('Excessive limit (?limit=999999) safely clamped to max 100', async () => {
    const res = await fetch(`${BASE}/domains?page=1&limit=999999`, {
      headers: admin.headers
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.limit > 100) throw new Error(`Expected limit <= 100, got ${data.limit}`);
  });

  console.log('\n==================================================');
  console.log('6. SECURITY HEADERS & SAFE ERROR RESPONSES');
  console.log('==================================================');

  await test('Security Headers present on API responses', async () => {
    const res = await fetch(`${BASE}/meta`);
    const xfo = res.headers.get('x-frame-options');
    const xcto = res.headers.get('x-content-type-options');
    const rp = res.headers.get('referrer-policy');

    if (!xfo || xfo.toUpperCase() !== 'DENY') throw new Error(`Missing or invalid X-Frame-Options: ${xfo}`);
    if (!xcto || xcto.toLowerCase() !== 'nosniff') throw new Error(`Missing or invalid X-Content-Type-Options: ${xcto}`);
    if (!rp) throw new Error(`Missing Referrer-Policy header`);
  });

  await test('Unauthorized access Denied response does not leak stack trace or internal classes', async () => {
    const res = await fetch(`${BASE}/users`); // No auth
    if (res.status !== 401 && res.status !== 403) throw new Error(`Expected 401/403, got ${res.status}`);
    const bodyText = await res.text();
    if (bodyText.includes('org.springframework') || bodyText.includes('java.lang') || bodyText.includes('Exception at')) {
      throw new Error(`Leaked stack trace/class in response: ${bodyText}`);
    }
  });

  console.log('\n==================================================');
  console.log(`SECURITY MATRIX SUMMARY: Passed=${passed}, Failed=${failed}`);
  console.log('==================================================\n');

  if (failed > 0) process.exit(1);
}

runSecurityMatrix().catch(e => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
