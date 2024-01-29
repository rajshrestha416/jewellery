const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
    firstname:{type: String},
    lastname:{type: String},
    email:{type: String},
    mobile_no:{type: String},
    message:{type: String},
    is_active: {type: Boolean, default: true},
    is_deleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

module.exports = mongoose.model('Contact', ContactSchema);