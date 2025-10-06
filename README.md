# SA - Student Academy Management System

A production-ready educational management## 🔧 Management Commands

### Production Management

```bash
# Application Management
npm run status          # Check PM2 status
npm run restart         # Restart application
npm run stop           # Stop application
npm run logs:app       # View application logs
npm run logs:error     # View error logs

# System Monitoring
npm run monitor        # Full system health report
npm run health         # Quick health check
npm run backup         # Create database backup

# Database Management
npm run db:push        # Update database schema
npm run db:studio      # Open database management UI
npm run db:generate    # Generate migrations
npm run db:migrate     # Run migrations

# Docker Management (if using Docker)
npm run docker:up      # Start PostgreSQL container
npm run docker:down    # Stop containers
npm run docker:logs    # View PostgreSQL logs
```

### System Administration

```bash
# View detailed system status
./monitor.sh

# Check application health
./health-check.sh

# Create database backup
./backup.sh

# Full deployment/update
./deploy.sh
```ode.js, PostgreSQL, React, and TypeScript.

## 🏗️ Architecture

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Authentication**: Passport.js with sessions

## 🚀 Production Deployment

### Automated Deployment (Recommended)

1. **Clone the repository on your Ubuntu VPS**:
```bash
git clone https://github.com/sahidx/sa.git
cd sa
```

2. **Run the automated deployment script**:
```bash
./deploy.sh
```

This script will:
- ✅ Install and configure PostgreSQL
- ✅ Set up environment variables
- ✅ Install dependencies and build the application
- ✅ Configure PM2 for process management
- ✅ Set up Nginx as reverse proxy
- ✅ Configure SSL-ready virtual host
- ✅ Set up automatic startup scripts

### Manual Setup (Advanced Users)

#### Option 1: Native PostgreSQL Setup

1. **Install PostgreSQL**:
```bash
sudo apt update && sudo apt install postgresql postgresql-contrib
```

2. **Create database and user**:
```bash
sudo -u postgres createdb sa_production
sudo -u postgres createuser sa_user
sudo -u postgres psql -c "ALTER USER sa_user PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sa_production TO sa_user;"
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Install dependencies and deploy**:
```bash
npm install
npm run build
npm run db:push
```

#### Option 2: Docker Setup

1. **Start services**:
```bash
npm run docker:up
```

2. **Configure and deploy**:
```bash
cp .env.example .env
# Update DATABASE_URL for Docker: postgresql://sa_user:your_secure_password_here@localhost:5432/sa_production
npm install
npm run db:push
npm run build
```

## 📊 Database Management

### Available Commands

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema changes (development)
npm run db:push

# Reset database (destructive)
npm run db:reset

# Open Drizzle Studio
npm run db:studio
```

### Database Schema

The database uses snake_case naming convention for all tables and columns:

- `users` - User management (students, teachers, super_users)
- `batches` - Class/batch management
- `exams` - Exam management
- `questions` - Question bank
- `exam_submissions` - Student exam submissions
- `attendance` - Student attendance tracking
- `student_fees` - Fee management
- `monthly_exams` - Monthly exam periods
- `individual_exams` - Individual exams within monthly periods
- `monthly_marks` - Marks for individual exams
- `monthly_results` - Calculated monthly results with ranks
- `sms_logs` - SMS communication logs
- `sms_templates` - SMS templates
- `notices` - System notices
- `settings` - System configuration
- `syllabus_classes` - Academic classes
- `syllabus_subjects` - Subjects per class
- `syllabus_chapters` - Chapters per subject
- `online_exams` - Online examination system
- `exam_questions` - Questions for online exams
- `exam_attempts` - Student exam attempts
- `attempt_answers` - Student answers

## 🔧 Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Application
NODE_ENV=production
PORT=3000
SESSION_SECRET=your_secure_session_secret

# SMS Configuration
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=your_sender_id
SMS_API_URL=your_sms_api_url

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛡️ Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **Session Management**: Secure session storage with PostgreSQL
- **Rate Limiting**: Configurable request rate limiting
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM
- **CORS Protection**: Configurable CORS settings

## 📈 Production Considerations

### Database Optimization

- Connection pooling with configurable limits
- Proper indexing on frequently queried columns
- UUID primary keys for better performance
- Timestamp columns with automatic updates

### Monitoring

- Database connection health checks
- Error logging and monitoring
- Performance metrics tracking
- Query duration logging

### Backup Strategy

```bash
# Create database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_file.sql
```

## 🚦 Performance Tuning

### PostgreSQL Configuration

The setup script configures PostgreSQL with production-ready settings:

- `shared_buffers = 256MB`
- `effective_cache_size = 1GB`
- `max_connections = 200`
- Query logging for optimization

### Application Performance

- Connection pooling (5-20 connections)
- Query timeout settings
- Graceful shutdown handling
- Memory-efficient data processing

## 📱 Features

### Student Management
- Student registration and profiles
- Batch assignment and management
- Attendance tracking
- Fee management

### Examination System
- Online exam creation and management
- Question bank with categories
- Automated scoring
- Monthly exam management with rankings

### Communication
- SMS notification system
- Customizable SMS templates
- Bulk messaging capabilities

### Analytics
- Student performance tracking
- Attendance reports
- Fee collection reports
- Exam result analysis

## 🔍 Troubleshooting

### Database Connection Issues

1. Check PostgreSQL service status:
```bash
sudo systemctl status postgresql
```

2. Verify database credentials:
```bash
psql $DATABASE_URL -c "SELECT NOW();"
```

3. Check logs:
```bash
npm run docker:logs  # For Docker setup
sudo journalctl -u postgresql  # For manual setup
```

### Migration Issues

1. Check migration status:
```bash
npm run db:studio
```

2. Reset database (development only):
```bash
npm run db:reset
```

## 📝 Development

### Code Style

- TypeScript strict mode enabled
- ESLint and Prettier configured
- Snake_case for database columns
- CamelCase for TypeScript interfaces

### Testing

```bash
npm run test
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)