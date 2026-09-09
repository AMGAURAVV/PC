/**
 * JwtPayload — the decoded JWT access token structure.
 *
 * This is set by JwtStrategy.validate() and injected via @CurrentUser().
 * Stored in request.user after authentication.
 */

export interface JwtPayload {
  /** User UUID */
  sub: string;
  /** User email */
  email: string;
  /** User's role names e.g. ['customer', 'admin'] */
  roles: string[];
  /** Token type — 'access' | 'refresh' */
  type: 'access' | 'refresh';
  /** Issued at (Unix timestamp) */
  iat?: number;
  /** Expiration (Unix timestamp) */
  exp?: number;
}
