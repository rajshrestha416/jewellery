const ReviewController = require("../modules/reviews/review.controller");
const { verifyUser } = require("../middlewares/auth.middlerware");

const router = require("express").Router()
const reviewController = new ReviewController()

router.post('/', verifyUser, reviewController.addUpdateReview)

router.get('/:product', reviewController.getProductReviews)


module.exports = router