const httpStatus = require("http-status");
const categoryModel = require("../models/category.model");
const Joi = require("joi");

class CategoryController {

    categoryValidationSchema = Joi.object({
        name:Joi.string().required()
    })

    addCategory = async (req, res) => {
        try {
            let { name, parent_category, order } = req.body;
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
                console.log("query", query)
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
                console.log("result", result)
                order = result.length ? result[0].maxOrder + 1 : 1;
            }

            const categoryData = {
                name,
                order,
                parent_category: parent_category
            };

            console.log("categ", categoryData)

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
            })
        } catch (error) {
            console.log("error", error)
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    getCategories = async (req, res) => {
        try {
            const {page=1, size=10, sort = {_id:-1}} = req.query

            if (req.query.search) {
                searchQuery = {
                    ...searchQuery,
                    name: { $regex: req.query.search, $options: 'i' }
                };
            }

            const categories = await categoryModel.find({
                is_active: true,
                is_deleted: false
            }).select("name order createdAt").skip((page-1) * size).limit(size).sort(sort)

            const totalCount = await categoryModel.countDocuments({
                is_active: true,
                is_deleted: false
            })

            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Categories!!",
                data : categories,
                page,
                size,
                totalCount
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    getCategory = async (req, res) => {
        try {
            const id = req.params.id
            const category = await categoryModel.findById(id).select("name order createdAt")
            if(!category){
                return res.status(httpStatus.NOT_FOUND).json({
                    success: false,
                    msg: "Category Not Found!!"
                });
            }
            return res.status(httpStatus.OK).json({
                success: true,
                msg: "Category!!",
                data : category
            });
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Something Went Wrong!!"
            });
        }
    };

    updateCategory = async (req, res) => {
        try {
            const id = req.params.id
            const category = await categoryModel.findById(id)
            if (!category) {
                return res.status(httpStatus.NOT_FOUND).json({
                    success: false,
                    msg: "Category Not Found!!"
                });
            }

            await categoryModel.findByIdAndUpdate(
                id,
                req.body,
                {new: true}
            )
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
    };

    deleteCategory = async (req, res) => {
        try {
            const id = req.params.id
            const category = await categoryModel.findById(id)
            if (!category) {
                return res.status(httpStatus.NOT_FOUND).json({
                    success: false,
                    msg: "Category Not Found!!"
                });
            }
            
            category.is_deleted = true
            await category.save()

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