const ContactContrller = require("../modules/contacts/contact.controlle");
const { verifyUser, verifyAuthorization } = require("../middlewares/auth.middlerware");

const router = require("express").Router()
const contactContrller = new ContactContrller()

router.post('/', verifyUser, contactContrller.addContact)

router.get('/', verifyUser, verifyAuthorization, contactContrller.getContact)


module.exports = router