```javascript
let csrfToken = '';
let setAuthUser = null;
let notify = null;
let navigateTo = null;

// Backend URL configured in Render.
// Use an empty string for local development with a proxy.
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/+$/, '');

export function setCsrf(t) {
  csrfToken = t;
}

export function getCsrf() {
  return csrfToken;
}

export function setAuthSetter(fn) {
  setAuthUser = fn;
}

export function setNotify(fn) {
  notify = fn;
}

export function setNavigate(fn) {
  navigateTo = fn;
}

function apiUrl(path) {
  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  return `${API_BASE_URL}/api${normalizedPath}`;
}

async function parseResponse(res) {
  const text = await res.text();

  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  return data;
}

export async function api(path, options = {}) {
  const { method = 'GET', body, noAuth } = options;
  const headers = {};

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (csrfToken && method !== 'GET' && method !== 'HEAD') {
    headers['X-CSRF-Token'] = csrfToken;
  }

  try {
    const res = await fetch(apiUrl(path), {
      method,
      headers,
      credentials: 'include',
      body:
        body == null
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });

    const data = await parseResponse(res);

    if (res.status === 401 && !noAuth) {
      if (setAuthUser) setAuthUser(null);
      if (navigateTo) navigateTo('/login');
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw {
        status: res.status,
        message: data.error || `Request failed (${res.status})`,
        data,
      };
    }

    return data;
  } catch (e) {
    if (e.message === 'Session expired') throw e;
    if (e?.status) throw e;

    if (notify) {
      notify('Unable to connect to the server. Please try again.');
    }

    throw {
      status: 0,
      message: 'Network error. Please check your connection.',
      cause: e,
    };
  }
}

export async function apiGet(path) {
  return api(path);
}

export async function apiPost(path, body) {
  return api(path, { method: 'POST', body });
}

export async function apiPut(path, body) {
  return api(path, { method: 'PUT', body });
}

export async function apiDel(path) {
  return api(path, { method: 'DELETE' });
}

export async function download(path, filename, body) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers,
    credentials: 'include',
    body: body == null ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await parseResponse(res);
    throw new Error(data.error || `Download failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function upload(path, file, meta = {}) {
  const fd = new FormData();

  fd.append('file', file);

  Object.entries(meta).forEach(([key, value]) => {
    if (value != null) {
      fd.append(key, String(value));
    }
  });

  const headers = {};

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers,
    credentials: 'include',
    body: fd,
  });

  const data = await parseResponse(res);

  if (!res.ok) {
    throw {
      status: res.status,
      message: data.error || `Upload failed (${res.status})`,
      data,
    };
  }

  return data;
}
```
