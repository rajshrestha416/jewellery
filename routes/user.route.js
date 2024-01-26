const UserController = require("../controllers/user.controller");
const { verifyUser, verifyAuthorization } = require("../middlewares/auth.middlerware");

const router = require("express").Router()
const userController = new UserController()

router.post('/login', userController.login)

router.post('/register', userController.register)

router.get('/all', verifyUser, verifyAuthorization, userController.allUser)

router.get('/my-profile', verifyUser, userController.myProfile)

router.put('/update-profile/:id', verifyUser, userController.updateProfile)

router.put('/upload-pp', verifyUser, userController.uploadPP)

router.delete('/delete-user/:id', verifyUser, verifyAuthorization, userController.deleteUser)


module.exports = router