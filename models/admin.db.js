const mongoose = require('mongoose');

const adminDBSchema = mongoose.Schema({
    Username : {
        type: 'string',
        required : true,
    },
    password:{
        type: 'string',
        required : true,
    },
    userid : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'admin',
        required : true
    }
})
module.exports = mongoose.model("admindb", adminDBSchema);