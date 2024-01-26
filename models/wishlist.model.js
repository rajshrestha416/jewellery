const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WishListSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId, ref: "User"
    },
    product: {
        type: Schema.Types.ObjectId, ref: "Product"
    }
}, {
    timestamps: true
});

const Category = mongoose.model('WishList', WishListSchema);

module.exports = Category;
