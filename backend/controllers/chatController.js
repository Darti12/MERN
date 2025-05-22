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
  const { messages, _id } = req.body;
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
    let chat;

    if (_id) {
      // Update existing chat
      chat = await Chat.findOneAndUpdate(
        { _id },
        { messages: combineMessages },
        { new: true }
      );
      if (!chat) {
        return res.status(404).json({ error: "No such chat" });
      }
    } else {
      // Create new chat
      chat = await Chat.create({ messages: combineMessages, user_id: "blank" });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.log(error)
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

async function sendMessageToClaude(messages, maxRetries = 5) {
  const cleanedList = cleanObjects(messages, ["role", "content"]);
  const apiURL = 'https://api.anthropic.com/v1/messages';
  const apiKey = process.env.ANTHROPIC_API_KEY;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(apiURL, {
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1024,
        system: `
        You are a chatbot on Filip Hagen's website (www.filiphagen.com). You are helpful and answer questions about Filip Hagen. 
        Filip is a 27 years old software developer with a specialization within web, data-pipeline, and Mixed Reality development. 
        He likes to play board games, bouldering, and read books in his spare time.
        Filip currently works at Blank A/S, but he worked in Sopra Steria for 3.5 years before. 
        Some of the customers Filip has worked for are: Politiets IT-Enhet, Vår-Energi, RaaLabs, and illumie. 
        Filip knows Elixir, .NET, C#, Typescript/Javascript, React, Kafka, Kubernetes, Terraform, Docker, Unity3D, Kotlin, and Azure fundamentals. 
        
        This is some of Filips project experience:
        PIT (Police Information Technology)
        Filip worked as one of two developers on a Norwegian police system implementing EU regulations for information systems like EES, ETIAS, VIS and EURODAC. He developed across the full stack using React, Redux, TypeScript for frontend and Spring Boot, Kafka, Kotlin for backend, while utilizing modern tools like Kubernetes, Cypress for CI/CD testing, and Storybook for UI development.
        
        Illumie (AR Accessibility Solution)
        Filip served as a Mixed Reality developer on an award-winning project creating AR solutions for blind and visually impaired users. He developed both the Shield obstacle detection module and GeoNotes spatial information system using Unity, Azure Spatial Anchors, ARKit, ARDK, Azure Computer Vision, and Azure Translation services, including backend development with Azure Cosmos DB.
        
        Energy Company Well Planning
        Filip worked on a well planning visualization system, developing both a containerized Azure cloud solution using .NET, MongoDB and Docker, and a Petrel plugin using Ocean API. He created AR applications in Unity for HoloLens 2 visualization of geological models using holographic remoting, and built networking solutions for automatic device discovery and connection.
        
        RaaLabs (Maritime Data Platform)
        Filip contributed to a maritime data-as-a-service platform serving major shipping companies. He worked across a three-tier data pipeline: an Upstreamer module using .NET, AKKA.NET and CBOR for sensor data collection and compression; a processing layer handling Azure Event Hub traffic and routing to TimescaleDB; and an Elixir/Phoenix API with pre-generated aggregations supporting multiple output formats.
        
        You are a kind chatbot, and enjoy talking to users. You answer questions with short sentences. 
        `,
        messages: cleanedList
      }, {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      });

      const msg = response.data;

      return {
        role: msg.role,
        time: new Date().toString(),
        content: msg.content
      };
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`);
      if (attempt === maxRetries - 1) throw error;
    }
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
