const httpStatus = require("http-status");
const productModel = require("../models/product.model");
const Joi = require("joi");
const upload = require("../middlewares/upload");

class ProductController {
    // constructor(){
    //     this.counter = 1
    // }
    productValidationSchema = Joi.object({
        product_name: Joi.string().required(),
        category: Joi.string().required(),
        variant: Joi.array().items({
            sku: Joi.string().required(),
            stock: Joi.number().required(),
            price: Joi.number().min(10),
            variant_type: Joi.array()
        })
    });


    skuGenerator = async (productName) => {
        const formattedName = productName.replace(/\s/g, '_'); // Replace spaces with underscores
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        const sku = formattedName.toUpperCase() + '_' + randomNum;

        const checkSKU = await productModel.findOne({
            sku,
            is_deleted: false,
        });
        if (checkSKU) await this.skuGenerator(productName);

        return sku;
    };

    addProduct = async (req, res) => {
        upload.any()(req, res, async err => {
            if (err) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    msg: err.messages
                });
            }
            try {
                req.body.variant = JSON.parse(req.body.variant);
                let { product_name, description, category, variant } = req.body;

                const { error } = this.productValidationSchema.validate(req.body);

                if (error) {
                    return res.status(httpStatus.CONFLICT).json({
                        success: false,
                        msg: error.message
                    });
                }

                Promise.all(req.files.map(value => {
                    const variantIndex = variant.findIndex(ele => ele.sku === value.fieldname);
                    if (variantIndex >= 0) variant[variantIndex].images = [value.path];
                }));

                const checkProduct = await productModel.findOne({
                    product_name,
                    is_deleted: false,
                });

                if (checkProduct) {
                    return res.status(httpStatus.CONFLICT).json({
                        success: false,
                        msg: "Product Already Exits!!"
                    });
                }
                const product_sku = await this.skuGenerator(product_name);

                const product = await productModel.create({
                    product_name, product_sku, description, category, variant
                });

                return res.status(httpStatus.OK).json({
                    success: true,
                    msg: "Product Added",
                    data: product
                });
            } catch (error) {
                console.log("error", error);
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    msg: "Something Went Wrong!!"
                });
            }

        });
    };

    getProducts = async (req, res) => {
        try {

            let { page = 1, size = 10, sort = { _id: -1 } } = req.query;
            let searchQuery = {
                is_deleted: false
            };

            if(req.query.category){
                searchQuery = {
                    ...searchQuery,
                    category: req.query.category
                };
            }
            
            if(req.query.date){
                sort = {
                    ...sort,
                    '_id': date
                };
            }

            if(req.query.price){
                console.log("price", req.query.price)
                sort = {
                    // ...sort,
                    'variant.0.price': parseInt(req.query.price)
                };
            }

            if (req.query.search) {
                searchQuery = {
                    ...searchQuery,
                    product_name: { $regex: req.query.search, $options: 'i' }
                };
            }
            console.log("sort", sort)
            const products = await productModel.find(searchQuery).select("product_name description category product_sku variant").populate({
                path: "category",
                select: "_id name"
            }).skip((page - 1) * size).limit(size).sort(sort);

            const totalCount = await productModel.countDocuments({
                is_deleted: false
            });

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Products!!",
                data: products,
                totalCount,
                size: parseInt(size),
                page: parseInt(page)
            });
        } catch (error) {
            console.log("err", error)
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    getProduct = async (req, res) => {
        try {
            const sku = req.params.sku;
            const product = await productModel.findOne({
                product_sku: sku
            }).select("product_name description category product_sku variant").populate({
                path: "category",
                select: "_id name"
            });
            if (!product) {
                return res.status(httpStatus.NOT_FOUND).json({
                    success: false,
                    msg: "Product Not Found!!"
                });
            }
            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Product!!",
                data: product
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    updateProduct = async (req, res) => {
        upload.any()(req, res, async err => {
            if (err) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    msg: err.messages
                });
            }

            try {
                const id = req.params.id;
                req.body.variant = JSON.parse(req.body.variant);

                const product = await productModel.findById(id);
                if (!product) {
                    return res.status(httpStatus.NOT_FOUND).json({
                        success: false,
                        msg: "Product Not Found!!"
                    });
                }

                if (req.body.product_name !== product.product_name) {
                    req.body.product_sku = await this.skuGenerator(req.body.product_name);
                }

                if (req.files) {
                    //change image
                    Promise.all(req.files.map(value => {
                        const variantIndex = req.body.variant.findIndex(ele => ele.sku === value.fieldname);
                        console.log(variantIndex, req.body.variant);
                        if (variantIndex >= 0) req.body.variant[variantIndex].images = [value.path];
                    }));
                }

                await productModel.findByIdAndUpdate(
                    id,
                    req.body,
                    { new: true }
                );
                return res.status(httpStatus.OK).json({
                    success: true,
                    msg: "Product Updated!!"
                });
            } catch (error) {
                console.log("error", error);
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    msg: "Something Went Wrong!!"
                });
            }
        });
    };

    deleteProduct = async (req, res) => {
        try {
            const id = req.params.id;
            const product = await productModel.findById(id);
            if (!product) {
                return res.status(httpStatus.NOT_FOUND).json({
                    success: false,
                    msg: "Product Not Found!!"
                });
            }

            product.is_deleted = true;
            await product.save();

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Product Deleted!!"
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    // search = (req, res)

}

module.exports = ProductController;