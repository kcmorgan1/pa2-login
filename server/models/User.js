const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    f_name:{type: String, required: true},
    l_name:{type: String, required: true},
    username:{type: String, required: true, unique: true},
    password:{type: String, required: true},
});
module.exports = mongoose.model('User', UserSchema);