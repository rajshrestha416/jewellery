const Joi = require("joi");
const upload = require("../../middlewares/upload");
const giftModel = require("./gift.model");
const httpStatus = require("http-status");

class GiftController {

    giftValidationSchema = Joi.object({
        name: Joi.string().required(),
        products: Joi.string().required(),
    });

    addGifts = async (req, res) => {
        upload.single('image')(req, res, async error => {
            if (err) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    msg: err.messages
                });
            }
            try {
                req.body.variant = JSON.parse(req.body.variant);
                const { error } = this.giftValidationSchema(req.body);

                if (error) {
                    return res.status(httpStatus.CONFLICT).json({
                        success: false,
                        msg: error.message
                    });
                }

                req.body.image = req.file.path || '';

                const checkDuplicateGift = await giftModel.findOne({
                    name: req.body.name
                });

                if (checkDuplicateGift) {
                    return res.status(httpStatus.CONFLICT).json({
                        success: false,
                        msg: "Gift with this name already exists!!"
                    });
                }

                const gift = await giftModel.create(req.body);

                return res.status(httpStatus.OK).json({
                    success: true,
                    msg: "Gift Added!!!",
                    data: gift

                });

            } catch (error) {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    msg: "Something Went Wrong!!"
                });
            }
        });

    };

    getGifts = async (req, res) => {
        try {
            const { page = 1, size = 10, sort = { _id: -1 } } = req.query;

            let searchQuery = {
                is_deleted: false
            };

            if (req.query.search) {
                searchQuery = {
                    ...searchQuery,
                    name: { $regex: req.query.search, $options: 'i' }
                };
            }

            const gift = giftModel.find(searchQuery)
                .select("name products image")
                .populate({
                    path: "products",
                    select: "product_name variant description"
                })
                .skip((page - 1) * size)
                .limit(size)
                .sort(sort);

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Gifts!!!",
                data: gift

            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };
}

module.exports = GiftController;