/**
 * Quick seed script for news data
 * Run: node src/scripts/seed-news.js
 */

require('dotenv').config({ path: './src/config/config.env' });

const { sequelize } = require('../config/db');
const { News, User } = require('../models');

const seedNews = async () => {
  console.log('🔄 Seeding news articles...\n');

  try {
    // Sync database
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced\n');

    // Find admin user
    const admin = await User.findOne({
      where: { role: 'super_admin' },
    });

    if (!admin) {
      console.log('❌ No admin user found. Please create an admin first.');
      process.exit(1);
    }

    const newsData = [
      {
        titleAr: 'افتتاح موسم الصيد الجديد في بحيرة البردويل',
        contentAr:
          'يسر جهاز مستقبل مصر للتنمية المستدامة الإعلان عن افتتاح موسم الصيد الجديد في بحيرة البردويل. نتمنى التوفيق لجميع الصيادين. يبدأ الموسم هذا العام مع توقعات بإنتاج وفير من أسماك الدنيس والقاروص واللوت.',
        category: 'announcement',
        isPublished: true,
        isPinned: true,
        publishedAt: new Date(),
        createdBy: admin.id,
      },
      {
        titleAr: 'تحديث إجراءات التراخيص الإلكترونية',
        contentAr:
          'تم تحديث نظام التراخيص الإلكترونية ليصبح أسرع وأسهل. يمكنكم الآن متابعة طلباتكم بشكل مباشر من خلال البوابة. كما تم إضافة خدمة الإشعارات الفورية لإبلاغكم بأي تحديثات على طلباتكم.',
        category: 'news',
        isPublished: true,
        publishedAt: new Date(),
        createdBy: admin.id,
      },
      {
        titleAr: 'بحيرة البردويل: كنز مصر الساحلي',
        contentAr:
          'تعد بحيرة البردويل من أهم البحيرات الساحلية في مصر، وتقع على الساحل الشمالي لشبه جزيرة سيناء. تبلغ مساحتها حوالي 650 كيلومتر مربع، وتشتهر بإنتاج أجود أنواع الأسماك مثل الدنيس والوقار والموسى.',
        category: 'news',
        isPublished: true,
        publishedAt: new Date(Date.now() - 3600000 * 24 * 2),
        createdBy: admin.id,
      },
      {
        titleAr: 'إعلان مواعيد تسليم رخص الصيد',
        contentAr:
          'نعلن لجميع الصيادين أن تسليم رخص الصيد للموسم الجديد سيكون من خلال المنافذ المعتمدة في مناطق: اغزوان، النصر، التلول. يرجى إحضار صورة البطاقة الشخصية وإيصال السداد.',
        category: 'announcement',
        isPublished: true,
        publishedAt: new Date(Date.now() - 3600000 * 24 * 5),
        createdBy: admin.id,
      },
      {
        titleAr: 'مشروع تطوير البنية التحتية لصناعة الصيد',
        contentAr:
          'يعمل جهاز مستقبل مصر على تطوير البنية التحتية لصناعة الصيد في منطقة البردويل، بما يشمل تحديث المراسي وإنشاء مراكز تجميع وتبريد حديثة للحفاظ على جودة الأسماك.',
        category: 'news',
        isPublished: true,
        publishedAt: new Date(Date.now() - 3600000 * 24 * 7),
        createdBy: admin.id,
      },
      {
        titleAr: 'تحذير: ممنوع الصيد في مناطق المحميات',
        contentAr:
          'نذكر جميع الصيادين بضرورة الالتزام بقوانين الصيد وعدم الصيد في المناطق المحمية. يعاقب المخالفون بالغرامات المقررة وسحب رخصة الصيد.',
        category: 'alert',
        isPublished: true,
        publishedAt: new Date(Date.now() - 3600000 * 24 * 10),
        createdBy: admin.id,
      },
    ];

    let created = 0;
    for (const news of newsData) {
      const [article, wasCreated] = await News.findOrCreate({
        where: { titleAr: news.titleAr },
        defaults: news,
      });
      if (wasCreated) created++;
      console.log(
        `✅ ${wasCreated ? 'Created' : 'Exists'}: ${news.titleAr.substring(0, 40)}...`
      );
    }

    const totalCount = await News.count();
    console.log(`\n🎉 Done! Created ${created} new articles.`);
    console.log(`📊 Total news in database: ${totalCount}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedNews();
