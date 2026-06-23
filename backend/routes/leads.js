const router = require('express').Router();
const { protect, requireAdminOrSubAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/leadController');

router.post('/', ctrl.createLead);
router.get('/', protect, requireAdminOrSubAdmin, ctrl.getLeads);
router.patch('/:id', protect, requireAdminOrSubAdmin, ctrl.updateLead);

module.exports = router;
