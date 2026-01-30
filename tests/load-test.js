const autocannon = require('autocannon');
const axios = require('axios');

// Configuration
const TARGET_URL = 'http://localhost:3000';
const NUM_CONNECTIONS = 500; // High concurrency (SRS Target)
const DURATION = 20;

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

    // Generate random user
    const randomId = '29' + Math.floor(Math.random() * 900000000000 + 100000000000).toString();
    const uniqueUser = {
        ...user,
        nationalId: randomId,
        phone: '010' + Math.floor(Math.random() * 90000000 + 10000000).toString()
    };

    // 1. Register
    let token;
    try {
        console.log(`Attempting to register test user (${uniqueUser.nationalId})...`);
        const regRes = await axios.post(`${TARGET_URL}/api/v1/auth/register`, uniqueUser);
        console.log('✅ Registered test user successfully');
        // Token might be in registration response too, but let's stick to login for flow test
    } catch (e) {
        console.error('❌ Registration failed:', e.response ? e.response.data : e.message);
        process.exit(1);
    }

    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${TARGET_URL}/api/v1/auth/login`, {
            nationalId: uniqueUser.nationalId,
            password: uniqueUser.password
        });
        // Response structure is { status: 'success', data: { accessToken, ... } }
        token = loginRes.data.data.accessToken;
        console.log('✅ Logged in successfully. Token acquired.');
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
                method: 'GET',
                path: '/api/v1/notifications', // Test new DB Indexes
            },
            {
                method: 'POST',
                path: '/api/v1/auth/login', // Test login load
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
