const WishListContrller = require("../controllers/wishlist.controller");
const { verifyUser } = require("../middlewares/auth.middlerware");

const router = require("express").Router()
const wishListContrller = new WishListContrller()

router.post('/:product', verifyUser, wishListContrller.addRemoveWishList)

router.get('/', verifyUser, wishListContrller.getWishList)


module.exports = router