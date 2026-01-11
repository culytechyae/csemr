# Setup Instructions

## Development Setup

### Prerequisites
- Node.js 20 or higher
- PostgreSQL 12 or higher
- npm or yarn

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Environment Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres:M%40gesh%40020294@localhost:5432/school_emr_prod?schema=public"
JWT_SECRET="your-secret-key-here"
MALAFFI_API_URL="https://api.malaffi.ae/hl7"
MALAFFI_API_KEY="your-malaffi-api-key"
NODE_ENV="development"
PORT=3000
```

### Step 3: Database Setup

1. **Create PostgreSQL Database**:
   ```sql
   CREATE DATABASE school_emr_prod;
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Run Migrations**:
   ```bash
   npx prisma migrate dev
   ```

4. **Seed Initial Data**:
   ```bash
   npm run db:seed
   ```

This creates:
- Admin user: admin@emr.local / admin123
- 12 schools (SCH001-SCH012)
- Clinic managers for each school

### Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Production Setup

### Quick Setup (Automated)

**Windows:**
```bash
setup-production.bat
```

**Node.js (Cross-platform):**
```bash
node scripts/setup-production.js
```

### Manual Production Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Run Database Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Seed Initial Data**:
   ```bash
   npm run db:seed
   ```

5. **Build Application**:
   ```bash
   npm run build
   ```

6. **Start Production Server**:
   ```bash
   npm start
   ```

**Production server runs on port 5005** (configurable via PORT environment variable).

## Default Credentials

After seeding:
- **Admin**: admin@emr.local / admin123
- **Clinic Managers**: manager@sch001.local / manager123 (for each school)

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

## Verification

1. **Check Database**:
   ```sql
   psql -U postgres -d school_emr_prod -c "\dt"
   ```
   Should show all tables: User, School, Student, ClinicalVisit, etc.

2. **Check Application**:
   - Open: http://localhost:5005 (production) or http://localhost:3000 (development)
   - Should see login page
   - Login works with admin credentials

3. **Check Logs**:
   - Server should show: "Ready on http://localhost:5005"
   - No error messages

## Troubleshooting

### Node.js not found
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

### PostgreSQL not found
- Install PostgreSQL from https://www.postgresql.org/download/
- Or use the manual SQL commands above

### Database connection error
- Verify PostgreSQL is running
- Check password in .env file (M%40gesh%40020294)
- Verify database exists: `psql -U postgres -l`

### Port already in use
- Change PORT in .env file
- Or stop the service using the port

### Migration failed
- Ensure database exists
- Check database connection string in .env
- Verify PostgreSQL user has permissions

## Next Steps

After successful setup:
1. ✅ Server is running
2. 🌐 Open the application in your browser
3. 🔐 Login with admin credentials
4. 🔒 Change admin password
5. 📝 Start managing schools, students, and clinical visits

