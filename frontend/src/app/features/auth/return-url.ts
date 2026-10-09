/**
 * Where to go after signing in. Only same-app paths are accepted, so a crafted
 * link cannot bounce the learner to another site.
 */
export function safeReturnUrl(candidate: string | null | undefined): string {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/dashboard';
  }
  return candidate;
}
