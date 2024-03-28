const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatSchema = new Schema(
    {
        messages: [
            {
                time: String,
                role: String,
                content: []
            },
        ],
        user_id: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
