/**
 * Authentication adapter.
 * Provides user identity and role lookup from local reference users or headers.
 * Connect to your actual auth service / JWT provider in production.
 */

import { Department, UserContext, UserRole } from '../../types/workflow.types';
import { IAuthService } from '../../types/integration.types';

export class AuthAdapter implements IAuthService {
  /**
   * Reference users for development, testing, and UI simulation.
   */
  private activeUsers: Map<string, UserContext> = new Map([
    [
      'pol-01',
      {
        userId: 'pol-01',
        name: 'Inspector Rajesh Sharma',
        email: 'rajesh.sharma@police.gov.in',
        role: UserRole.POLICE_STATION_HEAD,
        department: Department.POLICE,
        badgeNumber: 'DL-SH-409',
      },
    ],
    [
      'pol-02',
      {
        userId: 'pol-02',
        name: 'Sub-Inspector Anjali Verma',
        email: 'anjali.verma@police.gov.in',
        role: UserRole.POLICE_OFFICER,
        department: Department.POLICE,
        badgeNumber: 'DL-IO-881',
      },
    ],
    [
      'fsl-01',
      {
        userId: 'fsl-01',
        name: 'Dr. Arisudan Rao (Forensic Chief)',
        email: 'arisudan.rao@cfsl.gov.in',
        role: UserRole.FORENSIC_DIRECTOR,
        department: Department.FORENSIC,
        badgeNumber: 'CFSL-DIR-12',
      },
    ],
    [
      'fsl-02',
      {
        userId: 'fsl-02',
        name: 'Dr. Maya Sengupta (Ballistics)',
        email: 'maya.sengupta@cfsl.gov.in',
        role: UserRole.FORENSIC_EXPERT,
        department: Department.FORENSIC,
        badgeNumber: 'CFSL-EXP-44',
      },
    ],
    [
      'pros-01',
      {
        userId: 'pros-01',
        name: 'Adv. S. K. Narayanan (Public Prosecutor)',
        email: 'sk.narayanan@prosecution.gov.in',
        role: UserRole.PUBLIC_PROSECUTOR,
        department: Department.PROSECUTOR,
      },
    ],
    [
      'pros-02',
      {
        userId: 'pros-02',
        name: 'Adv. Meenakshi Sundaram (Chief Prosecutor)',
        email: 'meenakshi.s@prosecution.gov.in',
        role: UserRole.CHIEF_PROSECUTOR,
        department: Department.PROSECUTOR,
      },
    ],
    [
      'crt-01',
      {
        userId: 'crt-01',
        name: 'Hon. Justice P. K. Banerjee (Sessions Judge)',
        email: 'pk.banerjee@delhicourts.nic.in',
        role: UserRole.JUDGE,
        department: Department.COURT,
        courtJurisdiction: 'Sessions Court Delhi North',
      },
    ],
    [
      'crt-02',
      {
        userId: 'crt-02',
        name: 'Rameshwar Dayal (Chief Court Clerk)',
        email: 'r.dayal@delhicourts.nic.in',
        role: UserRole.COURT_CLERK,
        department: Department.COURT,
        courtJurisdiction: 'Sessions Court Delhi North',
      },
    ],
    [
      'admin-01',
      {
        userId: 'admin-01',
        name: 'National System Administrator',
        email: 'admin@icjs.nic.in',
        role: UserRole.SYSTEM_ADMIN,
        department: Department.POLICE,
      },
    ],
  ]);

  /**
   * Resolves authenticated user from Authorization header or Bearer token.
   * Fails closed: throws an unauthorized error when credentials are missing or invalid.
   */
  public async getCurrentUser(tokenOrHeader?: string): Promise<UserContext> {
    if (!tokenOrHeader || typeof tokenOrHeader !== 'string' || !tokenOrHeader.trim()) {
      throw new Error('Authentication failed: missing authorization token or header');
    }

    const cleanId = tokenOrHeader.replace(/^Bearer\s+/i, '').trim();
    if (!cleanId) {
      throw new Error('Authentication failed: authorization bearer token is empty');
    }

    const user = this.activeUsers.get(cleanId);
    if (!user) {
      throw new Error(`Authentication failed: invalid credentials for user '${cleanId}'`);
    }

    return user;
  }

  public validateRole(user: UserContext, allowedRoles: UserRole[]): boolean {
    if (user.role === UserRole.SYSTEM_ADMIN) return true;
    return allowedRoles.includes(user.role);
  }

  public canAccessDepartment(user: UserContext, department: Department): boolean {
    if (user.role === UserRole.SYSTEM_ADMIN) return true;
    return user.department === department;
  }

  // --- Demo & Reference Functionality ---

  /**
   * Demo/development reference helper: retrieves a simulated persona by ID without token parsing.
   */
  public getDemoUser(userId: string = 'pol-01'): UserContext {
    const user = this.activeUsers.get(userId);
    if (!user) {
      throw new Error(`Demo persona '${userId}' not found in reference roster`);
    }
    return user;
  }

  /**
   * Demo/development reference helper: returns all reference roster users for simulation.
   */
  public getDemoRoster(): UserContext[] {
    return Array.from(this.activeUsers.values());
  }

  /**
   * Alias for getDemoRoster() for backward compatibility.
   */
  public getAllRosterUsers(): UserContext[] {
    return this.getDemoRoster();
  }
}

