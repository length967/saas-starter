import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser, NewAgent } from '@/lib/db/tcp-schema';
import { randomBytes } from 'crypto';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

// User authentication types
export type UserSessionData = {
  type: 'user';
  user: {
    id: number;
    email: string;
  };
  company?: {
    id: number;
    slug: string;
    role: string;
  };
  project?: {
    id: number;
    slug: string;
    role: string;
  };
  expires: string;
};

// Agent authentication types
export type AgentSessionData = {
  type: 'agent';
  agent: {
    id: number;
    agentId: string;
    projectId: number;
  };
  expires: string;
};

export type SessionData = UserSessionData | AgentSessionData;

// Password hashing for users
export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

// Agent secret management
export async function generateAgentSecret(): Promise<string> {
  return randomBytes(32).toString('hex');
}

export async function hashAgentSecret(secret: string) {
  return hash(secret, SALT_ROUNDS);
}

export async function compareAgentSecrets(
  plainTextSecret: string,
  hashedSecret: string
) {
  return compare(plainTextSecret, hashedSecret);
}

// Generate registration token for agents
export function generateRegistrationToken(): string {
  return randomBytes(32).toString('hex');
}

// JWT token signing and verification
export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(payload.type === 'user' ? '7 days from now' : '1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

// User session management
export async function getUserSession(): Promise<UserSessionData | null> {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  
  try {
    const sessionData = await verifyToken(session);
    if (sessionData.type !== 'user') return null;
    return sessionData;
  } catch (error) {
    return null;
  }
}

export async function setUserSession(
  user: NewUser & { id: number },
  company?: { id: number; slug: string; role: string },
  project?: { id: number; slug: string; role: string }
) {
  const expiresInSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session: UserSessionData = {
    type: 'user',
    user: { 
      id: user.id,
      email: user.email 
    },
    company,
    project,
    expires: expiresInSevenDays.toISOString(),
  };
  
  const encryptedSession = await signToken(session);
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInSevenDays,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}

export async function clearSession() {
  (await cookies()).delete('session');
}

// Agent JWT signing (for agent authentication)
export async function signAgentToken(agent: NewAgent & { id: number }, secret: string) {
  const agentKey = new TextEncoder().encode(secret);
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  const payload: AgentSessionData = {
    type: 'agent',
    agent: {
      id: agent.id,
      agentId: agent.agentId,
      projectId: agent.projectId,
    },
    expires: expiresInOneDay.toISOString(),
  };
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(agentKey);
}

export async function verifyAgentToken(token: string, secret: string): Promise<AgentSessionData | null> {
  try {
    const agentKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, agentKey, {
      algorithms: ['HS256'],
    });
    
    const sessionData = payload as SessionData;
    if (sessionData.type !== 'agent') return null;
    
    return sessionData;
  } catch (error) {
    return null;
  }
}

// Utility to get session from Authorization header (for API routes)
export async function getSessionFromHeader(authHeader: string | null): Promise<SessionData | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    return await verifyToken(token);
  } catch (error) {
    return null;
  }
}

// Context switching for users (company/project)
export async function switchCompanyContext(companyId: number, companySlug: string, role: string) {
  const session = await getUserSession();
  if (!session) throw new Error('No user session');
  
  await setUserSession(
    { id: session.user.id, email: session.user.email } as NewUser & { id: number },
    { id: companyId, slug: companySlug, role },
    undefined // Clear project context when switching companies
  );
}

export async function switchProjectContext(
  projectId: number, 
  projectSlug: string, 
  projectRole: string,
  companyId: number,
  companySlug: string,
  companyRole: string
) {
  const session = await getUserSession();
  if (!session) throw new Error('No user session');
  
  await setUserSession(
    { id: session.user.id, email: session.user.email } as NewUser & { id: number },
    { id: companyId, slug: companySlug, role: companyRole },
    { id: projectId, slug: projectSlug, role: projectRole }
  );
}