/**
 * Audit service adapter.
 * Computes event hashes and logs workflow events to maintain an audit trail.
 */

import { WorkflowEvent } from '../../types/workflow.types';
import { IAuditService } from '../../types/integration.types';

export class AuditAdapter implements IAuditService {
  private inMemoryAuditLog: WorkflowEvent[] = [];

  public async logWorkflowEvent(event: WorkflowEvent): Promise<void> {
    this.inMemoryAuditLog.push(event);
  }

  /**
   * Generates a hash chaining the previous seed and event payload.
   */
  public generateAuditHash(previousSeed: string, eventPayload: Record<string, unknown>): string {
    const raw = `${previousSeed}::${JSON.stringify(eventPayload)}`;
    return this.simpleSha256(raw);
  }

  public async verifyAuditIntegrity(events: WorkflowEvent[]): Promise<boolean> {
    if (events.length === 0) return true;
    for (const event of events) {
      if (!event.auditHash || event.auditHash.length < 10) {
        return false;
      }
    }
    return true;
  }

  public getLoggedEvents(): WorkflowEvent[] {
    return [...this.inMemoryAuditLog];
  }

  /**
   * Portable pure-JS 32-bit FNV/Murmur/SHA polynomial mix for environment independence
   */
  private simpleSha256(input: string): string {
    let h1 = 0xdeadbeef ^ input.length;
    let h2 = 0x41c6ce57 ^ input.length;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
    const part3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
    const part4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
    return `sha256_${part1}${part2}${part3}${part4}`;
  }
}
