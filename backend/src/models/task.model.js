const mongoose = require("mongoose");
const { v4 } = require("uuid");

const task_schema = new mongoose.Schema({
    uuid: {
      type: String,
      required: true,
      unique: true,
      default: v4
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String 
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true
    },
    
    attachments: [{
      name: String,
      url: String,
      file_type: String 
    }],

    due_date: {
      type: Date
    },

    submissions: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      file_url: String,
      submitted_at: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['submitted', 'graded', 'returned'],
        default: 'submitted'
      },
      grade: {
        type: Number
      },
      teacher_feedback: {
        type: String
      }
    }]
  },
  { timestamps: true }
);

task_schema.methods.toSafeObject = function () {
  const task = this.toObject();
  delete task._id;
  delete task.__v;
  return task;
};

module.exports = mongoose.model("Task", task_schema);