const router = require('express').Router();
const { protect, requireAdminOrSubAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/blogController');

router.get('/', ctrl.getBlogs);
router.get('/:slug', ctrl.getBlogBySlug);
router.post('/', protect, requireAdminOrSubAdmin, ctrl.createBlog);
router.put('/:id', protect, requireAdminOrSubAdmin, ctrl.updateBlog);
router.delete('/:id', protect, requireAdminOrSubAdmin, ctrl.deleteBlog);

module.exports = router;
