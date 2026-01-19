/**
 * Database Seed Script
 * Creates sample data for testing and demonstration
 *
 * Usage: node src/scripts/seed.js
 */

// Load environment variables FIRST
require('dotenv').config({ path: './src/config/config.env' });

const { sequelize } = require('../config/db');
const {
  User,
  Application,
  Document,
  Notification,
  LicensePrice,
  ApplicationStatusHistory,
  News,
} = require('../models');

const bcrypt = require('bcryptjs');

// Configuration
const DEFAULT_PASSWORD = 'Test@123';

// Helper to hash password
const hashPassword = async password => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Seed Users
const seedUsers = async () => {
  console.log('🔄 Seeding users...');

  const users = [
    // Super Admin
    {
      nationalId: '29912345678901',
      firstNameAr: 'أحمد',
      lastNameAr: 'المشرف',
      phone: '01012345678',
      passwordHash: DEFAULT_PASSWORD,
      role: 'super_admin',
      status: 'active',
    },
    // Admins
    {
      nationalId: '29912345678902',
      firstNameAr: 'محمد',
      lastNameAr: 'الإداري',
      phone: '01112345678',
      passwordHash: DEFAULT_PASSWORD,
      role: 'admin',
      status: 'active',
    },
    {
      nationalId: '29912345678903',
      firstNameAr: 'فاطمة',
      lastNameAr: 'المسؤولة',
      phone: '01212345678',
      passwordHash: DEFAULT_PASSWORD,
      role: 'admin',
      status: 'active',
    },
    // Citizens
    {
      nationalId: '29912345678904',
      firstNameAr: 'علي',
      lastNameAr: 'الصياد',
      phone: '01512345678',
      passwordHash: DEFAULT_PASSWORD,
      role: 'citizen',
      status: 'active',
    },
    {
      nationalId: '29912345678905',
      firstNameAr: 'حسن',
      lastNameAr: 'المركبي',
      phone: '01612345678',
      passwordHash: DEFAULT_PASSWORD,
      role: 'citizen',
      status: 'active',
    },
    {
      nationalId: '29912345678906',
      firstNameAr: 'سالم',
      lastNameAr: 'التاجر',
      phone: '01712345678',
      passwordHash: DEFAULT_PASSWORD,
      role: 'citizen',
      status: 'active',
    },
    {
      nationalId: '29912345678907',
      firstNameAr: 'خالد',
      lastNameAr: 'المندوب',
      phone: '01812345678',
      passwordHash: DEFAULT_PASSWORD,
      role: 'citizen',
      status: 'active',
    },
    {
      nationalId: '29912345678908',
      firstNameAr: 'يوسف',
      lastNameAr: 'الشيال',
      phone: '01912345678',
      passwordHash: DEFAULT_PASSWORD,
      role: 'citizen',
      status: 'active',
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const [user] = await User.findOrCreate({
      where: { nationalId: userData.nationalId },
      defaults: userData,
    });
    createdUsers.push(user);
  }

  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
};

// Seed License Prices
const seedPrices = async adminId => {
  console.log('🔄 Seeding license prices...');

  const today = new Date().toISOString().split('T')[0];

  const prices = [
    // Fisherman categories
    {
      licenseType: 'fisherman',
      category: 'صياد',
      price: 500,
      isRenewalPrice: false,
    },
    {
      licenseType: 'fisherman',
      category: 'صياد',
      price: 300,
      isRenewalPrice: true,
    },
    {
      licenseType: 'fisherman',
      category: 'صياد تحت السن',
      price: 250,
      isRenewalPrice: false,
    },
    {
      licenseType: 'fisherman',
      category: 'صياد تحت السن',
      price: 150,
      isRenewalPrice: true,
    },
    {
      licenseType: 'fisherman',
      category: 'مندوب',
      price: 400,
      isRenewalPrice: false,
    },
    {
      licenseType: 'fisherman',
      category: 'مندوب',
      price: 250,
      isRenewalPrice: true,
    },
    {
      licenseType: 'fisherman',
      category: 'تاجر',
      price: 1000,
      isRenewalPrice: false,
    },
    {
      licenseType: 'fisherman',
      category: 'تاجر',
      price: 700,
      isRenewalPrice: true,
    },
    {
      licenseType: 'fisherman',
      category: 'عامل تاجر',
      price: 350,
      isRenewalPrice: false,
    },
    {
      licenseType: 'fisherman',
      category: 'عامل تاجر',
      price: 200,
      isRenewalPrice: true,
    },
    {
      licenseType: 'fisherman',
      category: 'شيال',
      price: 200,
      isRenewalPrice: false,
    },
    {
      licenseType: 'fisherman',
      category: 'شيال',
      price: 100,
      isRenewalPrice: true,
    },
    // Boat/Vehicle
    {
      licenseType: 'boat',
      category: 'مركب',
      price: 2000,
      isRenewalPrice: false,
    },
    {
      licenseType: 'boat',
      category: 'مركب',
      price: 1500,
      isRenewalPrice: true,
    },
    {
      licenseType: 'vehicle',
      category: 'سيارة',
      price: 1500,
      isRenewalPrice: false,
    },
    {
      licenseType: 'vehicle',
      category: 'سيارة',
      price: 1000,
      isRenewalPrice: true,
    },
    {
      licenseType: 'individual_float',
      category: 'عائمة أفراد',
      price: 800,
      isRenewalPrice: false,
    },
    {
      licenseType: 'individual_float',
      category: 'عائمة أفراد',
      price: 500,
      isRenewalPrice: true,
    },
  ];

  let count = 0;
  for (const priceData of prices) {
    await LicensePrice.findOrCreate({
      where: {
        licenseType: priceData.licenseType,
        category: priceData.category,
        isRenewalPrice: priceData.isRenewalPrice,
      },
      defaults: {
        ...priceData,
        effectiveFrom: today,
        createdBy: adminId,
        isActive: true,
      },
    });
    count++;
  }

  console.log(`✅ Created ${count} license prices`);
};

// Seed Applications
const seedApplications = async (users, adminId) => {
  console.log('🔄 Seeding applications...');

  const citizens = users.filter(u => u.role === 'citizen');

  const applicationData = [
    {
      userId: citizens[0].id,
      applicationType: 'fisherman',
      licenseCategory: 'صياد',
      isRenewal: false,
      status: 'received',
      data: { governorate: 'شمال سيناء', dateOfBirth: '1985-05-15' },
    },
    {
      userId: citizens[0].id,
      applicationType: 'fisherman',
      licenseCategory: 'صياد',
      isRenewal: true,
      status: 'under_review',
      data: { governorate: 'شمال سيناء', dateOfBirth: '1985-05-15' },
    },
    {
      userId: citizens[1].id,
      applicationType: 'boat',
      licenseCategory: 'مركب',
      isRenewal: false,
      status: 'approved_payment_required',
      paymentAmount: 2000,
      supplyOrderId: 'SO-TEST-001',
      data: { boatName: 'البركة', registrationNumber: 'BRD-1234' },
    },
    {
      userId: citizens[2].id,
      applicationType: 'fisherman',
      licenseCategory: 'تاجر',
      isRenewal: false,
      status: 'payment_verified',
      paymentAmount: 1000,
      supplyOrderId: 'SO-TEST-002',
      data: { governorate: 'شمال سيناء' },
    },
    {
      userId: citizens[3].id,
      applicationType: 'fisherman',
      licenseCategory: 'مندوب',
      isRenewal: false,
      status: 'ready',
      paymentAmount: 400,
      supplyOrderId: 'SO-TEST-003',
      data: { governorate: 'شمال سيناء' },
    },
    {
      userId: citizens[4].id,
      applicationType: 'fisherman',
      licenseCategory: 'شيال',
      isRenewal: false,
      status: 'completed',
      paymentAmount: 200,
      supplyOrderId: 'SO-TEST-004',
      data: { governorate: 'شمال سيناء' },
    },
    {
      userId: citizens[0].id,
      applicationType: 'vehicle',
      licenseCategory: 'سيارة',
      isRenewal: false,
      status: 'rejected',
      rejectionReason: 'المستندات غير مكتملة',
      data: { vehicleName: 'نقل البضائع', plateNumber: 'س ي ن 1234' },
    },
  ];

  const createdApps = [];
  for (const appData of applicationData) {
    const applicationNumber = await Application.generateApplicationNumber();
    const [app] = await Application.findOrCreate({
      where: { applicationNumber },
      defaults: {
        ...appData,
        applicationNumber,
        submittedAt: new Date(),
        reviewedBy: [
          'under_review',
          'approved_payment_required',
          'payment_verified',
          'ready',
          'completed',
          'rejected',
        ].includes(appData.status)
          ? adminId
          : null,
      },
    });
    createdApps.push(app);

    // Add status history
    await ApplicationStatusHistory.create({
      applicationId: app.id,
      oldStatus: null,
      newStatus: 'received',
      changedBy: app.userId,
      notes: 'تم تقديم الطلب',
    });

    if (appData.status !== 'received') {
      await ApplicationStatusHistory.create({
        applicationId: app.id,
        oldStatus: 'received',
        newStatus: appData.status,
        changedBy: adminId,
        notes: 'تم تحديث الحالة',
      });
    }
  }

  console.log(`✅ Created ${createdApps.length} applications`);
  return createdApps;
};

// Seed News
const seedNews = async adminId => {
  console.log('🔄 Seeding news articles...');

  const newsData = [
    {
      titleAr: 'افتتاح موسم الصيد الجديد في بحيرة البردويل',
      contentAr:
        'يسر جهاز مستقبل مصر للتنمية المستدامة الإعلان عن افتتاح موسم الصيد الجديد في بحيرة البردويل. نتمنى التوفيق لجميع الصيادين. يبدأ الموسم هذا العام مع توقعات بإنتاج وفير من أسماك الدنيس والقاروص واللوت.',
      category: 'announcement',
      isPublished: true,
      isPinned: true,
      publishedAt: new Date(),
      createdBy: adminId,
    },
    {
      titleAr: 'تحديث إجراءات التراخيص الإلكترونية',
      contentAr:
        'تم تحديث نظام التراخيص الإلكترونية ليصبح أسرع وأسهل. يمكنكم الآن متابعة طلباتكم بشكل مباشر من خلال البوابة. كما تم إضافة خدمة الإشعارات الفورية لإبلاغكم بأي تحديثات على طلباتكم.',
      category: 'news',
      isPublished: true,
      publishedAt: new Date(),
      createdBy: adminId,
    },
    {
      titleAr: 'بحيرة البردويل: كنز مصر الساحلي',
      contentAr:
        'تعد بحيرة البردويل من أهم البحيرات الساحلية في مصر، وتقع على الساحل الشمالي لشبه جزيرة سيناء. تبلغ مساحتها حوالي 650 كيلومتر مربع، وتشتهر بإنتاج أجود أنواع الأسماك مثل الدنيس والوقار والموسى.',
      category: 'news',
      isPublished: true,
      publishedAt: new Date(Date.now() - 3600000 * 24 * 2),
      createdBy: adminId,
    },
    {
      titleAr: 'إعلان مواعيد تسليم رخص الصيد',
      contentAr:
        'نعلن لجميع الصيادين أن تسليم رخص الصيد للموسم الجديد سيكون من خلال المنافذ المعتمدة في مناطق: اغزوان، النصر، التلول. يرجى إحضار صورة البطاقة الشخصية وإيصال السداد.',
      category: 'announcement',
      isPublished: true,
      publishedAt: new Date(Date.now() - 3600000 * 24 * 5),
      createdBy: adminId,
    },
    {
      titleAr: 'مشروع تطوير البنية التحتية لصناعة الصيد',
      contentAr:
        'يعمل جهاز مستقبل مصر على تطوير البنية التحتية لصناعة الصيد في منطقة البردويل، بما يشمل تحديث المراسي وإنشاء مراكز تجميع وتبريد حديثة للحفاظ على جودة الأسماك.',
      category: 'news',
      isPublished: true,
      publishedAt: new Date(Date.now() - 3600000 * 24 * 7),
      createdBy: adminId,
    },
    {
      titleAr: 'تحذير: ممنوع الصيد في مناطق المحميات',
      contentAr:
        'نذكر جميع الصيادين بضرورة الالتزام بقوانين الصيد وعدم الصيد في المناطق المحمية. يعاقب المخالفون بالغرامات المقررة وسحب رخصة الصيد.',
      category: 'alert',
      isPublished: true,
      publishedAt: new Date(Date.now() - 3600000 * 24 * 10),
      createdBy: adminId,
    },
  ];

  let count = 0;
  for (const news of newsData) {
    await News.findOrCreate({
      where: { titleAr: news.titleAr },
      defaults: news,
    });
    count++;
  }

  console.log(`✅ Created ${count} news articles`);
};

// Seed Notifications
const seedNotifications = async (users, applications) => {
  console.log('🔄 Seeding notifications...');

  const notifications = [];

  for (const app of applications) {
    notifications.push({
      userId: app.userId,
      type: 'application_received',
      title: 'تم استلام طلبك',
      message: `تم استلام طلبك رقم ${app.applicationNumber} بنجاح`,
      applicationId: app.id,
      isRead: false,
    });
  }

  let count = 0;
  for (const notif of notifications) {
    await Notification.findOrCreate({
      where: {
        userId: notif.userId,
        applicationId: notif.applicationId,
        type: notif.type,
      },
      defaults: notif,
    });
    count++;
  }

  console.log(`✅ Created ${count} notifications`);
};

// Main seed function
const seed = async () => {
  console.log('\n🌱 Starting database seeding...\n');

  try {
    // Sync database
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized\n');

    // Seed in order
    const users = await seedUsers();
    const superAdmin = users.find(u => u.role === 'super_admin');

    await seedPrices(superAdmin.id);
    const applications = await seedApplications(users, superAdmin.id);
    await seedNews(superAdmin.id);
    await seedNotifications(users, applications);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📋 Test Accounts:');
    console.log('   Super Admin: 29912345678901 / Test@123');
    console.log('   Admin: 29912345678902 / Test@123');
    console.log('   Citizen: 29912345678904 / Test@123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seed
seed();
