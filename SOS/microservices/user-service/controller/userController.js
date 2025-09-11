const bcryptjs = require("bcryptjs");
const User = require("../models/user");

registerUser = async (req, res) => {
    try {
        const { uid, displayname, email, photoURL } = req.body;
        const existingUser = await User.findOne({ uid });

        if (existingUser) {
            return res
                .status(200)
                .json({
                    message: "User with this email is already registered",
                });
        }

        const newUser = new User({
            uid,
            displayname,
            email,
            photoURL,
        });

        const savedUser = await newUser.save();

        const { _id, name: savedName, email: savedEmail } = savedUser;

        res.status(201).json({
            _id,
            name: savedName,
            email: savedEmail,
            message: "User registered successfully",
        });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const userToDelete = await User.findById(userId);
        if (!userToDelete) {
            return res.status(404).json({ message: "User not found" });
        }

        await User.findByIdAndDelete(userId);

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, password } = req.body;

        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
            return res.status(404).json({ message: "User not found" });
        }

        userToUpdate.username = username;
        userToUpdate.email = email;

        if (password) {
            userToUpdate.password = await bcryptjs.hash(password, 10);
        }

        const updatedUser = await userToUpdate.save();

        const {
            _id,
            username: updatedUsername,
            email: updatedEmail,
        } = updatedUser;

        res.json({
            _id,
            username: updatedUsername,
            email: updatedEmail,
            message: "User updated successfully",
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    registerUser,
    deleteUser,
    updateUser,
};
