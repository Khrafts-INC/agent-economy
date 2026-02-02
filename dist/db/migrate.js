#!/usr/bin/env tsx
// Run database migrations
import { initDb, closeDb } from './index.js';
console.log('🔄 Running migrations...');
initDb();
console.log('✅ Migrations complete');
closeDb();
