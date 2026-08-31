const mongoose = require("mongoose");
const crypto = require("crypto");

const Schema = mongoose.Schema;

// Chat is anonymous by constraint (ADR 0002) -- there is no user to own a
// transcript, so no user_id field exists here at all rather than a
// placeholder value (see the old `user_id: "blank"` this replaces).
//
// Instead of the Mongo ObjectId (only weakly unguessable, and exposed
// directly in the /chat/:id URL) each conversation gets its own random
// high-entropy `token`, generated once at creation and used everywhere the
// client needs to address this document again.
const chatSchema = new Schema(
    {
        messages: [
            {
                time: String,
                role: String,
                content: []
            },
        ],
        token: {
            type: String,
            required: true,
            unique: true,
            default: () => crypto.randomBytes(32).toString("hex"),
        },
    },
    { timestamps: true }
);

// TTL index (risk r2 / data-minimisation, docs/architecture/README.md
// section 8): these are unauthenticated strangers' messages with no
// lasting value, so retention is enforced by the schema rather than by a
// promise to remember to clean them up. MongoDB's TTL monitor deletes a
// document once `createdAt` is more than 30 days old.
chatSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model("Chat", chatSchema);
