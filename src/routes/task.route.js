const express = require("express");
const router = express.Router();

const archiver = require("archiver");
const axios = require("axios");
const mongoose = require("mongoose");

const Task = require("../models/task.model");
const HttpError = require("../classes/HttpError");

const auth_middleware = require("../middleware/auth.middleware");
const { task_schema } = require("../schemas/task.schema");
const { create_submission } = require("../schemas/submission.schema");

const is_teacher = (request, response, next) => {
  if (request.user.level !== 1) {
    return next(new HttpError("Forbidden: Only teachers can perform this action.", 403));
  }
  next();
};

router.post("/create_task", auth_middleware(), is_teacher, task_schema, async (request, response, next) => {
  try {
    const { title, description, class_id, attachments, due_date } = request.body;

    const new_task = new Task({
      title,
      description,
      class_id,
      attachments,
      due_date,
      created_by: request.user._id
    });

    await new_task.save();
    return response.status(201).json({ success: true, task: new_task.toSafeObject() });
  } catch (_error) {
    next(_error);
  }
});

router.get("/tasks/class/:class_id", auth_middleware(), async (request, response, next) => {
  try {
    const { class_id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(class_id)) {
      return next(new HttpError("Invalid class id.", 400));
    }

    const tasks = await Task.find({ class_id })
      .populate("submissions.student", "username uuid")
      .sort({ due_date: 1 });

    const safe_tasks = tasks.map((task) => task.toSafeObject());

    return response
      .status(200)
      .json({ success: true, count: safe_tasks.length, data: safe_tasks });
  } catch (_error) {
    next(_error);
  }
});

router.post("/:uuid/submit", auth_middleware(), create_submission, async (request, response, next) => {
  try {
    const { file_url, comment } = request.body;
    const { uuid } = request.params;

    const task = await Task.findOne({ uuid });
    if (!task) throw new HttpError("Task not found.", 404);

    const existing_submission = task.submissions.find(
      (s) => s.student.toString() === request.user._id.toString()
    );

    if (existing_submission) {
      existing_submission.file_url = file_url;
      existing_submission.student_comment = comment;
      existing_submission.submitted_at = Date.now();
    } else {
      task.submissions.push({
        student: request.user._id,
        file_url,
        student_comment: comment
      });
    }

    await task.save();
    return response.status(200).json({ success: true, message: "Task submitted successfully." });
  } catch (_error) {
    next(_error);
  }
});

router.patch("/:uuid/grade", auth_middleware(), is_teacher, async (request, response, next) => {
  try {
    const { student_uuid, grade, feedback } = request.body;
    const { uuid } = request.params;

    const task = await Task.findOne({ uuid }).populate('submissions.student');
    if (!task) throw new HttpError("Task not found.", 404);

    const submission = task.submissions.find(s => s.student.uuid === student_uuid);
    if (!submission) throw new HttpError("Submission not found for this student.", 404);

    submission.grade = grade;
    submission.teacher_feedback = feedback;
    submission.status = 'graded';

    await task.save();
    return response.status(200).json({ success: true, task: task.toSafeObject() });
  } catch (_error) {
    next(_error);
  }
});

router.get("/:uuid/download-all", auth_middleware(), is_teacher, async (request, response, next) => {
  try {
    const { uuid } = request.params;
    const task = await Task.findOne({ uuid }).populate("submissions.student", "username uuid");

    if (!task || task.submissions.length === 0) {
      throw new HttpError("No submissions available for download.", 404);
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    response.attachment(`${task.title.replace(/\s+/g, "_")}_submissions.zip`);
    archive.pipe(response);

    for (const sub of task.submissions) {
      if (sub.file_url) {
        try {
          const file_res = await axios.get(sub.file_url, { responseType: "stream" });
          const extension = sub.file_url.split(".").pop().split(/[?#]/)[0] || "file";
          const file_name = `${sub.student.username}_${sub.student.uuid}.${extension}`;
          archive.append(file_res.data, { name: file_name });
        } catch (fetch_error) {
          continue;
        }
      }
    }

    archive.finalize();
  } catch (_error) {
    next(_error);
  }
});

module.exports = router;