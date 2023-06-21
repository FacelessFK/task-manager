const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,

            required: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 7,
            trim: true,
            validate(value) {
                if (value.toLowerCase().includes("password")) {
                    throw new Error("pick a strong password!");
                }
            }
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,

            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error("Email is invalid!");
                }
            }
        },
        age: {
            type: Number,

            default: 0,
            validate(value) {
                if (value < 0) {
                    throw new Error("age must be a positive number!");
                }
            }
        },
        tokens: [
            {
                token: {
                    type: String,
                    required: true
                }
            }
        ],
        avatar: {
            type: Buffer
        }
    },
    {
        timestamps: true
    }
);

userSchema.virtual("tasks", {
    ref: "Tasks",
    localField: "_id",
    foreignField: "owner"
});

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("user not found");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("password is not correct");

    return user;
};

userSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign({ _id: this._id.toString() }, "thisissecret");

    this.tokens = this.tokens.concat({ token });
    await this.save();
    return token;
};

userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
};
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

userSchema.pre("findOneAndDelete", async function (next) {
    const user = this;

    console.log(user._conditions._id);
    await Task.deleteMany({ owner: user._conditions._id });
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
