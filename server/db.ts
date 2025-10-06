// Production PostgreSQL database setup
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Example: postgresql://user:password@localhost:5432/dbname",
  );
}

// Parse DATABASE_URL for better error handling
let parsedUrl;
try {
  parsedUrl = new URL(process.env.DATABASE_URL);
} catch (error) {
  throw new Error(`Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

// Production-ready pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 20,
  min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 5,
  // Timeout settings
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Wait 5 seconds for connection
  acquireTimeoutMillis: 60000, // Wait 60 seconds to acquire connection
  // SSL configuration
  ssl: process.env.NODE_ENV === 'production' && !parsedUrl.hostname.includes('localhost') 
    ? { rejectUnauthorized: false } 
    : false,
  // Query timeout
  query_timeout: 60000,
  // Application name for monitoring
  application_name: 'sa-app',
};

// Create connection pool
export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Gracefully shutting down database connections...');
  pool.end(() => {
    console.log('Database connection pool has ended');
    process.exit(0);
  });
});

// Create drizzle instance
export const db = drizzle({ client: pool, schema });

// Test database connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Only test connection in production or when explicitly requested
if (process.env.NODE_ENV === 'production' || process.env.TEST_DB_CONNECTION === 'true') {
  testConnection();
}
