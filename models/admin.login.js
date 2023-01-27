const mongoose = require("mongoose");
const adminSchema = mongoose.Schema({
  Username: {
    type: "string",
    required: true,
  },
  password: {
    type: "string",
    required: true,
  },
},{
    timestamps:true
});
module.exports = mongoose.model('admin',adminSchema);
