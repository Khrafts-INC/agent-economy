// Service layer - marketplace listings CRUD
import { getDb } from '../db/index.js';
import { v4 as uuid } from 'uuid';
import { getAgentById } from './agents.js';
// Valid categories for services
export const SERVICE_CATEGORIES = [
    'general',
    'coding',
    'writing',
    'research',
    'data',
    'creative',
    'automation',
    'consulting',
];
function rowToService(row) {
    return {
        id: row.id,
        providerId: row.provider_id,
        title: row.title,
        description: row.description,
        category: row.category,
        basePrice: row.base_price,
        isActive: row.is_active === 1,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
export function createService(request) {
    const db = getDb();
    // Verify provider exists
    const provider = getAgentById(request.providerId);
    if (!provider) {
        throw new Error('Provider agent not found');
    }
    const id = uuid();
    const now = new Date().toISOString();
    const category = request.category || 'general';
    const stmt = db.prepare(`
    INSERT INTO services (id, provider_id, title, description, category, base_price, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
    stmt.run(id, request.providerId, request.title, request.description, category, request.basePrice, now, now);
    return {
        id,
        providerId: request.providerId,
        title: request.title,
        description: request.description,
        category,
        basePrice: request.basePrice,
        isActive: true,
        createdAt: new Date(now),
        updatedAt: new Date(now),
    };
}
export function getServiceById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    return row ? rowToService(row) : null;
}
export function getServicesByProvider(providerId) {
    const db = getDb();
    const rows = db.prepare(`
    SELECT * FROM services 
    WHERE provider_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `).all(providerId);
    return rows.map(rowToService);
}
export function listServices(options = {}) {
    const db = getDb();
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    let query = 'SELECT * FROM services WHERE is_active = 1';
    const params = [];
    if (options.category) {
        query += ' AND category = ?';
        params.push(options.category);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const rows = db.prepare(query).all(...params);
    return rows.map(rowToService);
}
export function updateService(id, updates) {
    const db = getDb();
    const now = new Date().toISOString();
    // Build dynamic update query
    const fields = ['updated_at = ?'];
    const values = [now];
    if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
    }
    if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
    }
    if (updates.category !== undefined) {
        fields.push('category = ?');
        values.push(updates.category);
    }
    if (updates.basePrice !== undefined) {
        fields.push('base_price = ?');
        values.push(updates.basePrice);
    }
    if (updates.isActive !== undefined) {
        fields.push('is_active = ?');
        values.push(updates.isActive ? 1 : 0);
    }
    values.push(id); // WHERE clause
    const stmt = db.prepare(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    if (result.changes === 0)
        return null;
    return getServiceById(id);
}
