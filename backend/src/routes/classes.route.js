const mongoose = require('mongoose');

const express = require("express");
const router = express.Router();

const { v4: uuid_v4 } = require("uuid");

const user_model = require("../models/user.model");
const class_model = require("../models/classes.model");
const auth_middleware = require("../middleware/auth.middleware");

router.get("/classes", auth_middleware(), async (req, res) => {
  try {
    const user = await user_model.findOne({ uuid: req.user.uuid });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const classes = await class_model.find({ _id: { $in: user.classes } });
    return res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

router.get("/:uuid", auth_middleware(), async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const found_class = await class_model.findOne({ uuid: uuid });

    if (!found_class) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    return res.status(200).json({ success: true, data: found_class });
  } catch (error) {
    console.error("Error fetching class by UUID:", error);
    next(error); 
  }
});

router.post("classes/create", auth_middleware(), async (req, res) => {
  try {
    const { class_name, student_names } = req.body; 
    const teacher = await user_model.findOne({ uuid: req.user.uuid });
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });

    const students = await user_model.find({
      username: { $in: student_names }, 
      level: 2 
    });

    const new_class = new class_model({
      name: class_name,
      teacher_name: teacher.username,
      student_count: students.length,
      uuid: uuid_v4()
    });

    const saved_class = await new_class.save();
    await user_model.updateOne(
      { _id: teacher._id },
      { $push: { classes: saved_class._id } }
    );

    if (students.length > 0) {
      await user_model.updateMany(
        { _id: { $in: students.map(s => s._id) } },
        { $push: { classes: saved_class._id } }
      );
    }

    return res.status(201).json({ success: true, data: saved_class });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;