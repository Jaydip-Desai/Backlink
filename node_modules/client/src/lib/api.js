let csrfToken = '';
let setAuthUser = null;
let notify = null;
let navigateTo = null;

export function setCsrf(t) { csrfToken = t; }
export function getCsrf() { return csrfToken; }
export function setAuthSetter(fn) { setAuthUser = fn; }
export function setNotify(fn) { notify = fn; }
export function setNavigate(fn) { navigateTo = fn; }

export async function api(path, options = {}) {
  const { method = 'GET', body, noAuth } = options;
  const headers = { 'Content-Type': 'application/json' };
  if (csrfToken && method !== 'GET') headers['X-CSRF-Token'] = csrfToken;
  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401 && !noAuth) {
      if (setAuthUser) setAuthUser(null);
      if (navigateTo) navigateTo('/login');
      throw new Error('Session expired');
    }
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw { status: res.status, message: data.error || 'Request failed', data };
    return data;
  } catch (e) {
    if (e.message === 'Session expired') throw e;
    if (e?.status) throw e;
    throw { status: 0, message: 'Network error. Please check your connection.' };
  }
}

export async function apiGet(path) { return api(path); }
export async function apiPost(path, body) { return api(path, { method: 'POST', body }); }
export async function apiPut(path, body) { return api(path, { method: 'PUT', body }); }
export async function apiDel(path) { return api(path, { method: 'DELETE' }); }

export async function download(path, filename, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  const res = await fetch(`/api${path}`, { method: 'POST', headers, credentials: 'include', body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Download failed'); }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export async function upload(path, file, meta = {}) {
  const fd = new FormData();
  fd.append('file', file);
  Object.entries(meta).forEach(([k, v]) => fd.append(k, v));
  const headers = {};
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  const res = await fetch(`/api${path}`, { method: 'POST', headers, credentials: 'include', body: fd });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.error, data };
  return data;
}