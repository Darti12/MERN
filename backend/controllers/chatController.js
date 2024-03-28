const Chat = require("../models/ChatModel");
const mongoose = require("mongoose");
const axios = require("axios")

//get all chats
const getChats = async (req, res) => {
  const user_id = req.user._id;

  const chats = await Chat.find({ user_id }).sort({ createdAt: -1 });

  res.status(200).json(chats);
};

//get a single chat
const getChat = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such chat" });
  }

  const chat = await Chat.findById(id);

  if (!chat) {
    return res.status(404).json({ error: "No such chat" });
  }

  res.status(200).json(chat);
};

//create a new chat
const createChat = async (req, res) => {
  const { messages } = req.body;
  let emptyFields = [];

  if (!messages) {
    emptyFields.push("messages");
  }

  if (emptyFields.length > 0) {
    return res.status(400).json({ error: "Invalid message", emptyFields });
  }

  // Ensure messages is an array and is not empty
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages must be a non-empty array" });
  }

  // Validate and format the messages
  const formattedMessages = messages.map((message) => {
    if (!message.role || !message.content) {
      throw new Error("Invalid message structure");
    }

    // Parse the content field if it's a stringified array
    const parsedContent = Array.isArray(message.content)
        ? message.content
        : JSON.parse(message.content);

    const formattedContent = parsedContent.map((item) => {
      if (typeof item === "string") {
        return { type: "text", text: item };
      } else if (item.type && item.text) {
        return item;
      } else {
        throw new Error("Invalid content structure");
      }
    });

    return {
      time: message.time || new Date().toISOString(),
      role: message.role,
      content: formattedContent,
    };
  });

  // Assuming sendMessageToClaude returns a single message object
  const claudeResponse = await sendMessageToClaude(formattedMessages);
  const combineMessages = [...formattedMessages, claudeResponse];

  try {
    const user_id = req.user._id;
    const chat = await Chat.create({ messages: combineMessages, user_id });
    res.status(200).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


//delete a workout
const deleteChat = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such chat" });
  }

  const chat = await Chat.findOneAndDelete({ _id: id });

  if (!chat) {
    return res.status(404).json({ error: "No such chat" });
  }

  res.status(200).json(chat);
};

//update a chat
const updateChat = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such chat" });
  }

  const claudeResponse = await sendMessageToClaude(req.body.messages)

  console.log(claudeResponse)

  const chat = await Chat.findOneAndUpdate(
    { _id: id },
    {
      ...req.body,
      ...{
        messages: {
          ...req.body.messages,
          claudeResponse
        }
      }
    },
  );

  if (!chat) {
    return res.status(404).json({ error: "No such chat" });
  }

  res.status(200).json(chat);
};

async function sendMessageToClaude(messages) {
  const cleanedList = cleanObjects(messages, ["role", "content"]);

  const apiURL = 'https://api.anthropic.com/v1/messages';
  const apiKey = process.env.ANTHROPIC_API_KEY; // Ensure the API key is set in your environment variables

  try {
    const response = await axios.post(apiURL, {
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: cleanedList
    }, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    // Assuming the response structure matches your expectations
    const msg = response.data;

    return {
      role: msg.role,
      time: new Date().toString(),
      content: msg.content
    };
  } catch (error) {
    console.error('Error sending message to Claude:', error);
    throw error;
  }
}

function cleanObjects(objects, variablesToKeep) {
  return objects.map(obj => {
    const cleanedObj = {};
    variablesToKeep.forEach(variable => {
      if (obj.hasOwnProperty(variable)) {
        cleanedObj[variable] = obj[variable];
      }
    });
    return cleanedObj;
  });
}

module.exports = {
  getChat,
  getChats,
  createChat,
  deleteChat,
  updateChat,
};
