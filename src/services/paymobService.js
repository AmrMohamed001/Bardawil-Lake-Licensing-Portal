/**
 * Paymob Payment Service
 * Integration with Paymob payment gateway for Egypt
 * Documentation: https://docs.paymob.com/
 */

const axios = require('axios');
const crypto = require('crypto');
const AppError = require('../utils/appError');

// Paymob API Configuration
const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';

class PaymobService {
    constructor() {
        this.apiKey = process.env.PAYMOB_API_KEY;
        this.integrationId = process.env.PAYMOB_INTEGRATION_ID;
        this.iframeId = process.env.PAYMOB_IFRAME_ID;
        // Support both naming conventions
        this.hmacSecret = process.env.PAYMOB_SECRET_KEY || process.env.PAYMOB_HMAC_SECRET;
        this.authToken = null;
    }

    /**
     * Step 1: Get authentication token from Paymob
     * @returns {Promise<string>} Authentication token
     */
    async getAuthToken() {
        try {
            const response = await axios.post(`${PAYMOB_BASE_URL}/auth/tokens`, {
                api_key: this.apiKey,
            });

            this.authToken = response.data.token;
            return this.authToken;
        } catch (error) {
            console.error('Paymob Auth Error:', error.response?.data || error.message);
            throw new AppError(500, 'خطأ في الاتصال ببوابة الدفع');
        }
    }

    /**
     * Step 2: Register an order with Paymob
     * @param {Object} orderData - Order details
     * @returns {Promise<Object>} Order response
     */
    async createOrder(orderData) {
        const { amountCents, merchantOrderId, items = [] } = orderData;

        try {
            // Ensure we have a valid auth token
            if (!this.authToken) {
                await this.getAuthToken();
            }

            const response = await axios.post(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
                auth_token: this.authToken,
                delivery_needed: false,
                amount_cents: amountCents,
                currency: 'EGP',
                merchant_order_id: merchantOrderId,
                items: items.map(item => ({
                    name: item.name || 'ترخيص',
                    amount_cents: item.amountCents || amountCents,
                    description: item.description || 'رسوم الترخيص',
                    quantity: item.quantity || 1,
                })),
            });

            return response.data;
        } catch (error) {
            console.error('Paymob Order Error:', error.response?.data || error.message);
            throw new AppError(500, 'خطأ في إنشاء طلب الدفع');
        }
    }

    /**
     * Step 3: Generate payment key
     * @param {Object} paymentData - Payment details
     * @returns {Promise<string>} Payment key
     */
    async getPaymentKey(paymentData) {
        const {
            orderId,
            amountCents,
            billingData,
            expirationSeconds = 3600, // 1 hour default
        } = paymentData;

        try {
            // Ensure we have a valid auth token
            if (!this.authToken) {
                await this.getAuthToken();
            }

            const response = await axios.post(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
                auth_token: this.authToken,
                amount_cents: amountCents,
                expiration: expirationSeconds,
                order_id: orderId,
                billing_data: {
                    apartment: billingData.apartment || 'NA',
                    email: billingData.email || 'customer@bardawil.gov.eg',
                    floor: billingData.floor || 'NA',
                    first_name: billingData.firstName || 'مستخدم',
                    street: billingData.street || 'شمال سيناء',
                    building: billingData.building || 'NA',
                    phone_number: billingData.phone || '01000000000',
                    shipping_method: 'NA',
                    postal_code: billingData.postalCode || '00000',
                    city: billingData.city || 'العريش',
                    country: 'EG',
                    last_name: billingData.lastName || 'البردويل',
                    state: billingData.state || 'شمال سيناء',
                },
                currency: 'EGP',
                integration_id: parseInt(this.integrationId),
            });

            return response.data.token;
        } catch (error) {
            console.error('Paymob Payment Key Error:', error.response?.data || error.message);
            throw new AppError(500, 'خطأ في إنشاء مفتاح الدفع');
        }
    }

    /**
     * Generate payment checkout URL (Paymob Hosted Checkout)
     * This redirects user to Paymob's professional checkout page
     * @param {string} paymentKey - Payment key from getPaymentKey
     * @returns {string} Checkout URL
     */
    getPaymentCheckoutUrl(paymentKey) {
        // Use Paymob's hosted checkout page - more professional and handles all payment methods
        return `https://accept.paymob.com/unifiedcheckout/?publicKey=${process.env.PAYMOB_PUBLIC_KEY}&clientSecret=${paymentKey}`;
    }

    /**
     * Generate payment iframe URL (legacy method)
     * @param {string} paymentKey - Payment key from getPaymentKey
     * @returns {string} Iframe URL
     */
    getPaymentIframeUrl(paymentKey) {
        return `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`;
    }

    /**
     * Complete payment flow - creates order and returns payment URL
     * @param {Object} data - Payment data
     * @returns {Promise<Object>} Payment URL and order details
     */
    async initiatePayment(data) {
        const {
            applicationId,
            applicationNumber,
            amount, // Amount in EGP (not cents)
            applicantName,
            applicantPhone,
            applicantEmail,
            licenseType,
            licenseCategory,
        } = data;

        // Step 1: Get auth token
        await this.getAuthToken();

        // Step 2: Create order
        const amountCents = Math.round(amount * 100); // Convert to cents
        const order = await this.createOrder({
            amountCents,
            merchantOrderId: `BRD-${applicationId}-${Date.now()}`,
            items: [
                {
                    name: `${licenseType} - ${licenseCategory}`,
                    amountCents,
                    description: `رسوم ترخيص ${applicationNumber}`,
                    quantity: 1,
                },
            ],
        });

        // Step 3: Get payment key
        const [firstName, ...lastNameParts] = (applicantName || 'مستخدم البردويل').split(' ');
        const paymentKey = await this.getPaymentKey({
            orderId: order.id,
            amountCents,
            billingData: {
                firstName,
                lastName: lastNameParts.join(' ') || 'البردويل',
                phone: applicantPhone || '01000000000',
                email: applicantEmail || 'customer@bardawil.gov.eg',
            },
        });

        // Generate payment URL - Use iframe for reliable payment experience
        const paymentUrl = this.getPaymentIframeUrl(paymentKey);

        return {
            success: true,
            orderId: order.id,
            paymentUrl,
            paymentKey,
            amount,
            amountCents,
        };
    }

    /**
     * Verify callback HMAC signature
     * @param {Object} data - Callback data from Paymob
     * @returns {boolean} Whether signature is valid
     */
    verifyCallback(data) {
        const { hmac, obj } = data;

        if (!hmac || !obj) return false;

        // Build the string to hash according to Paymob documentation
        const concatenatedString = [
            obj.amount_cents,
            obj.created_at,
            obj.currency,
            obj.error_occured,
            obj.has_parent_transaction,
            obj.id,
            obj.integration_id,
            obj.is_3d_secure,
            obj.is_auth,
            obj.is_capture,
            obj.is_refunded,
            obj.is_standalone_payment,
            obj.is_voided,
            obj.order,
            obj.owner,
            obj.pending,
            obj.source_data?.pan,
            obj.source_data?.sub_type,
            obj.source_data?.type,
            obj.success,
        ].join('');

        const calculatedHmac = crypto
            .createHmac('sha512', this.hmacSecret)
            .update(concatenatedString)
            .digest('hex');

        return hmac === calculatedHmac;
    }

    /**
     * Parse transaction status from callback
     * @param {Object} transactionData - Transaction data from callback
     * @returns {Object} Parsed status
     */
    parseTransactionStatus(transactionData) {
        const { success, pending, is_refunded, is_voided, error_occured } = transactionData;

        if (is_voided) {
            return { status: 'voided', message: 'تم إلغاء العملية' };
        }

        if (is_refunded) {
            return { status: 'refunded', message: 'تم استرداد المبلغ' };
        }

        if (error_occured) {
            return { status: 'failed', message: 'فشلت عملية الدفع' };
        }

        if (pending) {
            return { status: 'pending', message: 'العملية قيد المعالجة' };
        }

        if (success) {
            return { status: 'success', message: 'تمت عملية الدفع بنجاح' };
        }

        return { status: 'unknown', message: 'حالة غير معروفة' };
    }

    /**
     * Extract application ID from merchant order ID
     * @param {string} merchantOrderId - Merchant order ID (format: BRD-{appId}-{timestamp})
     * @returns {string|null} Application ID
     */
    extractApplicationId(merchantOrderId) {
        if (!merchantOrderId) return null;

        const parts = merchantOrderId.split('-');
        if (parts.length >= 2 && parts[0] === 'BRD') {
            return parts[1];
        }
        return null;
    }
}

module.exports = new PaymobService();
