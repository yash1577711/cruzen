const router = require('express').Router();
const { protect, requireAdminOrSubAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/consultationController');

router.post('/', ctrl.book);
router.get('/', protect, requireAdminOrSubAdmin, ctrl.getAll);
router.patch('/:id', protect, requireAdminOrSubAdmin, ctrl.update);

module.exports = router;
