const CategoryController = require("../controllers/category.controller");
const { verifyUser, verifyAuthorization } = require("../middlewares/auth.middlerware");

const router = require("express").Router()
const categoryController = new CategoryController()

router.post('/', verifyUser, verifyAuthorization, categoryController.addCategory)

router.get('/',  categoryController.getCategories)

router.get('/:id', categoryController.getCategory)

router.put('/:id', verifyUser, verifyAuthorization, categoryController.updateCategory)

router.delete('/:id', verifyUser, verifyAuthorization, categoryController.deleteCategory)


module.exports = router