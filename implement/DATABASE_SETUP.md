# Database Setup Guide

Complete guide for setting up PostgreSQL database for Taaleem Clinic Management in production.

## Table of Contents

1. [PostgreSQL Installation](#postgresql-installation)
2. [Database Creation](#database-creation)
3. [User Configuration](#user-configuration)
4. [Connection Configuration](#connection-configuration)
5. [Migration Execution](#migration-execution)
6. [Backup Configuration](#backup-configuration)

---

## PostgreSQL Installation

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt-get update

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Check version
psql --version

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Linux (CentOS/RHEL)

```bash
# Install PostgreSQL
sudo yum install -y postgresql-server postgresql-contrib

# Initialize database
sudo postgresql-setup --initdb

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Follow the installation wizard
4. Remember the postgres user password you set
5. PostgreSQL service will start automatically

---

## Database Creation

### Method 1: Using psql Command Line

**Linux:**
```bash
sudo -u postgres psql
```

**Windows:**
- Open "SQL Shell (psql)" from PostgreSQL folder
- Enter password when prompted

**Create Database:**
```sql
-- Create database
CREATE DATABASE school_emr_prod;

-- Verify creation
\l
```

**Exit psql:**
```sql
\q
```

### Method 2: Using SQL Script

Create a file `create_database.sql`:

```sql
-- Create database
CREATE DATABASE school_emr_prod
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Add comment
COMMENT ON DATABASE school_emr_prod IS 'Taaleem Clinic Management Production Database';
```

**Execute:**
```bash
sudo -u postgres psql -f create_database.sql
```

---

## User Configuration

### Create Application User

**Connect as postgres user:**
```bash
sudo -u postgres psql
```

**Create user and set password:**
```sql
-- Create user
CREATE USER emr_user WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE school_emr_prod TO emr_user;

-- Grant schema privileges (if needed)
\c school_emr_prod
GRANT ALL ON SCHEMA public TO emr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO emr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO emr_user;

-- Verify
\du

-- Exit
\q
```

### Security Best Practices

1. **Use Strong Passwords:**
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, and special characters
   - Example: `Emr@Pr0d#2024!Secure$Pass`

2. **Limit Connections:**
   ```sql
   ALTER USER emr_user WITH CONNECTION LIMIT 50;
   ```

3. **Set Password Expiration (Optional):**
   ```sql
   ALTER USER emr_user WITH PASSWORD 'NEW_PASSWORD' VALID UNTIL '2025-12-31';
   ```

---

## Connection Configuration

### PostgreSQL Configuration Files

**Location:**
- Linux: `/etc/postgresql/[version]/main/`
- Windows: `C:\Program Files\PostgreSQL\[version]\data\`

### 1. Configure `postgresql.conf`

**Find and set:**
```conf
# Connection settings
listen_addresses = 'localhost'  # Or '*' for remote connections
port = 5432

# Memory settings (adjust based on server RAM)
shared_buffers = 256MB          # 25% of RAM for small servers
effective_cache_size = 1GB       # 50-75% of RAM
maintenance_work_mem = 64MB
work_mem = 4MB

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_messages = warning
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

**Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql  # Linux
# Or restart service from Services in Windows
```

### 2. Configure `pg_hba.conf`

**For local connections only (recommended):**
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

**For remote connections (if needed):**
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    school_emr_prod emr_user        10.0.0.0/8              md5
host    school_emr_prod emr_user        192.168.0.0/16          md5
```

**Reload configuration:**
```bash
sudo systemctl reload postgresql  # Linux
# Or restart service in Windows
```

---

## Migration Execution

### 1. Set Environment Variable

**In `.env` file:**
```env
DATABASE_URL="postgresql://emr_user:YOUR_PASSWORD@localhost:5432/school_emr_prod?schema=public"
```

**Connection String Format:**
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=[SCHEMA]
```

### 2. Test Connection

```bash
cd /opt/emr
npx prisma db pull  # Test connection
```

### 3. Run Migrations

```bash
# Apply all pending migrations
npx prisma migrate deploy

# This will:
# - Check migration status
# - Apply any pending migrations
# - Update database schema
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Verify Schema

```bash
# Open Prisma Studio (for verification)
npx prisma studio

# Or check via psql
psql -U emr_user -d school_emr_prod -c "\dt"
```

---

## Database Schema Overview

The application uses the following main models:

- **User** - System users (Admin, Clinic Manager, Nurse, Doctor, Staff)
- **School** - School information
- **Student** - Student records
- **ClinicalVisit** - Clinical visit records
- **ClinicalAssessment** - Visit assessments
- **HealthRecord** - Student health records
- **HL7Message** - HL7 message logs
- **EmailLog** - Email sending logs
- **Session** - User sessions
- **SecurityEvent** - Security event logs
- **AuditLog** - Audit trail
- **PasswordHistory** - Password history
- **LoginAttempt** - Login attempt logs
- **SchoolHL7Config** - Per-school HL7 configuration

---

## Backup Configuration

### 1. Manual Backup

```bash
# Full database backup
pg_dump -U emr_user -d school_emr_prod -F c -f /backup/emr_$(date +%Y%m%d_%H%M%S).dump

# SQL format backup
pg_dump -U emr_user -d school_emr_prod > /backup/emr_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Automated Backup Script

Create `/opt/emr/scripts/backup-db.sh`:

```bash
#!/bin/bash

# Configuration
DB_USER="emr_user"
DB_NAME="school_emr_prod"
BACKUP_DIR="/backup/emr"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename
BACKUP_FILE="$BACKUP_DIR/emr_$(date +%Y%m%d_%H%M%S).dump"

# Perform backup
pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove old backups
find $BACKUP_DIR -name "emr_*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Make executable:**
```bash
chmod +x /opt/emr/scripts/backup-db.sh
```

**Add to crontab (daily at 2 AM):**
```bash
crontab -e
```

Add line:
```
0 2 * * * /opt/emr/scripts/backup-db.sh >> /var/log/emr/backup.log 2>&1
```

### 3. Restore from Backup

```bash
# From compressed dump
gunzip /backup/emr/emr_20241218_020000.dump.gz
pg_restore -U emr_user -d school_emr_prod -c /backup/emr/emr_20241218_020000.dump

# From SQL file
psql -U emr_user -d school_emr_prod < /backup/emr/emr_20241218_020000.sql
```

---

## Performance Tuning

### 1. Index Optimization

The Prisma schema already includes indexes, but you can verify:

```sql
-- Check indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 2. Vacuum and Analyze

```sql
-- Manual vacuum
VACUUM ANALYZE;

-- Or schedule automatic vacuum (usually enabled by default)
```

### 3. Connection Pooling (Optional)

Consider using PgBouncer for connection pooling if you have many concurrent connections.

---

## Security Hardening

### 1. Restrict Access

- Only allow connections from application server
- Use firewall rules to restrict PostgreSQL port (5432)
- Use SSL connections for remote access

### 2. Enable SSL (for remote connections)

**In `postgresql.conf`:**
```conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

### 3. Regular Updates

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get upgrade postgresql

# CentOS/RHEL
sudo yum update postgresql-server
```

---

## Monitoring

### Check Database Size

```sql
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'school_emr_prod';
```

### Check Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Active Connections

```sql
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity
WHERE datname = 'school_emr_prod';
```

---

## Troubleshooting

### Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Check connection string:**
   - Verify username, password, host, port, database name
   - Test with `psql` command line

3. **Check pg_hba.conf:**
   - Ensure correct authentication method
   - Reload configuration after changes

### Permission Issues

```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE school_emr_prod TO emr_user;
GRANT ALL ON SCHEMA public TO emr_user;
```

### Migration Issues

```bash
# Check migration status
npx prisma migrate status

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name migration_name
```

---

## Production Database URL Examples

**Local connection:**
```
DATABASE_URL="postgresql://emr_user:Password123!@localhost:5432/school_emr_prod?schema=public"
```

**Remote connection:**
```
DATABASE_URL="postgresql://emr_user:Password123!@192.168.1.100:5432/school_emr_prod?schema=public"
```

**With SSL:**
```
DATABASE_URL="postgresql://emr_user:Password123!@db.example.com:5432/school_emr_prod?schema=public&sslmode=require"
```

**Connection Pooling (PgBouncer):**
```
DATABASE_URL="postgresql://emr_user:Password123!@localhost:6432/school_emr_prod?schema=public&pgbouncer=true"
```

---

## Next Steps

After database setup:
1. Configure environment variables (see `ENVIRONMENT_VARIABLES.md`)
2. Run application migrations
3. Seed initial data (if needed)
4. Proceed with application deployment (see `DEPLOYMENT.md`)

