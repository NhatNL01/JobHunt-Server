const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const companySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: { type: String },
  foundedYear: { type: String },
  scale: { type: String },
  address: { type: String },
  contact: { type: String },
  avatar: { type: String },
  joinDate: { type: Date, default: Date.now },
  members: [{
    type: mongoose.Types.ObjectId,
    //required: true, 
    ref: 'User'
  }]
});


module.exports = mongoose.model('Company', companySchema);
