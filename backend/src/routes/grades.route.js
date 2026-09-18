const express = require("express");
const router = express.Router();

const auth_middleware = require("../middleware/auth.middleware");
const class_model = require("../models/classes.model");
const user_model = require("../models/user.model");
const Task = require("../models/task.model");

router.get("/grades", auth_middleware(), async (req, res, next) => {
  try {
    const user = await user_model.findOne({ uuid: req.user.uuid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.level !== 2) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const classes = await class_model.find({ _id: { $in: user.classes } });
    const now = new Date();

    const overview = [];

    for (const cls of classes) {
      const tasks = await Task.find({ class_id: cls._id }).populate(
        "submissions.student",
        "uuid"
      );

      const task_summaries = tasks.map((task) => {
        const submissions = task.submissions || [];
        const submission = submissions.find((s) => {
          if (!s.student) return false;

          if (s.student.uuid) {
            return s.student.uuid === user.uuid;
          }
          if (typeof s.student.toString === "function") {
            return s.student.toString() === user._id.toString();
          }
          return false;
        });

        let status = "not_submitted";
        let grade = null;

        if (submission) {
          if (typeof submission.grade === "number") {
            status = "graded";
            grade = submission.grade;
          } else {
            status = "submitted";
          }
        } else if (task.due_date && task.due_date < now) {
          status = "missing";
        }

        return {
          uuid: task.uuid,
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          status,
          grade
        };
      });

      overview.push({
        class_uuid: cls.uuid,
        class_name: cls.name,
        tasks: task_summaries
      });
    }

    return res.status(200).json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

