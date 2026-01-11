import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@emr.local' },
    update: {},
    create: {
      email: 'admin@emr.local',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
    },
  });

  // Create 12 schools
  const schools = [];
  for (let i = 1; i <= 12; i++) {
    const school = await prisma.school.upsert({
      where: { code: `SCH${i.toString().padStart(3, '0')}` },
      update: {},
      create: {
        code: `SCH${i.toString().padStart(3, '0')}`,
        name: `School ${i}`,
        address: `Address ${i}, Abu Dhabi, UAE`,
        phone: `+971-2-${Math.floor(Math.random() * 1000000)}`,
        email: `school${i}@example.com`,
        principalName: `Principal ${i}`,
      },
    });
    schools.push(school);
  }

  // Create clinic manager for each school
  for (const school of schools) {
    const managerPassword = await bcrypt.hash('manager123', 10);
    await prisma.user.upsert({
      where: { email: `manager@${school.code.toLowerCase()}.local` },
      update: {},
      create: {
        email: `manager@${school.code.toLowerCase()}.local`,
        passwordHash: managerPassword,
        firstName: 'Clinic',
        lastName: 'Manager',
        role: 'CLINIC_MANAGER',
        schoolId: school.id,
      },
    });
  }

  console.log('Seeding completed!');
  console.log('Admin credentials: admin@emr.local / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

