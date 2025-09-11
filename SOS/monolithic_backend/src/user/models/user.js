const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid:{
    type:String
  },
  displayname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  photoURL: {
    type: String,
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;