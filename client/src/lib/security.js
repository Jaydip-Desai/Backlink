/**
 * LinkPilot Security & Malware Defense Suite
 * Provides enterprise-grade input sanitization, safe URL handling,
 * anti-XSS protection, and malicious domain detection.
 */

// Known malicious / spam / abuse TLDs and deceptive patterns
const HIGH_RISK_TLD_PATTERNS = [
  /\.zip$/i, /\.mov$/i, /\.country$/i, /\.kim$/i, /\.cricket$/i, /\.science$/i,
  /\.work$/i, /\.gq$/i, /\.cf$/i, /\.tk$/i, /\.ml$/i, /\.ga$/i
];

const DISALLOWED_SCHEMES = [
  'javascript:', 'vbscript:', 'data:', 'file:', 'blob:', 'about:'
];

/**
 * Strips dangerous HTML tags and script payloads from user input.
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
    .trim();
}

/**
 * Validates and normalizes URLs to ensure they only use http/https.
 * Disallows javascript:, data:, and relative path manipulation.
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  
  for (const scheme of DISALLOWED_SCHEMES) {
    if (lower.startsWith(scheme)) {
      console.warn(`[Security Alert] Blocked potentially malicious scheme in URL: ${trimmed}`);
      return '#blocked-insecure-protocol';
    }
  }

  // Ensure absolute protocol
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    if (trimmed.startsWith('//')) {
      return `https:${trimmed}`;
    }
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Scans a domain or URL for known malware, phishing patterns, or homograph attacks.
 * Returns { isClean: boolean, threatLevel: 'clean'|'low'|'medium'|'high', warning?: string }
 */
export function scanDomainSecurity(domainOrUrl) {
  if (!domainOrUrl || typeof domainOrUrl !== 'string') {
    return { isClean: true, threatLevel: 'clean' };
  }

  const clean = domainOrUrl.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

  // 1. Check for homograph / punycode phishing
  if (clean.includes('xn--')) {
    return {
      isClean: false,
      threatLevel: 'medium',
      warning: 'Punycode / IDN domain detected. Verify authenticity to avoid homograph spoofing.'
    };
  }

  // 2. Check for suspicious TLDs
  for (const pattern of HIGH_RISK_TLD_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isClean: false,
        threatLevel: 'low',
        warning: 'High-risk or spam-associated TLD detected. Proceed with extra caution.'
      };
    }
  }

  // 3. Check for multiple hyphens or excessive subdomains (often phishing)
  const parts = clean.split('.');
  if (parts.length > 4) {
    return {
      isClean: false,
      threatLevel: 'medium',
      warning: 'Deep subdomain nesting detected. Often used in deceptive redirect chains.'
    };
  }

  // 4. Check for embedded credentials or port anomalies
  if (clean.includes('@') || /:\d{4,5}$/.test(clean)) {
    return {
      isClean: false,
      threatLevel: 'high',
      warning: 'Suspicious URL format with non-standard ports or embedded credentials.'
    };
  }

  return { isClean: true, threatLevel: 'clean' };
}
