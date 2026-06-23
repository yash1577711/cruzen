const router = require('express').Router();
const { protect, requireAdminOrSubAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/serviceController');

router.get('/', ctrl.getServices);
router.get('/:slug', ctrl.getServiceBySlug);
router.post('/', protect, requireAdminOrSubAdmin, ctrl.createService);
router.put('/:id', protect, requireAdminOrSubAdmin, ctrl.updateService);
router.delete('/:id', protect, requireAdminOrSubAdmin, ctrl.deleteService);

module.exports = router;
