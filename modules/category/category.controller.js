const httpStatus = require("http-status");
const categoryModel = require("./category.model");
const Joi = require("joi");
const upload = require("../../middlewares/upload");
const productModel = require("../products/product.model");

class CategoryController {

    categoryValidationSchema = Joi.object({
        name: Joi.string().required()
    });

    addCategory = async (req, res) => {
        upload.single('image')(req, res, async err => {
            if (err) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    msg: err.messages
                });
            }

            try {
                let { name, parent_category, order } = req.body;
                const image = req.file ? req.file.path : '';

                const existingCategory = await categoryModel.findOne({
                    name,
                    parent_category: parent_category,
                    is_deleted: false,
                });

                if (existingCategory) {
                    return res.status(httpStatus.CONFLICT).json({
                        success: false,
                        msg: "Category name already exists!!"
                    });
                }

                if (!order) {
                    const query = {
                        is_deleted: false,
                        parent_category: parent_category || { $eq: null },
                    };
                    console.log("query", query);
                    const result = await categoryModel.aggregate([
                        {
                            $match: {
                                ...query,
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                maxOrder: { $max: '$order' },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                            },
                        },
                    ]);
                    console.log("result", result);
                    order = result.length ? result[0].maxOrder + 1 : 1;
                }

                const categoryData = {
                    name,
                    order,
                    image,
                    parent_category: parent_category
                };

                console.log("categ", categoryData);

                const category = await categoryModel.create(categoryData);

                if (parent_category) {
                    const parentCategory = await categoryModel.findOne({
                        _id: parent_category,
                    });
                    if (parentCategory !== null) {
                        parentCategory.children.push(category._id);
                        await parentCategory.save();
                    }
                }

                return res.status(httpStatus.OK).json({
                    success: true,
                    msg: "Category Added",
                    data: category
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

    getCategories = async (req, res) => {
        try {
            const { page = 1, size = 10, sort = { _id: -1 } } = req.query;

            let searchQuery = {
                is_active: true,
                is_deleted: false
            };
            if (req.query.search) {
                searchQuery = {
                    ...searchQuery,
                    name: { $regex: req.query.search, $options: 'i' }
                };
            }

            let categories = await categoryModel.find(searchQuery).select("name order image createdAt").skip((page - 1) * size).limit(size).sort(sort);

            categories = await Promise.all(
                categories.map(async value => {
                    value = value.toJSON();
                    value.product_count = await productModel.countDocuments({
                        category: value._id
                    });
                    return value;
                })
            );

            const totalCount = await categoryModel.countDocuments({
                is_active: true,
                is_deleted: false
            });

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Categories!!",
                data: categories,
                page,
                size,
                totalCount
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: error.message
            });
        }
    };

    getCategory = async (req, res) => {
        try {
            const id = req.params.id;
            const category = await categoryModel.findById(id).select("name image order createdAt");
            if (!category) {
                return res.status(httpStatus.NOT_FOUND).json({
                    success: false,
                    msg: "Category Not Found!!"
                });
            }
            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Category!!",
                data: category
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    updateCategory = async (req, res) => {
        upload.single('image')(req, res, async err => {
            if (err) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    msg: err.messages
                });
            }

            try {
                const id = req.params.id;
                if(req.file){
                    req.body.image = req.file.path
                }
                const category = await categoryModel.findById(id);
                if (!category) {
                    return res.status(httpStatus.NOT_FOUND).json({
                        success: false,
                        msg: "Category Not Found!!"
                    });
                }

                await categoryModel.findByIdAndUpdate(
                    id,
                    req.body,
                    { new: true }
                );
                return res.status(httpStatus.OK).json({
                    success: true,
                    msg: "Category Updated!!"
                });
            } catch (error) {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    msg: "Something Went Wrong!!"
                });
            }
        });
    };

    deleteCategory = async (req, res) => {
        try {
            const id = req.params.id;
            const category = await categoryModel.findById(id);
            if (!category) {
                return res.status(httpStatus.NOT_FOUND).json({
                    success: false,
                    msg: "Category Not Found!!"
                });
            }

            category.is_deleted = true;
            await category.save();

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Category Deleted!!"
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };
}

module.exports = CategoryController;