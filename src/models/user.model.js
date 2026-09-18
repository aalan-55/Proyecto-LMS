const mongoose = require("mongoose");
const { v4 } = require("uuid");

const user_schema = new mongoose.Schema({
    mail: {
      type: String,
      required: true,
      unique: true
    },

    username: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    uuid: {
      type: String,
      required: true,
      unique: true,
      default: v4
    },
    
    level: {
      type: Number, 
      required: true
    }, 

    session_id: {
      type: String
    },

    classes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }],
    assignments: [{
      title: String,
      course_name: String,
      due_date: Date,
      status: { type: String, default: 'pending' },
      link: String 
    }],
  },
  { timestamps: true }
);

user_schema.methods.toSafeObject = function () {
  const user = this.toObject();

  delete user.password;
  delete user._id;
  delete user.__v;

  return user;
};

module.exports = mongoose.model("User", user_schema);
