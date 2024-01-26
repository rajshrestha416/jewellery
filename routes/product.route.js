const ProductController = require("../controllers/product.controller");
const { verifyUser, verifyAuthorization } = require("../middlewares/auth.middlerware");

const router = require("express").Router()
const productController = new ProductController()

router.post('/', verifyUser, verifyAuthorization, productController.addProduct)

router.get('/', productController.getProducts)

// router.get('/search', productController.search)

router.get('/:sku', productController.getProduct)

router.put('/:id', verifyUser, verifyAuthorization, productController.updateProduct)

router.delete('/:id', verifyUser, verifyAuthorization, productController.deleteProduct)
 
module.exports = router