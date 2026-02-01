/**
 * Egyptian National ID Validator & Parser
 * 
 * National ID Structure (14 digits):
 * - Position 1: Century (2=1900s, 3=2000s)
 * - Position 2-3: Birth Year
 * - Position 4-5: Birth Month
 * - Position 6-7: Birth Day
 * - Position 8-9: Governorate Code
 * - Position 10-13: Sequential Number
 * - Position 14: Check Digit
 */

// Governorate codes mapping
const GOVERNORATES = {
  '01': 'القاهرة',
  '02': 'الإسكندرية',
  '03': 'بورسعيد',
  '04': 'السويس',
  '11': 'دمياط',
  '12': 'الدقهلية',
  '13': 'الشرقية',
  '14': 'القليوبية',
  '15': 'كفر الشيخ',
  '16': 'الغربية',
  '17': 'المنوفية',
  '18': 'البحيرة',
  '19': 'الإسماعيلية',
  '21': 'الجيزة',
  '22': 'بني سويف',
  '23': 'الفيوم',
  '24': 'المنيا',
  '25': 'أسيوط',
  '26': 'سوهاج',
  '27': 'قنا',
  '28': 'أسوان',
  '29': 'الأقصر',
  '31': 'البحر الأحمر',
  '32': 'الوادي الجديد',
  '33': 'مطروح',
  '34': 'شمال سيناء',
  '35': 'جنوب سيناء',
  '88': 'خارج الجمهورية',
};

/**
 * Validate Egyptian National ID format and structure
 * @param {string} nationalId - The 14-digit national ID
 * @returns {Object} Validation result with isValid and errors
 */
function validate(nationalId) {
  const errors = [];
  
  // Remove any spaces or dashes
  const cleanId = String(nationalId).replace(/[\s-]/g, '');
  
  // Check length
  if (cleanId.length !== 14) {
    errors.push('الرقم القومي يجب أن يتكون من 14 رقم');
    return { isValid: false, errors };
  }
  
  // Check if all characters are digits
  if (!/^\d{14}$/.test(cleanId)) {
    errors.push('الرقم القومي يجب أن يحتوي على أرقام فقط');
    return { isValid: false, errors };
  }
  
  // Extract components
  const century = cleanId.charAt(0);
  const year = cleanId.substring(1, 3);
  const month = cleanId.substring(3, 5);
  const day = cleanId.substring(5, 7);
  const governorateCode = cleanId.substring(7, 9);
  
  // Validate century (2 = 1900s, 3 = 2000s)
  if (!['2', '3'].includes(century)) {
    errors.push('رمز القرن غير صالح');
  }
  
  // Calculate full year
  const fullYear = (century === '2' ? 1900 : 2000) + parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  
  // Validate year is not in the future
  if (fullYear > currentYear) {
    errors.push('سنة الميلاد غير صالحة');
  }
  
  // Validate month (01-12)
  const monthNum = parseInt(month, 10);
  if (monthNum < 1 || monthNum > 12) {
    errors.push('شهر الميلاد غير صالح');
  }
  
  // Validate day (01-31)
  const dayNum = parseInt(day, 10);
  if (dayNum < 1 || dayNum > 31) {
    errors.push('يوم الميلاد غير صالح');
  }
  
  // Validate date is real (e.g., no Feb 30)
  if (errors.length === 0) {
    const birthDate = new Date(fullYear, monthNum - 1, dayNum);
    if (birthDate.getMonth() !== monthNum - 1 || birthDate.getDate() !== dayNum) {
      errors.push('تاريخ الميلاد غير صالح');
    }
  }
  
  // Validate governorate code
  if (!GOVERNORATES[governorateCode]) {
    errors.push('رمز المحافظة غير صالح');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse Egyptian National ID and extract information
 * @param {string} nationalId - The 14-digit national ID
 * @returns {Object|null} Parsed data or null if invalid
 */
function parse(nationalId) {
  const validation = validate(nationalId);
  if (!validation.isValid) {
    return null;
  }
  
  const cleanId = String(nationalId).replace(/[\s-]/g, '');
  
  const century = cleanId.charAt(0);
  const year = cleanId.substring(1, 3);
  const month = cleanId.substring(3, 5);
  const day = cleanId.substring(5, 7);
  const governorateCode = cleanId.substring(7, 9);
  const sequentialNumber = cleanId.substring(9, 13);
  const checkDigit = cleanId.charAt(13);
  
  const fullYear = (century === '2' ? 1900 : 2000) + parseInt(year, 10);
  const birthDate = new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10));
  
  // Gender: odd sequential = male, even = female
  const isMale = parseInt(sequentialNumber, 10) % 2 === 1;
  
  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return {
    nationalId: cleanId,
    birthDate: birthDate.toISOString().split('T')[0],
    birthYear: fullYear,
    birthMonth: parseInt(month, 10),
    birthDay: parseInt(day, 10),
    age,
    gender: isMale ? 'male' : 'female',
    genderAr: isMale ? 'ذكر' : 'أنثى',
    governorateCode,
    governorate: GOVERNORATES[governorateCode],
    sequentialNumber,
    checkDigit,
  };
}

/**
 * Quick check if national ID is valid
 * @param {string} nationalId - The national ID to check
 * @returns {boolean} True if valid
 */
function isValid(nationalId) {
  return validate(nationalId).isValid;
}

module.exports = {
  validate,
  parse,
  isValid,
  GOVERNORATES,
};
