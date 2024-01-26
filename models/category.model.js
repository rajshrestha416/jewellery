const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    name: { type: String, required: true },
    parent_category: { type: Schema.Types.ObjectId, ref: 'Category' },
    is_deleted: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    order: { type: Number },
    children: [{ type: Schema.Types.ObjectId, ref: 'Category' }]
}, {
    timestamps: true
});

async function populateChildren(categoryId) {
    const category = await Category.findById(categoryId)
        .select('_id name order is_active children')
        .populate({
            path: 'children',
            match: { is_active: true, is_deleted: false },
            select: '_id name order is_active children',
            options: { sort: { order: 1 } }
        })
        .lean();

    if (category && category.children) {
        await Promise.all(
            category.children.map(async (child) => {
                child.children = await populateChildren(child._id);
            })
        );
    }

    return category.children;
}

CategorySchema.statics.getCategoryHierarchy = async () => {
    try {
        const hierarchy = await Category.find({ parentCategory: null, is_deleted: false })
            .select('_id name image order is_active children')
            .sort({ order: 1 })
            .lean();

        await Promise.all(
            hierarchy.map(async (category) => {
                category.children = await populateChildren(category._id);
            })
        );

        return hierarchy;
    } catch (error) {
        console.error(error);
        throw new Error('Error fetching all children.');
    }
};

CategorySchema.virtual('childrens', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parentCategory',
    justOne: false,
    options: {
        match: {
            is_active: true,
            is_deleted: false
        },
        sort: {
            order: 1
        }
    }
});

CategorySchema.set('toObject', { virtuals: true });
CategorySchema.set('toJSON', { virtuals: true });

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
