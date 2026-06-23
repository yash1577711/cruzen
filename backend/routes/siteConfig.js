const router = require('express').Router();
const { protect, requireAdminOrSubAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/siteConfigController');

router.get('/:key', ctrl.getConfig);
router.put('/:key', protect, requireAdminOrSubAdmin, ctrl.setConfig);
router.patch('/:key', protect, requireAdminOrSubAdmin, ctrl.patchConfig);

module.exports = router;
