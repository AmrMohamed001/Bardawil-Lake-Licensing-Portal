/**
 * Egyptian National ID Validator (Frontend Utility)
 * Single source of truth for frontend National ID validation
 * 
 * Structure (14 digits):
 * - Position 1: Century (2=1900s, 3=2000s)
 * - Position 2-3: Birth Year
 * - Position 4-5: Birth Month
 * - Position 6-7: Birth Day
 * - Position 8-9: Governorate Code
 * - Position 10-13: Sequential Number
 * - Position 14: Check Digit
 */

window.EgyptianNationalId = (function() {
  
  // Valid governorate codes
  var GOVERNORATES = {
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
    '88': 'خارج الجمهورية'
  };

  /**
   * Validate Egyptian National ID
   * @param {string} nationalId - The 14-digit national ID
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  function validate(nationalId) {
    var value = String(nationalId || '').replace(/[\s-]/g, '');
    
    // Check empty
    if (!value) {
      return { isValid: false, error: 'الرقم القومي مطلوب' };
    }
    
    // Check digits only
    if (!/^[0-9]+$/.test(value)) {
      return { isValid: false, error: 'الرقم القومي يجب أن يحتوي على أرقام فقط' };
    }
    
    // Check length
    if (value.length < 14) {
      return { isValid: false, error: 'الرقم القومي يجب أن يتكون من 14 رقم (أدخلت ' + value.length + ' رقم)' };
    }
    
    if (value.length > 14) {
      return { isValid: false, error: 'الرقم القومي يجب أن لا يتجاوز 14 رقم' };
    }
    
    // Extract components
    var century = value.charAt(0);
    var year = value.substring(1, 3);
    var month = value.substring(3, 5);
    var day = value.substring(5, 7);
    var governorateCode = value.substring(7, 9);
    
    // Validate century
    if (century !== '2' && century !== '3') {
      return { isValid: false, error: 'رمز القرن غير صالح (يجب أن يبدأ بـ 2 أو 3)' };
    }
    
    var fullYear = (century === '2' ? 1900 : 2000) + parseInt(year, 10);
    var currentYear = new Date().getFullYear();
    
    // Validate year
    if (fullYear > currentYear) {
      return { isValid: false, error: 'سنة الميلاد غير صالحة (لا يمكن أن تكون في المستقبل)' };
    }
    
    // Validate month
    var monthNum = parseInt(month, 10);
    if (monthNum < 1 || monthNum > 12) {
      return { isValid: false, error: 'شهر الميلاد غير صالح (يجب أن يكون بين 01 و 12)' };
    }
    
    // Validate day
    var dayNum = parseInt(day, 10);
    if (dayNum < 1 || dayNum > 31) {
      return { isValid: false, error: 'يوم الميلاد غير صالح (يجب أن يكون بين 01 و 31)' };
    }
    
    // Validate date is real
    var birthDate = new Date(fullYear, monthNum - 1, dayNum);
    if (birthDate.getMonth() !== monthNum - 1 || birthDate.getDate() !== dayNum) {
      return { isValid: false, error: 'تاريخ الميلاد غير صالح (تاريخ غير موجود)' };
    }
    
    // Validate governorate
    if (!GOVERNORATES[governorateCode]) {
      return { isValid: false, error: 'رمز المحافظة غير صالح' };
    }
    
    return { isValid: true, error: null };
  }

  /**
   * Parse National ID and extract info
   * @param {string} nationalId
   * @returns {Object|null}
   */
  function parse(nationalId) {
    var result = validate(nationalId);
    if (!result.isValid) return null;
    
    var value = String(nationalId).replace(/[\s-]/g, '');
    var century = value.charAt(0);
    var year = value.substring(1, 3);
    var month = value.substring(3, 5);
    var day = value.substring(5, 7);
    var governorateCode = value.substring(7, 9);
    var sequentialNumber = value.substring(9, 13);
    
    var fullYear = (century === '2' ? 1900 : 2000) + parseInt(year, 10);
    var isMale = parseInt(sequentialNumber, 10) % 2 === 1;
    
    var today = new Date();
    var age = today.getFullYear() - fullYear;
    var birthMonth = parseInt(month, 10);
    var birthDay = parseInt(day, 10);
    var monthDiff = today.getMonth() + 1 - birthMonth;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
      age--;
    }
    
    return {
      birthDate: fullYear + '-' + month + '-' + day,
      age: age,
      gender: isMale ? 'male' : 'female',
      genderAr: isMale ? 'ذكر' : 'أنثى',
      governorate: GOVERNORATES[governorateCode]
    };
  }

  return {
    validate: validate,
    parse: parse,
    GOVERNORATES: GOVERNORATES
  };
})();
