const router = require('express').Router();
const { protect, requireAdminOrSubAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/chatController');

router.post('/message', ctrl.sendMessage);
router.get('/history/:sessionId', ctrl.getChatHistory);
router.get('/all', protect, requireAdminOrSubAdmin, ctrl.getAllChats);

module.exports = router;
