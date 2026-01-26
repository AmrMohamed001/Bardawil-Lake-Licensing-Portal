const autocannon = require('autocannon');
const axios = require('axios');

// Configuration
const TARGET_URL = 'http://localhost:3000';
const NUM_CONNECTIONS = 100; // Moderate concurrency
const DURATION = 10;

// Test User Details
const user = {
    nationalId: '29901010000001', // Example National ID
    password: 'password123',
    firstNameAr: 'مستخدم',
    lastNameAr: 'تجريبي',
    phone: '01012345678',
    passwordConfirm: 'password123'
};

async function run() {
    console.log('🚀 Starting Load Test Setup...');

    // 1. Register or Login to get Token
    let token;
    try {
        console.log('Attempting to register test user...');
        await axios.post(`${TARGET_URL}/api/v1/auth/register`, user);
        console.log('✅ Registered test user successfully');
    } catch (e) {
        if (e.response && (e.response.status === 400 || e.response.status === 409)) {
            console.log('ℹ️ User likely already exists, proceeding to login...');
        } else {
            console.warn('⚠️ Registration warning:', e.message);
        }
    }

    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${TARGET_URL}/api/v1/auth/login`, {
            nationalId: user.nationalId,
            password: user.password
        });
        token = loginRes.data.token;
        console.log('✅ Logged in successfully. Token key acquired.');
    } catch (e) {
        console.error('❌ Login failed:', e.response ? e.response.data : e.message);
        console.error('Cannot proceed without token. Exiting.');
        process.exit(1);
    }

    // 2. Run Autocannon
    console.log(`\n🔥 Starting Autocannon Load Test with ${NUM_CONNECTIONS} connections for ${DURATION}s...`);

    const instance = autocannon({
        url: TARGET_URL,
        connections: NUM_CONNECTIONS,
        pipelining: 1,
        duration: DURATION,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        requests: [
            {
                method: 'GET',
                path: '/api/v1/applications/dashboard', // User dashboard stats
            },
            {
                method: 'GET',
                path: '/api/v1/applications', // List applications
            },
            {
                method: 'POST',
                path: '/api/v1/auth/login', // Test login load (simulated)
                body: JSON.stringify({
                    nationalId: user.nationalId,
                    password: user.password
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ]
    }, (err, result) => {
        if (err) {
            console.error('❌ Autocannon error:', err);
        } else {
            console.log('\n✅ Load Test Completed!');
            console.log(autocannon.printResult(result));
        }
    });

    autocannon.track(instance, { renderProgressBar: true });
}

run();
