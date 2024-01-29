const httpStatus = require("http-status");
const productModel = require("../models/product.model");
const Joi = require("joi");
const cartItemModel = require("../models/cartItem.model");
const cartModel = require("../models/cart.model");
const UserController = require("../controllers/user.controller");
const userModel = require("../models/user.model");
const userController = new UserController();

class OrderController {
    // constructor(){
    //     this.counter = 1
    // }
    orderValidationController = Joi.object({
        item: Joi.string().required(),
        quantity: Joi.number().required(),
        // variant: Joi.string().required()
    });

    addToCart = async (req, res) => {
        try {
            let { item, quantity } = req.body;

            const { error } = this.orderValidationController.validate(req.body);

            if (error) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    msg: error.message
                });
            }

            //check Stock
            const checkProduct = await productModel.findOne({
                _id: item
            });

            if (!checkProduct) {
                return res.status(httpStatus.CONFLICT).json({
                    success: false,
                    msg: "Product Doesn't Exists!!"
                });
            }

            // const _variant = checkProduct.variant.find(ele => ele.sku === variant);

            if (checkProduct.stock < quantity) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    msg: "Out of Stock!!"
                });
            }
            checkProduct.stock -= quantity;

            //get my cart
            const cart = await cartModel.findOne({
                user_id: req.user._id,
                status: "CART"
            });

            //check if item exist in cart
            let order = await cartItemModel.findOne({
                cart: cart._id,
                // variant: _variant.sku,
                status: "CART"
            });

            if (order) {
                order.quantity += quantity;
                await order.save();
            } else {
                order = await cartItemModel.create({
                    item, quantity, price: checkProduct.price, cart: cart._id
                });

                if (!order) {
                    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        msg: "Something Went Wrong!!"
                    });
                }
            }

            //handle cart info
            cart.total += (checkProduct.price * quantity);
            cart.grand_total = cart.total - cart.discount;
            await cart.save();
            await checkProduct.save();

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Order Added to cart",
                data: {
                    cart,
                    cartItem: order
                }
            });
        } catch (error) {
            console.log("error", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    getMyCart = async (req, res) => {
        try {
            //get my cart
            const cart = await cartModel.findOne({
                user_id: req.user._id,
                status: "CART"
            }).select("_id cart_no user_id total discount grand_total status").populate({
                path: "user_id",
                select: "firstname lastname email contact address "
            });

            const cartItems = await cartItemModel.find({
                cart: cart._id,
                status: "CART"
            }).populate({
                path: "item",
                select: "product_name porduct_sku images price"
            }).select("item price quantity");

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "My Cart!!",
                data: {
                    cart,
                    cartItems
                }
            });
        } catch (error) {
            console.log("err", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    removeItems = async (req, res) => {
        try {
            const { cartitem, quantity } = req.body;
            const cartItem = await cartItemModel.findOne({
                _id: cartitem,
                status: "CART",
                is_active: true
            });
            if (!cartItem) {
                return res.status(httpStatus.NOT_FOUND).json({
                    success: false,
                    msg: "Item Not Found!!"
                });
            }
            cartItem.quantity += quantity;

            if (cartItem.quantity === 0) {
                cartItem.status = "REMOVED";
            }

            await cartItem.save();

            //update Cart
            const cart = await cartModel.findOne({
                _id: cartItem.cart
            });
            if (!cart) {
                return res.status(httpStatus.NOT_FOUND).json({
                    success: false,
                    msg: "Cart Not Found!!"
                });
            }

            //handle cart info
            cart.total += (cartItem.price * quantity);
            cart.grand_total = cart.total - cart.discount;
            await cart.save();

            //manage stock 
            await productModel.updateOne({ _id: cartItem.item }, {
                $inc: {
                    "stock": quantity
                }
            });

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Cart Item Removed!!"
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    checkout = async (req, res) => {
        try {
            const { cart_id } = req.params;

            const shipping_address = req.body.shipping_address;

            if (!shipping_address && shipping_address !== "") {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    msg: "Please Add Shipping Address!!"
                });
            }

            //Update CartItem Status
            const cartItems = await cartItemModel.updateMany({
                cart: cart_id
            },
                {
                    status: "ORDER"
                });

            //Update Cart Status
            const cart = await cartModel.findOneAndUpdate({ _id: cart_id }, {
                status: "ORDER"
            });

            //create 
            await userController.createCart(cart.user_id);

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Checkout Completed!!"
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    cartStatusChange = async (req, res) => {
        try {
            const { cartItem, status } = req.body;

            //FIND CART
            const checkCartItem = await cartItemModel.findOne({
                _id: cartItem
            });

            if (!checkCartItem) {
                return res.status(httpStatus.NOT_FOUND).json({
                    success: false,
                    msg: "Cart Item not found."
                });
            }


            checkCartItem.status = status;
            await checkCartItem.save();

            //check if cartitems left in cart to resolve the Cart status
            const checkItemsLeft = cartItemModel.find({
                cart: checkCartItem.cart,
                status: { $nin: ["CART", "REMOVED", "DELIVERED", "CANCELLED"] }
            });

            if (!checkItemsLeft) {
                await cartModel.findByIdAndUpdate(checkCartItem.cart, { status: "COMPLETED" });
            }

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Order Status Changed"
            });

        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    myOrder = async (req, res) => {
        try {
            const { page = 1, size = 10, sort =
                { _id: -1 } } = req.query;
            //my carts
            const carts = await cartModel.distinct('_id', { user_id: req.user._id });

            console.log("carts", carts);

            //my orders
            const orders = await cartItemModel.find({
                cart: { $in: carts },
                status: { $nin: ["CART", "REMOVED"] }
            }).populate({
                path: "item",
                select: "product_name description category product_sku price images"
            }).skip((page - 1) * size).limit(size);

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "My Orders",
                data: orders
            });

        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    getOrders = async (req, res) => {
        try {
            let { page = 1, size = 10, sort = { _id: -1 } } = req.query;

            let searchQuery = {
                status: { $nin: ["CART", "REMOVED"] }
            };

            if (req.query.status) {
                searchQuery = {
                    ...searchQuery,
                    status: req.query.status
                };
            }
            if (req.query.search) {
                if (req.query.search == Number(req.query.search)) {
                    const cart = await cartModel.findOne({
                        cart_no: req.query.search
                    });
                    if(cart){
                        searchQuery = {
                            ...searchQuery,
                            cart_no: cart._id
                        };
                    }
                } else {
                    const user = await userModel.findOne({
                        email: req.query.search
                    });
                    if(user){
                        searchQuery = {
                            ...searchQuery,
                            user_id: user._id
                        };
                    }
                }
            }

            const orders = await cartItemModel.find(searchQuery).populate({
                path: "cart",
                select: "cart_no user_id total discount grand_total",
                populate: {
                    path: "user_id",
                    select: "firstname lastname email contact"
                }
            }).populate({
                path: "item",
                select: "product_name description category product_sku price images"
            }).skip((page - 1) * size).limit(size);

            const totalCount = await cartItemModel.countDocuments({
                status: { $nin: ["CART", "REMOVED"] }
            })

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Orders",
                data: orders,
                page,
                size,
                totalCount
            });
        } catch (error) {
            console.log("error", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };
}

module.exports = OrderController;