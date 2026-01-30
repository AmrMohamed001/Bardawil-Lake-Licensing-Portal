const viewController = require('./src/controllers/viewController');
const viewService = require('./src/services/viewService');

// Mock viewService
viewService.getApplicationDetails = async (id, userId) => {
    return {
        id: 1,
        applicationNumber: 'APP-123456',
        status: 'under_review',
        createdAt: new Date(),
        reviewedAt: new Date(), // Simulating review done
        data: JSON.stringify({
            unionCardNumber: '12345',
            marina: 'Port A'
        })
    };
};

// Mock req and res
const req = {
    params: { id: 1 },
    user: { id: 1, firstNameAr: 'Test', lastNameAr: 'User' }
};

const res = {
    status: (code) => {
        console.log(`Response Status: ${code}`);
        return res;
    },
    render: (view, data) => {
        console.log(`Render View: ${view}`);
        console.log('Passed Data Keys:', Object.keys(data));

        // Assertions
        if (data.timelineSteps && Array.isArray(data.timelineSteps)) {
            console.log('✅ timelineSteps is an array');
            console.log('Step 2 Status:', data.timelineSteps[1].status); // Should be completed
        } else {
            console.error('❌ timelineSteps is missing or invalid');
        }

        if (data.applicationData && data.applicationData.marina === 'Port A') {
            console.log('✅ applicationData parsed correctly');
        } else {
            console.error('❌ applicationData parsing failed');
        }

        if (data.bankAccount) {
            console.log('✅ bankAccount is present:', data.bankAccount);
        } else {
            console.error('❌ bankAccount is missing');
        }
    }
};

const next = (err) => {
    console.error('Next called with error:', err);
};

// Run the controller
(async () => {
    try {
        await viewController.getApplicationDetails(req, res, next);
    } catch (err) {
        console.error('Execution Failed:', err);
    }
})();
