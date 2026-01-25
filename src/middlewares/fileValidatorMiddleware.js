const AppError = require('../utils/appError');

/**
 * Validate presence of required files based on application type and category
 * Should be used AFTER multer middleware
 * 
 * IMPORTANT: This validator must match the document codes defined in:
 * - seeds/requiredDocuments.seed.js
 * - Frontend dynamic document rendering
 */
exports.validateRequiredFiles = (req, res, next) => {
  if (!req.files) {
    return next(new AppError(400, 'لم يتم رفع أي ملفات'));
  }

  const { applicationType, licenseCategory, isRenewal } = req.body;
  const files = req.files;
  const missingFiles = [];

  // Normalize category for comparison
  let cleanCategory = (licenseCategory || '').trim();
  if (cleanCategory.normalize) {
    cleanCategory = cleanCategory.normalize('NFC');
  }

  // Helper to check if file field exists
  const checkFile = (fieldName, label) => {
    if (!files[fieldName] || files[fieldName].length === 0) {
      missingFiles.push(label);
    }
  };

  // ============================================
  // FISHERMAN - 4 categories
  // ============================================
  if (applicationType === 'fisherman') {
    // Common documents for most fisherman types
    checkFile('nationalIdImage', 'صورة البطاقة الشخصية');
    checkFile('personalPhoto', 'صورة شخصية');

    if (cleanCategory === 'صياد مؤمن عليه') {
      checkFile('criminalRecord', 'فيش جنائي');
      checkFile('militaryStatus', 'موقف التجنيد');
      checkFile('insurancePhoto', 'صورة كارنيه التأمينات');
    } else if (cleanCategory === 'صياد غير مؤمن عليه') {
      checkFile('criminalRecord', 'فيش جنائي');
      checkFile('militaryStatus', 'موقف التجنيد');
    } else if (cleanCategory === 'صياد تحت السن') {
      // Only needs: nationalIdImage, personalPhoto, renewalForm (guardian approval)
      // NO criminalRecord, NO militaryStatus
      checkFile('renewalForm', 'موافقة ولي الأمر');
    } else if (cleanCategory === 'صيد رجلي') {
      checkFile('criminalRecord', 'فيش جنائي');
      // nationalIdImage, personalPhoto already checked
    }
  }

  // ============================================
  // BOAT - 4 categories
  // ============================================
  else if (applicationType === 'boat') {
    // Common for all boat types
    checkFile('ownerPhoto', 'صورة البطاقة الشخصية');

    if (cleanCategory === 'مركب خاص') {
      checkFile('associationLetter', 'خطاب الجمعية');
      checkFile('taxReceipt', 'إيصال الضرائب');
      // previousLicense is optional (only for renewals)
    } else if (cleanCategory === 'مركب الجهاز') {
      checkFile('associationLetter', 'خطاب الجمعية');
      checkFile('renewalForm', 'مستندات نقل الملكية من الجهاز');
      checkFile('taxReceipt', 'إيصال الضرائب');
    } else if (cleanCategory === 'تغيير مرسي') {
      checkFile('previousLicense', 'ترخيص المركب الساري');
      checkFile('associationLetter', 'خطاب موافقة الجمعية الجديدة');
    } else if (cleanCategory === 'تغيير موتور') {
      checkFile('previousLicense', 'ترخيص المركب الساري');
      checkFile('taxReceipt', 'فاتورة شراء الموتور الجديد');
    }
  }

  // ============================================
  // VEHICLE - 2 categories
  // ============================================
  else if (applicationType === 'vehicle') {
    checkFile('criminalRecord', 'فيش جنائي');
    checkFile('nationalIdImage', 'صورة البطاقة الشخصية');

    if (cleanCategory === 'سيارة') {
      checkFile('vehicleLicense', 'رخصة السيارة سارية');
      checkFile('driverLicense', 'رخصة القيادة سارية');
    } else if (cleanCategory === 'تروسيكل') {
      checkFile('vehicleLicense', 'رخصة التروسيكل');
    }
  }

  // ============================================
  // TRADE - 5 categories
  // ============================================
  else if (applicationType === 'trade') {
    // فيش جنائي مطلوب لكل أنواع التجارة
    checkFile('criminalRecord', 'فيش جنائي');
    checkFile('nationalIdImage', 'صورة البطاقة الشخصية');

    if (cleanCategory === 'تاجر' || cleanCategory === 'مندوب') {
      checkFile('insuranceLetter', 'صورة السجل التجاري');
      checkFile('taxReceipt', 'صورة البطاقة الضريبية');
    } else if (cleanCategory === 'عامل تاجر') {
      checkFile('associationLetter', 'خطاب من التاجر');
      checkFile('personalPhoto', 'صورة شخصية');
    } else if (cleanCategory === 'تاجر خارج المحافظة') {
      checkFile('insuranceLetter', 'صورة السجل التجاري');
      checkFile('taxReceipt', 'صورة البطاقة الضريبية');
      checkFile('renewalForm', 'خطاب الغرفة التجارية');
    } else if (cleanCategory === 'بياع') {
      checkFile('personalPhoto', 'صورة شخصية');
    }
  }

  // ============================================
  // ENTRY - 4 categories
  // ============================================
  else if (applicationType === 'entry') {
    checkFile('nationalIdImage', 'صورة البطاقة الشخصية');
    checkFile('personalPhoto', 'صورة شخصية');

    if (cleanCategory === 'شيال') {
      checkFile('criminalRecord', 'فيش جنائي');
    } else if (cleanCategory === 'نجار' || cleanCategory === 'ميكانيكي') {
      checkFile('renewalForm', 'شهادة خبرة في المهنة');
    } else if (cleanCategory === 'أفراد شركات') {
      checkFile('associationLetter', 'خطاب من الشركة');
    }
  }

  // If any files are missing, return error
  if (missingFiles.length > 0) {
    return next(
      new AppError(400, `الملفات التالية مطلوبة: ${missingFiles.join('، ')}`)
    );
  }

  next();
};
