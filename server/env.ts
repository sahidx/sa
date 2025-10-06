// Production environment validation and setup
import { z } from 'zod';
import crypto from 'crypto';

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3000),
  DATABASE_URL: z.string().url('Invalid database URL format'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  
  // SMS Configuration (optional)
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().default('8809617628909'),
  SMS_API_URL: z.string().url().default('http://bulksmsbd.net/api/smsapi'),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default(12),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default(10485760), // 10MB
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Database Pool
  DB_POOL_MIN: z.string().transform(Number).default(5),
  DB_POOL_MAX: z.string().transform(Number).default(20),
  
  // SSL/TLS
  HTTPS: z.string().transform(val => val === 'true').default(false),
  
  // Testing
  TEST_DB_CONNECTION: z.string().transform(val => val === 'true').default(false)
});

// Validate and export environment
function validateEnvironment() {
  try {
    // Generate session secret if not provided
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      const generated = crypto.randomBytes(32).toString('hex');
      process.env.SESSION_SECRET = generated;
      
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  Generated session secret. Please set SESSION_SECRET in .env for production!');
      }
    }
    
    const env = envSchema.parse(process.env);
    
    // Production-specific validations
    if (env.NODE_ENV === 'production') {
      // Ensure secure session secret is set
      if (env.SESSION_SECRET.includes('your_session_secret_here')) {
        throw new Error('Please set a secure SESSION_SECRET in production');
      }
      
      // Ensure database URL is not using default/example values
      if (env.DATABASE_URL.includes('your_secure_password_here') || 
          env.DATABASE_URL.includes('localhost') && !env.DATABASE_URL.includes('127.0.0.1')) {
        console.warn('⚠️  Using localhost database in production. Consider using a dedicated database server.');
      }
      
      // Warn about missing SMS configuration
      if (!env.SMS_API_KEY) {
        console.warn('⚠️  SMS_API_KEY not configured. SMS features will work in test mode only.');
      }
    }
    
    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`   ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

export const env = validateEnvironment();

// Export typed environment
export type Environment = z.infer<typeof envSchema>;

// Helper functions
export const isProduction = () => env.NODE_ENV === 'production';
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isTest = () => env.NODE_ENV === 'test';

// Database connection string parser
export const parseConnectionString = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : 5432,
      database: parsed.pathname.slice(1),
      username: parsed.username,
      password: parsed.password,
      ssl: parsed.searchParams.get('sslmode') === 'require'
    };
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${error.message}`);
  }
};

// Log startup information
console.log('🌟 SA Student Management System');
console.log(`📦 Environment: ${env.NODE_ENV}`);
console.log(`🚀 Port: ${env.PORT}`);
console.log(`🗄️  Database: ${parseConnectionString(env.DATABASE_URL).host}:${parseConnectionString(env.DATABASE_URL).port}/${parseConnectionString(env.DATABASE_URL).database}`);
console.log(`📱 SMS: ${env.SMS_API_KEY ? 'Configured' : 'Test Mode'}`);
console.log(`🔒 Session Store: PostgreSQL`);
console.log(`⚡ Rate Limiting: ${env.RATE_LIMIT_MAX_REQUESTS} requests per ${env.RATE_LIMIT_WINDOW_MS/1000}s`);
console.log('');