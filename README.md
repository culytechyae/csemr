# School Clinic EMR System

A comprehensive Electronic Medical Records (EMR) management system for school clinics with HL7 integration for Malaffi (Abu Dhabi Health Information Exchange).

## Features

- **Multi-School Management**: Manage up to 12 schools with role-based access control
- **Student Management**: Complete student enrollment and medical history tracking
- **Clinical Visits**: Record and track all clinical visits with detailed assessments
- **HL7 Integration**: Automatic HL7 message generation and transmission to Malaffi
- **Dashboard & Reporting**: Real-time statistics and analytics
- **Role-Based Access**: Admin, Clinic Manager, Nurse, Doctor, and Staff roles

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based session management
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript

## Prerequisites

- Node.js 20 or higher
- PostgreSQL database
- npm or yarn

## Installation

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd EMR
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
```
DATABASE_URL="postgresql://postgres:M%40gesh%40020294@localhost:5432/school_emr_prod?schema=public"
JWT_SECRET="your-secret-key-here"
MALAFFI_API_URL="https://api.malaffi.ae/hl7"
MALAFFI_API_KEY="your-malaffi-api-key"
```

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data (creates admin user and 12 schools)
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Setup

**For production deployment, see [PRODUCTION.md](./PRODUCTION.md) for detailed instructions.**

Quick production setup:
```bash
# Automated setup (recommended)
node scripts/setup-production.js

# Or manual setup
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run build
npm start
```

**Production server runs on port 5005** (configurable via PORT environment variable).

## Default Credentials

After seeding:
- **Admin**: admin@emr.local / admin123
- **Clinic Managers**: manager@sch001.local / manager123 (for each school)

## Database Schema

The system includes the following main entities:

- **Users**: System users with role-based access
- **Schools**: School information (12 schools)
- **Students**: Student records with medical history
- **ClinicalVisits**: Visit records
- **ClinicalAssessments**: Detailed clinical assessments with vital signs
- **HL7Messages**: HL7 message tracking and status
- **AuditLogs**: System audit trail

## HL7 Integration

The system automatically generates HL7 v2.5 messages for:
- **ADT^A08**: Patient update messages
- **ORU^R01**: Observation result messages (with clinical assessments)

Messages are sent to Malaffi upon visit creation and tracked in the HL7 Messages section.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Schools
- `GET /api/schools` - List all schools
- `POST /api/schools` - Create school (Admin only)
- `GET /api/schools/[id]` - Get school details
- `PUT /api/schools/[id]` - Update school (Admin only)
- `DELETE /api/schools/[id]` - Deactivate school (Admin only)

### Students
- `GET /api/students` - List students (with search)
- `POST /api/students` - Create student

### Clinical Visits
- `GET /api/visits` - List visits
- `POST /api/visits` - Create visit with assessment

### HL7 Messages
- `GET /api/hl7` - List HL7 messages

## Deployment

### Netlify Deployment

The project is configured for Netlify deployment:

1. Build command: `npm run build`
2. Publish directory: `.next`
3. Node version: 20

Ensure environment variables are set in Netlify dashboard.

### Database Migrations

For production:
```bash
npm run db:migrate
```

## Security Considerations

- All API routes are protected with authentication
- Role-based access control enforced
- JWT tokens stored in httpOnly cookies
- Password hashing with bcrypt
- Audit logging for sensitive operations

## Compliance

The system is designed to comply with:
- Malaffi Key Compliance Checklist v3
- Malaffi Security Assessment guidelines
- School Clinic Data Elements requirements
- Mandatory EMR in School Clinics circular

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma migrate reset
```

## License

[Your License Here]

## Support

For issues and questions, please contact [support email].

