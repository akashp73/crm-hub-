import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

async function main() {
  console.log('🌱 Seeding database...');

  const institution = await prisma.institution.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo University',
      subdomain: 'demo',
      logoUrl: 'https://via.placeholder.com/200',
      planType: 'PRO',
      apiKey: 'demo_api_key_12345'
    }
  });

  console.log('✅ Institution created:', institution.name);

  const adminPassword = await hashPassword('Demo@1234');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.edu' },
    update: {},
    create: {
      institutionId: institution.id,
      name: 'Admin User',
      email: 'admin@demo.edu',
      passwordHash: adminPassword,
      role: 'ADMIN'
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.edu' },
    update: {},
    create: {
      institutionId: institution.id,
      name: 'Manager User',
      email: 'manager@demo.edu',
      passwordHash: adminPassword,
      role: 'MANAGER'
    }
  });

  const counsellor = await prisma.user.upsert({
    where: { email: 'counsellor@demo.edu' },
    update: {},
    create: {
      institutionId: institution.id,
      name: 'Counsellor User',
      email: 'counsellor@demo.edu',
      passwordHash: adminPassword,
      role: 'COUNSELLOR'
    }
  });

  console.log('✅ Users created: Admin, Manager, Counsellor');

  const scoreRules = [
    { activityType: 'form_fill', points: 15 },
    { activityType: 'app_open', points: 5 },
    { activityType: 'module_viewed', points: 8 },
    { activityType: 'webinar_attended', points: 20 },
    { activityType: 'payment_initiated', points: 25 },
    { activityType: 'email_opened', points: 3 },
    { activityType: 'whatsapp_replied', points: 10 }
  ];

  for (const rule of scoreRules) {
    await prisma.scoreRule.upsert({
      where: { institutionId_activityType: { institutionId: institution.id, activityType: rule.activityType } },
      update: {},
      create: {
        institutionId: institution.id,
        activityType: rule.activityType,
        points: rule.points
      }
    });
  }

  console.log('✅ Score rules created');

  const sampleLeads = [
    { name: 'John Doe', email: 'john@example.com', phone: '+1-234-567-0001', course: 'Computer Science', source: 'WEBSITE', score: 85 },
    { name: 'Jane Smith', email: 'jane@example.com', phone: '+1-234-567-0002', course: 'Business', source: 'FACEBOOK', score: 92 },
    { name: 'Mike Johnson', email: 'mike@example.com', phone: '+1-234-567-0003', course: 'Engineering', source: 'GOOGLE', score: 75 },
    { name: 'Sarah Williams', email: 'sarah@example.com', phone: '+1-234-567-0004', course: 'Data Science', source: 'REFERRAL', score: 65 },
    { name: 'Tom Brown', email: 'tom@example.com', phone: '+1-234-567-0005', course: 'MBA', source: 'WALK_IN', score: 45 },
    { name: 'Emily Davis', email: 'emily@example.com', phone: '+1-234-567-0006', course: 'Law', source: 'WEBSITE', score: 88 },
    { name: 'Chris Wilson', email: 'chris@example.com', phone: '+1-234-567-0007', course: 'Medicine', source: 'GOOGLE', score: 78 },
    { name: 'Lisa Anderson', email: 'lisa@example.com', phone: '+1-234-567-0008', course: 'Architecture', source: 'FACEBOOK', score: 25 },
    { name: 'David Martinez', email: 'david@example.com', phone: '+1-234-567-0009', course: 'Engineering', source: 'REFERRAL', score: 55 },
    { name: 'Sophie Taylor', email: 'sophie@example.com', phone: '+1-234-567-0010', course: 'Psychology', source: 'WEBSITE', score: 72 },
    { name: 'James Lee', email: 'james@example.com', phone: '+1-234-567-0011', course: 'Finance', source: 'GOOGLE', score: 15 },
    { name: 'Rachel Green', email: 'rachel@example.com', phone: '+1-234-567-0012', course: 'Marketing', source: 'FACEBOOK', score: 90 },
    { name: 'Mark White', email: 'mark@example.com', phone: '+1-234-567-0013', course: 'IT', source: 'WALK_IN', score: 40 },
    { name: 'Jennifer Hall', email: 'jennifer@example.com', phone: '+1-234-567-0014', course: 'Nursing', source: 'WEBSITE', score: 82 },
    { name: 'Robert King', email: 'robert@example.com', phone: '+1-234-567-0015', course: 'Education', source: 'REFERRAL', score: 68 },
    { name: 'Amanda Clark', email: 'amanda@example.com', phone: '+1-234-567-0016', course: 'Chemistry', source: 'GOOGLE', score: 10 },
    { name: 'Kevin Young', email: 'kevin@example.com', phone: '+1-234-567-0017', course: 'Physics', source: 'FACEBOOK', score: 58 },
    { name: 'Laura Wright', email: 'laura@example.com', phone: '+1-234-567-0018', course: 'Biology', source: 'WEBSITE', score: 87 },
    { name: 'Paul Scott', email: 'paul@example.com', phone: '+1-234-567-0019', course: 'History', source: 'GOOGLE', score: 35 },
    { name: 'Michelle Green', email: 'michelle@example.com', phone: '+1-234-567-0020', course: 'Geography', source: 'WALK_IN', score: 95 }
  ];

  for (const leadData of sampleLeads) {
    const status = leadData.score > 80 ? 'QUALIFIED' : leadData.score > 50 ? 'CONTACTED' : 'NEW';
    
    await prisma.lead.upsert({
      where: { institutionId_email_phone: { institutionId: institution.id, email: leadData.email, phone: leadData.phone } },
      update: {},
      create: {
        institutionId: institution.id,
        assignedToId: leadData.score > 80 ? counsellor.id : manager.id,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        city: 'New York',
        courseInterested: leadData.course,
        source: leadData.source,
        status: status,
        activityScore: leadData.score,
        lastActivityAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      }
    });
  }

  console.log('✅ 20 sample leads created');

  const taskTitles = [
    'Follow up call',
    'Send course information',
    'Schedule counselling session',
    'Send admission forms',
    'Discuss payment options'
  ];

  const firstLead = await prisma.lead.findFirst({ where: { institutionId: institution.id } });
  for (let i = 0; i < 5; i++) {
    await prisma.task.create({
      data: {
        leadId: firstLead?.id || '',
        assignedToId: counsellor.id,
        title: taskTitles[i],
        dueAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        isCompleted: false
      }
    });
  }

  console.log('✅ 5 sample tasks created');
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Default Credentials:');
  console.log('   Email: admin@demo.edu');
  console.log('   Password: Demo@1234');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
