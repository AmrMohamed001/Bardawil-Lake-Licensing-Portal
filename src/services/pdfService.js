/**
 * PDF Service - specialized for Data Preparation
 * Returns JSON data for Frontend PDF generation/Printing
 */

// License type translations
const licenseTypeArabic = {
  fisherman: 'رخصة صيد (أفراد)',
  boat: 'رخصة مركب صيد',
  vehicle: 'رخصة سيارة نقل أسماك',
};

/**
 * Generate Supply Order Data
 */
exports.generateSupplyOrder = async (application, user) => {
  const issueDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // QR Code Data (Raw String)
  // Frontend should generate the QR image from this string
  const qrData = JSON.stringify({
    orderId: application.supplyOrderId,
    appNo: application.applicationNumber,
    amount: application.paymentAmount,
  });

  return {
    type: 'supply_order',
    meta: {
      generatedAt: issueDate,
      title: 'أمر توريد للخزانة',
      entity: 'جهاز مستقبل مصر للتنمية المستدامة',
      location: 'بحيرة البردويل - شمال سيناء',
    },
    order: {
      id: application.supplyOrderId,
      amount: application.paymentAmount,
      currency: 'جنيه مصري',
    },
    applicant: {
      name: `${user.firstNameAr || ''} ${user.lastNameAr || ''}`.trim(),
      nationalId: user.nationalId,
      phone: user.phone,
    },
    application: {
      number: application.applicationNumber,
      type:
        licenseTypeArabic[application.applicationType] ||
        application.applicationType,
      category: application.licenseCategory,
    },
    qrData: qrData, // Raw string for frontend to generate QR
    instructions: [
      'يرجى التوجه إلى القسم المالي مع هذا المستند',
      'قم بدفع المبلغ المحدد أعلاه',
      'احصل على وصل استلام نقدية',
      'قم برفع صورة الوصل على النظام الإلكتروني',
      'سيتم مراجعة الإيصال خلال 3-5 أيام عمل',
    ],
  };
};

/**
 * Generate License Certificate Data
 */
exports.generateLicenseCertificate = async (application, user) => {
  const issueDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate expiry date based on application duration
  let daysToAdd = 270; // Default: season (9 months)
  const duration = application.duration;
  if (duration === '1_month') {
    daysToAdd = 30;
  } else if (duration === '3_months') {
    daysToAdd = 90;
  } else if (duration === 'season') {
    daysToAdd = 270; // 9 months
  }

  const expiryDate = new Date(
    Date.now() + daysToAdd * 24 * 60 * 60 * 1000
  ).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // QR Code Data (Raw String)
  // Frontend should generate the QR image from this string
  const qrData = JSON.stringify({
    licenseNo: application.applicationNumber,
    nationalId: user.nationalId,
    type: application.applicationType,
  });

  return {
    type: 'license_certificate',
    meta: {
      generatedAt: issueDate,
      title: 'شهادة ترخيص',
      entity: 'جهاز مستقبل مصر للتنمية المستدامة',
      location: 'بحيرة البردويل - شمال سيناء',
    },
    license: {
      number: application.applicationNumber,
      type:
        licenseTypeArabic[application.applicationType] ||
        application.applicationType,
      category: application.licenseCategory,
      fees: application.paymentAmount,
      currency: 'جنيه مصري',
      validUntil: expiryDate,
      issueDate: issueDate,
    },
    applicant: {
      name: `${user.firstNameAr || ''} ${user.lastNameAr || ''}`.trim(),
      nationalId: user.nationalId,
      phone: user.phone,
    },
    qrData: qrData, // Raw string for frontend to generate QR
    footer: 'هذا المستند صادر إلكترونياً ولا يحتاج إلى توقيع أو ختم',
  };
};
