const httpStatus = require("http-status");
const Joi = require("joi");
const reviewModel = require("./review.model");
const productModel = require("../products/product.model");


class ReviewController {

    reviewValidationSchema = Joi.object({
        message: Joi.string().optional(),
        rating: Joi.number().min(0).max(5).required()
    });

    addUpdateReview = async (req, res) => {
        try {
            const { product, rating, message } = req.body;
            const checkProduct = await productModel.findById(
                product,
            );

            if (!checkProduct) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    msg: "Product Not Found!!"
                });
            }

            let review = await reviewModel.findOne({
                user: req.user._id,
                product: checkProduct._id
            });

            if(review){
                review.rating = rating,
                review.message = message
                await review.save() 
            }else{
                review = await reviewModel.create({
                    product, rating, message, user: req.user._id
                });
            }

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Rating updated!!",
                data: review
            });

        } catch (error) {
            console.log("error", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    getProductReviews = async (req, res) => {
        try {
            const { page = 1, size = 10 } = req.query;

            const reviews = await reviewModel.find({ product: req.params.product }).populate({path:'user', select: '-password -__v -createdAt -updatedAt'}).skip((page - 1) * size).limit(size);

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Ratings!!",
                data: reviews
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

}

module.exports = ReviewController;