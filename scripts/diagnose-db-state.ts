
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const execAsync = util.promisify(exec);

// Configuration
const REMOTE_SSH_CMD = 'gcloud compute ssh bananabot-vm --zone=europe-north1-c';
const PRISMA_MIGRATIONS_DIR = path.join(__dirname, '../prisma/migrations');

// Types
interface ColumnInfo {
    table_name: string;
    column_name: string;
    data_type: string;
}

interface Migration {
    name: string;
    path: string;
    sql: string;
    status: 'applied' | 'pending' | 'failed';
}

async function main() {
    console.log('🔍 Starting Database Diagnosis...');

    // 1. Get Remote Schema
    console.log('📡 Fetching remote database schema...');
    // We try to get CSV output. If it fails, we continue with empty schema (just static analysis)
    const schemaCmdCsv = `${REMOTE_SSH_CMD} --command="cd ~/bananabot && sudo docker compose exec -T postgres psql -U bananabot -d bananabot -A -F, -c \\"SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public'\\""`;

    let remoteColumns: ColumnInfo[] = [];
    try {
        const { stdout } = await execAsync(schemaCmdCsv);
        const lines = stdout.split('\n');
        for (const line of lines) {
            const [table, col, type] = line.split(',');
            if (table && col && type && table !== 'table_name') { // Skip header
                remoteColumns.push({
                    table_name: table.trim().replace(/"/g, ''),
                    column_name: col.trim().replace(/"/g, ''),
                    data_type: type.trim()
                });
            }
        }
        console.log(`✅ Fetched ${remoteColumns.length} columns from remote DB.`);
    } catch (e) {
        console.warn('⚠️  Could not fetch remote schema (proceeding with static analysis only):', (e as any).message.split('\n')[0]);
    }


    // 2. Get Remote Migration Status
    console.log('📡 Fetching remote migration status...');
    const migrationStatusCmd = `${REMOTE_SSH_CMD} --command="cd ~/bananabot && sudo docker compose exec -T postgres psql -U bananabot -d bananabot -A -F, -c \\"SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at\\""`;

    const appliedMigrations = new Set<string>();
    try {
        const { stdout } = await execAsync(migrationStatusCmd);
        const lines = stdout.split('\n');
        for (const line of lines) {
            const [name, finished] = line.split(',');
            if (name && name !== 'migration_name') {
                appliedMigrations.add(name);
            }
        }
    } catch (e) {
        console.warn('⚠️  Could not fetch migration status.');
    }

    // 3. Analyze Local Migrations
    console.log('📂 Analyzing local migration files...');
    const migrationDirs = fs.readdirSync(PRISMA_MIGRATIONS_DIR).sort();

    for (const dirName of migrationDirs) {
        if (dirName === 'migration_lock.toml' || !fs.statSync(path.join(PRISMA_MIGRATIONS_DIR, dirName)).isDirectory()) continue;

        const migrationPath = path.join(PRISMA_MIGRATIONS_DIR, dirName, 'migration.sql');
        if (!fs.existsSync(migrationPath)) continue;

        const sql = fs.readFileSync(migrationPath, 'utf-8');
        const isApplied = appliedMigrations.has(dirName);

        console.log(`\n📄 Migration: ${dirName} [${isApplied ? '✅ APPLIED' : '⏳ PENDING'}]`);

        const issues: string[] = [];

        if (!isApplied) {
            // Check for Schema Conflicts
            const schemaConflicts = findSchemaConflicts(sql, remoteColumns);
            issues.push(...schemaConflicts);
        }

        // Check for Data/Integrity Logic (Always check, even if applied, for debugging retrospective)
        const integrityIssues = findIntegrityProbems(sql);
        issues.push(...integrityIssues);

        if (issues.length > 0) {
            console.log(`   ⚠️  POTENTIAL ISSUES:`);
            issues.forEach(c => console.log(`      🔴 ${c}`));
        } else if (!isApplied) {
            console.log(`   ✨ No obvious issues found.`);
        }
    }
}

function findSchemaConflicts(sql: string, existingColumns: ColumnInfo[]): string[] {
    const conflicts: string[] = [];
    const cleanSql = sql.replace(/--.*$/gm, '').replace(/\n/g, ' ');

    // Check ADD COLUMN
    const addColRegex = /ALTER\s+TABLE\s+"?(\w+)"?\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi;
    let match;
    while ((match = addColRegex.exec(cleanSql)) !== null) {
        const table = match[1];
        const col = match[2];
        if (match[0].toUpperCase().includes('IF NOT EXISTS')) continue;
        const exists = existingColumns.find(c => c.table_name === table && c.column_name === col);
        if (exists) conflicts.push(`Column '${table}.${col}' already exists in remote DB (needs IF NOT EXISTS).`);
    }

    // Check CREATE TABLE
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi;
    while ((match = createTableRegex.exec(cleanSql)) !== null) {
        const table = match[1];
        if (match[0].toUpperCase().includes('IF NOT EXISTS')) continue;
        const exists = existingColumns.some(c => c.table_name === table);
        if (exists) conflicts.push(`Table '${table}' already exists in remote DB (needs IF NOT EXISTS).`);
    }

    return conflicts;
}

function findIntegrityProbems(sql: string): string[] {
    const issues: string[] = [];
    const cleanSql = sql.replace(/--.*$/gm, ' '); // Keep lines roughly but remove comments

    // Detect Pattern: DEFAULT 'Val' ... ADD CONSTRAINT ... FOREIGN KEY ...

    // 1. Find columns with DEFAULTS being added
    // Match: ALTER TABLE "Table" ... ADD COLUMN "Col" ... DEFAULT 'Val'
    const defaultValRegex = /ALTER\s+TABLE\s+"?(\w+)"?\s+.*?ADD\s+COLUMN\s+"?(\w+)"?.*?DEFAULT\s+'([^']+)'/gis;

    // 2. Find FK Constraints
    // Match: ALTER TABLE "Table" ADD CONSTRAINT "Name" FOREIGN KEY ("Col") REFERENCES "RefTable"("RefCol")
    const fkRegex = /ALTER\s+TABLE\s+"?(\w+)"?\s+ADD\s+CONSTRAINT\s+"?(\w+)"?\s+FOREIGN\s+KEY\s*\("?(\w+)"?\)\s*REFERENCES\s+"?(\w+)"?\("?(\w+)"?\)/gis;

    const defaults = [];
    let match;
    while ((match = defaultValRegex.exec(cleanSql)) !== null) {
        defaults.push({ table: match[1], col: match[2], val: match[3] });
    }

    while ((match = fkRegex.exec(cleanSql)) !== null) {
        const table = match[1];
        const fkName = match[2];
        const col = match[3];
        const refTable = match[4];
        // match[5] is refCol

        // Check if this FK column has a default value set in this file
        const def = defaults.find(d => d.table === table && d.col === col);
        if (def) {
            // We have a default value for a Foreign Key.
            // Ensure there is an INSERT into the RefTable that includes this value.
            const insertRegex = new RegExp(`INSERT\\s+INTO\\s+"?${refTable}"?.*?VALUES.*?${escapeRegExp(def.val)}`, 'is');

            // Search in original SQL (including comments is fine, but better without)
            if (!insertRegex.test(cleanSql)) {
                issues.push(`Integrity Risk: FK '${fkName}' on '${table}.${col}' has DEFAULT '${def.val}'. 
             Referenced table '${refTable}' MUST contain this value. 
             But NO matching INSERT statement finding '${def.val}' for '${refTable}' was found in this file.
             If '${refTable}' is created in this migration, this will FAIL.`);
            }
        }
    }

    return issues;
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^$\{ ()|[\]\\]/g, '\\$&');
}

main().catch(console.error);
