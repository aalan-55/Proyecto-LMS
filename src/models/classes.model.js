const mongoose = require("mongoose");

const class_schema = new mongoose.Schema({
  name: { type: String, required: true },

  teacher_name: { type: String, required: true },
  student_count: { type: Number, default: 0 },

  uuid: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model("Class", class_schema);