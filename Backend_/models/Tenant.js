const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TenantSchema = new Schema({
    name: { type: String, required: true },
    owner: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    pin: { type: String },
    yearEstablished: { type: Number },
    type: { type: String, required: true },
    password: { type: String, required: true },
    logo: { type: String },
    planType: { type: String, required: true },
    status: { type: String, default: 'pending' },
});

module.exports = mongoose.model("Tenant", TenantSchema);