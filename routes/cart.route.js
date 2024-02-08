const CartController = require("../modules/carts/cart.controller");
const { verifyUser, verifyAuthorization } = require("../middlewares/auth.middlerware");

const router = require("express").Router()
const cartController = new CartController()

router.post('/add', verifyUser, cartController.addToCart)

router.get('/my-order', verifyUser, cartController.myOrder)

router.get('/my-cart', verifyUser, cartController.getMyCart)

router.get('/checkout', cartController.checkout)

router.put('/checkout/:cart_id', cartController.checkoutMobile)

router.put('/add-remove-item', verifyUser, cartController.removeItems)

router.get('/admin/order', verifyUser, cartController.getOrders)

router.put('/change-status', verifyUser, verifyAuthorization, cartController.cartStatusChange)


module.exports = router