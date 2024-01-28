const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GiftSchema = new Schema({
    name:{type: String},
    products: {
        type: [Schema.Types.ObjectId], ref: "Product"
    },
    image: {type: String},
    is_active: {type: Boolean, default: true},
    is_deleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

module.exports = mongoose.model('Gift', GiftSchema);