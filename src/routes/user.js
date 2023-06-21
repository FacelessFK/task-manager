const express = require("express");
const User = require("../models/user");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");

const auth = require("../middleware/auth");

const router = express.Router();

router.post("/users", async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(200).send({ user, token });
    } catch (err) {
        res.status(400).send(err);
    }
});
router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(
            req.body.email,
            req.body.password
        );
        const token = await user.generateAuthToken();
        res.status(200).send({ user, token });
    } catch (err) {
        res.status(400).send();
    }
});
router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(
            (token) => token.token !== req.token
        );
        await req.user.save();
        res.send();
    } catch (err) {
        res.status(500).send();
    }
});
router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.status(200).send();
    } catch (err) {
        res.status(500).send;
    }
});

router.get("/users/me", auth, async (req, res) => {
    res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowUpdate = ["name", "email", "password", "age"];
    const isValidOperator = updates.every((update) =>
        allowUpdate.includes(update)
    );
    if (!isValidOperator) {
        return res.status(400).send({ error: "invalid Updates!" });
    }
    try {
        const user = req.user;
        updates.forEach((update) => (user[update] = req.body[update]));
        await user.save();
        res.send(user);
    } catch (err) {
        res.status(400).send(err);
    }
});
router.delete("/users/me", auth, async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ _id: req.user._id });
        res.send(user);
    } catch (err) {
        res.status(500).send(err);
    }
});
const upload = multer({
    limits: {},
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
            return cb(new Error("you must upload jpg or png or jpeng file"));
        }
        cb(undefined, true);
    }
});
router.post(
    "/users/me/avatar",
    auth,
    upload.single("avatar"),
    async (req, res) => {
        const buffer = await sharp(req.file.buffer).png().toBuffer();
        req.user.avatar = buffer;
        fs.writeFileSync("text.txt", buffer);

        await req.user.save();
        res.send();
    },
    (error, req, res, next) => {
        res.status(400).send({ error: error.message });
    }
);
router.delete(
    "/users/me/avatar",
    auth,
    async (req, res) => {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    },
    (error, req, res, next) => {
        res.status(400).send({ error: error.message });
    }
);
router.get("/users/:id/avatar", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            // return res.status(400).send();
            throw new Error("not found");
        }

        res.set("Content-Type", "image/jpg");
        res.send(user.avatar);
    } catch (err) {
        res.status(404).send();
    }
});

module.exports = router;
