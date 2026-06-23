const router = require('express').Router();
const { protect, requireAdminOrSubAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/popupController');

router.get('/',  ctrl.getPopup);
router.put('/',  protect, requireAdminOrSubAdmin, ctrl.updatePopup);

module.exports = router;
