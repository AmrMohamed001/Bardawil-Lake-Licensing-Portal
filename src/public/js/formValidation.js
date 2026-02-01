/**
 * Form Validation Module for Bardawil Lake Licensing Portal
 * Real-time validation with Arabic error messages
 * Based on SRS Section 4.2.3 - Input Validation
 */

const FormValidator = {
    // Validation rules configuration
    rules: {
        nationalId: {
            pattern: /^[0-9]{14}$/,
            message: 'الرقم القومي يجب أن يتكون من 14 رقم',
            required: true,
            requiredMessage: 'الرقم القومي مطلوب'
        },
        phone: {
            pattern: /^01[0125][0-9]{8}$/,
            message: 'رقم الهاتف يجب أن يكون بالصيغة المصرية (مثال: 01xxxxxxxxx)',
            required: true,
            requiredMessage: 'رقم الهاتف مطلوب'
        },
        arabicName: {
            pattern: /^[\u0600-\u06FF\s]{2,100}$/,
            message: 'الاسم يجب أن يكون بالعربية (2-100 حرف)',
            required: true,
            requiredMessage: 'هذا الحقل مطلوب'
        },
        password: {
            minLength: 8,
            message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
            required: true,
            requiredMessage: 'كلمة المرور مطلوبة'
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'البريد الإلكتروني غير صالح',
            required: false
        },
        required: {
            message: 'هذا الحقل مطلوب'
        }
    },

    /**
     * Show validation error for a field
     * @param {HTMLElement} field - The input field
     * @param {string} message - Error message to display
     */
    showError(field, message) {
        // Remove existing error if any
        this.clearError(field);

        // Add error class to field
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');

        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

        // Insert after the field (or after password wrapper if exists)
        const wrapper = field.closest('.password-input-wrapper') || field;
        wrapper.parentNode.insertBefore(errorDiv, wrapper.nextSibling);

        return false;
    },

    /**
     * Clear validation error for a field
     * @param {HTMLElement} field - The input field
     */
    clearError(field) {
        field.classList.remove('is-invalid');

        // Find and remove error message
        const wrapper = field.closest('.password-input-wrapper') || field;
        const errorDiv = wrapper.parentNode.querySelector('.validation-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    /**
     * Show success state for a field
     * @param {HTMLElement} field - The input field
     */
    showSuccess(field) {
        this.clearError(field);
        field.classList.add('is-valid');
        return true;
    },

    /**
     * Validate National ID (calls EgyptianNationalId utility)
     * @param {HTMLElement} field - The input field
     * @returns {boolean} - Validation result
     */
    validateNationalId(field) {
        const value = field.value.trim();

        // Use the EgyptianNationalId utility if available
        if (typeof EgyptianNationalId !== 'undefined') {
            const result = EgyptianNationalId.validate(value);
            if (!result.isValid) {
                return this.showError(field, result.error);
            }
            return this.showSuccess(field);
        }

        // Fallback: basic validation if utility not loaded
        if (!value) {
            return this.showError(field, this.rules.nationalId.requiredMessage);
        }
        if (!/^[0-9]{14}$/.test(value)) {
            return this.showError(field, this.rules.nationalId.message);
        }
        return this.showSuccess(field);
    },

    /**
     * Validate Egyptian phone number
     * @param {HTMLElement} field - The input field
     * @returns {boolean} - Validation result
     */
    validatePhone(field) {
        const value = field.value.trim();

        if (!value) {
            return this.showError(field, this.rules.phone.requiredMessage);
        }

        if (!this.rules.phone.pattern.test(value)) {
            return this.showError(field, this.rules.phone.message);
        }

        return this.showSuccess(field);
    },

    /**
     * Validate Arabic name
     * @param {HTMLElement} field - The input field
     * @param {string} fieldLabel - Field label for error message
     * @returns {boolean} - Validation result
     */
    validateArabicName(field, fieldLabel = 'الاسم') {
        const value = field.value.trim();

        if (!value) {
            return this.showError(field, `${fieldLabel} مطلوب`);
        }

        if (value.length < 2) {
            return this.showError(field, `${fieldLabel} يجب أن يكون حرفين على الأقل`);
        }

        if (!/^[\u0600-\u06FF\s]+$/.test(value)) {
            return this.showError(field, `${fieldLabel} يجب أن يكون بالعربية فقط`);
        }

        return this.showSuccess(field);
    },

    /**
     * Validate password
     * @param {HTMLElement} field - The input field
     * @returns {boolean} - Validation result
     */
    validatePassword(field) {
        const value = field.value;

        if (!value) {
            return this.showError(field, this.rules.password.requiredMessage);
        }

        if (value.length < 8) {
            return this.showError(field, `كلمة المرور يجب أن تكون 8 أحرف على الأقل (أدخلت ${value.length} أحرف)`);
        }

        return this.showSuccess(field);
    },

    /**
     * Validate password confirmation
     * @param {HTMLElement} field - The confirm password field
     * @param {HTMLElement} passwordField - The original password field
     * @returns {boolean} - Validation result
     */
    validatePasswordConfirm(field, passwordField) {
        const value = field.value;
        const passwordValue = passwordField.value;

        if (!value) {
            return this.showError(field, 'تأكيد كلمة المرور مطلوب');
        }

        if (value !== passwordValue) {
            return this.showError(field, 'كلمة المرور غير متطابقة');
        }

        return this.showSuccess(field);
    },

    /**
     * Validate required field
     * @param {HTMLElement} field - The input field
     * @param {string} fieldLabel - Field label for error message
     * @returns {boolean} - Validation result
     */
    validateRequired(field, fieldLabel = 'هذا الحقل') {
        const value = field.value.trim();

        if (!value) {
            return this.showError(field, `${fieldLabel} مطلوب`);
        }

        return this.showSuccess(field);
    },

    /**
     * Validate select field
     * @param {HTMLElement} field - The select field
     * @param {string} fieldLabel - Field label for error message
     * @returns {boolean} - Validation result
     */
    validateSelect(field, fieldLabel = 'هذا الحقل') {
        const value = field.value;

        if (!value) {
            return this.showError(field, `يرجى اختيار ${fieldLabel}`);
        }

        return this.showSuccess(field);
    },

    /**
     * Validate file upload
     * @param {HTMLElement} field - The file input field
     * @param {Object} options - Validation options
     * @returns {boolean} - Validation result
     */
    validateFile(field, options = {}) {
        const {
            required = false,
            maxSize = 5 * 1024 * 1024, // 5MB default
            allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
            fieldLabel = 'الملف'
        } = options;

        const file = field.files[0];

        if (required && !file) {
            return this.showError(field, `${fieldLabel} مطلوب`);
        }

        if (file) {
            if (file.size > maxSize) {
                const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
                return this.showError(field, `حجم الملف يجب أن لا يتجاوز ${sizeMB} ميجابايت`);
            }

            if (!allowedTypes.includes(file.type)) {
                return this.showError(field, 'نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, PDF');
            }
        }

        return this.showSuccess(field);
    },

    /**
     * Initialize validation on a form
     * @param {string} formId - The form ID
     * @param {Object} fieldConfigs - Configuration for each field
     */
    init(formId, fieldConfigs) {
        const form = document.getElementById(formId);
        if (!form) return;

        Object.keys(fieldConfigs).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            const config = fieldConfigs[fieldName];

            // Add blur event listener for real-time validation
            field.addEventListener('blur', () => {
                this.validateField(field, config);
            });

            // Add input event for real-time feedback (optional)
            if (config.validateOnInput) {
                field.addEventListener('input', () => {
                    // Clear error while typing
                    if (field.classList.contains('is-invalid')) {
                        this.clearError(field);
                    }
                });
            }
        });
    },

    /**
     * Validate a single field based on config
     * @param {HTMLElement} field - The field to validate
     * @param {Object} config - Validation configuration
     * @returns {boolean} - Validation result
     */
    validateField(field, config) {
        switch (config.type) {
            case 'nationalId':
                return this.validateNationalId(field);
            case 'phone':
                return this.validatePhone(field);
            case 'arabicName':
                return this.validateArabicName(field, config.label);
            case 'password':
                return this.validatePassword(field);
            case 'passwordConfirm':
                const passwordField = document.querySelector(config.passwordFieldSelector || '[name="password"]');
                return this.validatePasswordConfirm(field, passwordField);
            case 'required':
                return this.validateRequired(field, config.label);
            case 'select':
                return this.validateSelect(field, config.label);
            case 'file':
                return this.validateFile(field, config);
            default:
                return true;
        }
    },

    /**
     * Validate entire form
     * @param {string} formId - The form ID
     * @param {Object} fieldConfigs - Configuration for each field
     * @returns {boolean} - Whether form is valid
     */
    validateForm(formId, fieldConfigs) {
        const form = document.getElementById(formId);
        if (!form) return false;

        let isValid = true;
        let firstInvalidField = null;

        Object.keys(fieldConfigs).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            // Skip hidden fields
            if (field.offsetParent === null && field.type !== 'hidden') return;

            const config = fieldConfigs[fieldName];

            // Skip if field is conditionally optional
            if (config.conditionalRequired && !config.conditionalRequired()) return;

            const fieldValid = this.validateField(field, config);
            if (!fieldValid) {
                isValid = false;
                if (!firstInvalidField) {
                    firstInvalidField = field;
                }
            }
        });

        // Scroll to first invalid field
        if (firstInvalidField) {
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidField.focus();
        }

        return isValid;
    }
};

// Add CSS for validation styles
const validationStyles = document.createElement('style');
validationStyles.textContent = `
  .validation-error {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .validation-error i {
    font-size: 0.75rem;
  }

  .form-control.is-invalid {
    border-color: #dc3545 !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: left calc(0.375em + 0.1875rem) center;
    background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
    padding-left: calc(1.5em + 0.75rem);
  }

  .form-control.is-valid {
    border-color: #28a745 !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2328a745' d='M2.3 6.73.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: left calc(0.375em + 0.1875rem) center;
    background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
    padding-left: calc(1.5em + 0.75rem);
  }

  select.form-control.is-invalid,
  select.form-control.is-valid {
    background-position: left calc(0.375em + 0.1875rem) center, left 0.75rem center;
  }
`;
document.head.appendChild(validationStyles);

// Export for use in other scripts
window.FormValidator = FormValidator;
