const router = require('express').Router();
const { protect, requireAdminOrSubAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');
const payu = require('../controllers/payuController');
const invoice = require('../controllers/invoiceController');

// PayU callbacks — NO auth middleware (PayU posts directly)
router.post('/payu/success', payu.payuSuccess);
router.post('/payu/failure', payu.payuFailure);

router.use(protect);

router.post('/create', ctrl.createOrder);
router.post('/verify', ctrl.verifyPayment);
router.post('/payu/init', payu.initPayU);
router.get('/my', ctrl.getMyOrders);
router.get('/all', requireAdminOrSubAdmin, ctrl.getAllOrders);
router.get('/:orderId/invoice', invoice.downloadInvoice);
router.patch('/:id/cancel', ctrl.cancelOrder);
router.patch('/:id/complete', ctrl.completeOrder);
router.patch('/:id/status', requireAdminOrSubAdmin, ctrl.updateOrderStatus);

module.exports = router;
