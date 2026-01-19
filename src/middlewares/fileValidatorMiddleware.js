const AppError = require('../utils/appError');

/**
 * Validate presence of required files based on application type
 * Should be used AFTER multer middleware
 */
exports.validateRequiredFiles = (req, res, next) => {
  if (!req.files) {
    return next(new AppError(400, 'لم يتم رفع أي ملفات'));
  }

  const { applicationType, isRenewal } = req.body;
  const files = req.files;
  const missingFiles = [];

  // Helper to check if file field exists
  const checkFile = (fieldName, label) => {
    if (!files[fieldName] || files[fieldName].length === 0) {
      missingFiles.push(label);
    }
  };

  // 1. Fisherman Application
  if (applicationType === 'fisherman') {
    checkFile('criminalRecord', 'فيش جنائي');
    checkFile('nationalIdImage', 'صورة البطاقة الشخصية');
    checkFile('militaryStatus', 'موقف التجنيد');
    checkFile('personalPhoto', 'صورة شخصية');
    // insurancePhoto is optional
  }

  // 2. Boat Application
  if (applicationType === 'boat') {
    checkFile('ownerPhoto', 'صورة المالك');
    checkFile('associationLetter', 'خطاب الجمعية');
    checkFile('insuranceLetter', 'خطاب التأمينات');
    checkFile('taxReceipt', 'إيصال الضرائب');
    checkFile('renewalForm', 'استمارة التجديد');

    // Renewal specific
    if (isRenewal === 'true' || isRenewal === true) {
      checkFile('previousLicense', 'رخصة العام السابق');
    }
  }

  // 3. Vehicle Application
  if (applicationType === 'vehicle') {
    checkFile('vehicleLicense', 'رخصة السيارة');
    checkFile('driverLicense', 'رخصة القيادة');
  }

  if (missingFiles.length > 0) {
    return next(
      new AppError(400, `الملفات التالية مطلوبة: ${missingFiles.join('، ')}`)
    );
  }

  next();
};
