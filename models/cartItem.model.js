const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    order_no: {
        type: Number
    },
    item: {
        type: Schema.Types.ObjectId, ref: "Product", required: true
    },
    // variant: {
    //     type: String, required: true //variant sku of the product
    // },
    price: {
        type: Number
    },
    quantity: {
        type: Number
    },
    total: {
        type: Number
    },
    status: {
        type: String, enum: [
            "CART", "ORDER", "PROCEED", "PACKAGED", "DISPATCHED", "DELIVERED", "CANCELLED", "REMOVED" 
        ],
        default: "CART"
    },
    is_active: {
        type: Boolean, default: true
    },
    cart: {
        type: Schema.Types.ObjectId, ref: "Cart"
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;