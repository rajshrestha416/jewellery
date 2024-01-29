const Joi = require("joi");
const contactModel = require("./contact.model");
const httpStatus = require("http-status");



class ContactController {

    contactValidationSchema = Joi.object({
        firstname: Joi.string().required(), 
        lastname: Joi.string().required(), 
        email: Joi.string().required(), 
        mobile_no: Joi.string().required(), 
        message: Joi.string().required(), 
    })

    addContact = async(req, res) => {
        try {
            
            const { error } = this.contactValidationSchema.validate(req.body);

            if (error) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    msg: error.message
                });
            }

            const contact = await contactModel.create(req.body)
            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Contact Added to the List!!",
                data: contact
            })

        } catch (error) {
            console.log("error", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    }

    getContact = async(req, res) => {
        try {
            let { page = 1, size = 10, sort = { _id: -1 } } = req.query;
            
            const contact = await contactModel.find({}).skip((page - 1) * size).limit(size).sort(sort)

            const totalCount = await contactModel.countDocuments({})
            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Contact Added to the List!!",
                data: contact,
                totalCount,
                page,
                size
            })
        } catch (error) {
            console.log("error", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    }
}

module.exports = ContactController