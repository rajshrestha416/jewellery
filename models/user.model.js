const { boolean } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        contact: { type: Number, required: true },
        address: { type: String, required: true },
        password: { type: String, required: true },
        role: {
            type: [String], default: "user", enum: [
                "user",
                "admin",
                "super-admin"
            ]
        },
        image: {type: String},
        is_deleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
