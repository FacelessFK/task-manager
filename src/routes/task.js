const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();
const Tasks = require("../models/task");

router.post("/tasks", auth, async (req, res) => {
    const task1 = new Tasks(req.body);
    task1.owner = req.user._id;

    try {
        const task = await task1.save();
        res.status(201).send(task);
    } catch (err) {
        res.status(400).send(err);
    }
});

router.get("/tasks", auth, async (req, res) => {
    const match = {};
    if (req.query.completed) match.completed = req.query.completed === "true";
    const sort = {};
    if (req.query.sortBy) {
        const part = req.query.sortBy.split(":");
        sort[part[0]] = part[1] === "desc" ? -1 : 1;
    }
    try {
        await req.user.populate({
            path: "tasks",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        });
        res.send(req.user.tasks);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});
router.get("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Tasks.findOne({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (err) {
        res.status(500).send("server is not respond!");
    }
});

router.patch("/tasks/:id", auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowUpdate = ["description", "completed"];
    const isValidUpdate = updates.every((update) =>
        allowUpdate.includes(update)
    );
    if (!isValidUpdate) {
        return res.status(400).send({ error: "invalid updates!" });
    }
    try {
        const task = await Tasks.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!task) {
            res.status(404).send();
        }
        updates.forEach((update) => (task[update] = req.body[update]));
        await task.save();
        res.status(200).send(task);
    } catch (err) {
        console.log("err : ", err);
        res.status(400).send(err);
    }
});
router.delete("/tasks/:id", auth, async (req, res) => {
    try {
        const task = await Tasks.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id
        });
        if (!task) {
            return res.status(404).send("user not found!");
        }
        res.status(200).send(task);
    } catch (err) {
        res.status(500).send("something went wrong!");
    }
});
module.exports = router;
