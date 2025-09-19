const express = require('express');
const fileUpload = require('express-fileupload');
const {
    registerTenant,
    loginTenant,
    addCoachingCenter,
    getTenantCoachingCenters,
    getActiveCoachingCenters,
    verifyLicenseKey
} = require('../controllers/Tenant');

const router = express.Router();

// Configure file upload middleware
router.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    abortOnLimit: true
}));

// Tenant Registration Routes
router.post('/register', registerTenant);
router.post('/login', loginTenant);

// Coaching Center Management Routes
router.post('/:tenantId/coaching-centers', addCoachingCenter);
router.get('/:tenantId/coaching-centers', getTenantCoachingCenters);

// Public Routes (for student registration)
router.get('/coaching-centers/active', getActiveCoachingCenters);
router.post('/verify-license-key', verifyLicenseKey);

module.exports = router;