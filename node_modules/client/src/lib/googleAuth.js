/**
 * Google Auth is deprecated and removed from LinkPilot authentication flow.
 * Authentication is performed purely and directly via email and password credentials.
 */
export async function getGoogleConfig() {
  return { configured: false, clientId: null };
}

export async function triggerGoogleAuth({ onError, setLoading } = {}) {
  if (setLoading) setLoading(false);
  if (onError) onError(new Error('Google sign-in is disabled. Please use standard email registration.'));
}
