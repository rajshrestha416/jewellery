const router = require("express").Router()

router.use('/user', require("./user.route"))
router.use('/category', require("./category.route"))
router.use('/product', require("./product.route"))
router.use('/cart', require("./cart.route"))
router.use('/wishlist', require("./wishlist.route"))
router.use('/contact', require("./contact.route"))
router.use('/review', require("./review.route"))


module.exports = router