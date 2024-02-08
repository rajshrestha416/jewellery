const mongoose = require('mongoose');
const reviewModel = require('../reviews/review.model');
const Schema = mongoose.Schema;

const variantSchema = new Schema({
    sku: { type: String },
    stock: { type: Number },
    variant_type: [{
        size: { type: String },
        color: { type: String },
    }],
    price: {
        type: Number, required: true, min: 0
    },
    images: [{ type: String }]
});

const ProductSchema = new Schema({
    product_name: { type: String, required: true },
    description: {type: String},
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    product_sku: { type: String, required: true, unique: true },
    // variant: [variantSchema],
    price: {
        type: Number, min: 0
    },
    stock: {type: Number, default: 0},
    images: [{ type: String }],
    is_deleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

const getRating = async(product) => {
    const rating = await reviewModel.aggregate([
        { $match: { product: product } },
        {
            $group: {
                _id: null,
                rating: { $avg: '$rating' }
            }
        },
    ]);
    return rating.length ? rating[0].rating : 0
}

ProductSchema.post('find', async (result) => {
    for(let index in result){
        if (!result[index] instanceof mongoose.Document){
            result[index] = result[index].toJSON()
        }
        result[index].rating = await getRating(result[index]._id)
    }
    return result;
});

module.exports = mongoose.model('Product', ProductSchema);
