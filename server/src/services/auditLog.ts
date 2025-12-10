import { PoolClient } from 'pg';

interface AuditLogEntry {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: any;
    ipAddress?: string;
}

export async function logAudit(
    client: PoolClient,
    entry: AuditLogEntry
): Promise<void> {
    try {
        await client.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                entry.userId,
                entry.action,
                entry.entityType,
                entry.entityId,
                entry.changes ? JSON.stringify(entry.changes) : null,
                entry.ipAddress || null
            ]
        );
    } catch (error) {
        console.error('Failed to log audit:', error);
        // Don't throw - audit logging shouldn't break main operations
    }
}
