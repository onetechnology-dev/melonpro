const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function restore() {
  const sqlFilePath = path.resolve(__dirname, '../backup_melonpro_v1.sql');
  console.log(`Reading SQL dump from: ${sqlFilePath}`);
  let sql = fs.readFileSync(sqlFilePath, 'utf8');

  // Strip MariaDB specific comment directives that MySQL 8 does not recognize
  sql = sql.replace(/\/\*M![\s\S]*?\*\/\s*;?/g, '');

  const targetUrl = process.argv[2] || process.env.TARGET_DATABASE_URL;
  if (!targetUrl) {
    console.error('Usage: node scripts/restoreToRailway.cjs <mysql_connection_url>');
    console.error('Example: node scripts/restoreToRailway.cjs mysql://user:pass@host:port/dbname');
    process.exit(1);
  }

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Dump file not found: ${sqlFilePath}`);
    process.exit(1);
  }

  const parsed = new URL(targetUrl);

  console.log(`Connecting to target MySQL database at ${parsed.hostname}:${parsed.port}/${parsed.pathname.replace('/', '')}...`);
  const conn = await mysql.createConnection({
    host: parsed.hostname,
    port: parseInt(parsed.port || '3306', 10),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace('/', ''),
    multipleStatements: true
  });

  try {
    console.log('Connected! Executing SQL restore script...');
    const startTime = Date.now();
    await conn.query(sql);
    console.log(`Restore completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s!`);

    console.log('\n--- Verifying Tables on Railway ---');
    const [tables] = await conn.query('SHOW TABLES;');
    const tableKey = Object.keys(tables[0])[0];
    
    for (const t of tables) {
      const tableName = t[tableKey];
      const [countResult] = await conn.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      console.log(`Table: ${tableName.padEnd(25)} -> ${countResult[0].count} rows`);
    }

    console.log('\nAll tables and data restored successfully!');
  } catch (err) {
    console.error('Restore failed:');
    console.error('Code:', err.code);
    console.error('SqlMessage:', err.sqlMessage);
    console.error('SqlState:', err.sqlState);
    if (err.sql) console.error('SQL snippet:', err.sql.slice(0, 300));
    process.exit(1);
  } finally {
    await conn.end();
  }
}

restore();
