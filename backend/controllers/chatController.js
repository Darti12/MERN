const Chat = require("../models/ChatModel");
const Anthropic = require("@anthropic-ai/sdk");
const { recordTokenUsage } = require("../middleware/tokenCeiling");

// No arguments: resolves ANTHROPIC_API_KEY from the environment (see
// docs/architecture/adr/0004-anthropic-sdk.md). Never pass a key literal
// here, and never construct this client in anything under frontend/.
const anthropic = new Anthropic();

// Part of the abuse guard (ADR 0002): reject oversized message arrays before
// any Anthropic call, independent of the request body size cap (a payload
// can be small in bytes but still carry an absurd number of turns).
const MAX_MESSAGES = Number(process.env.CHAT_MAX_MESSAGES) || 40;

// Model choice is a live cost lever, not an architectural decision (ADR
// 0004): the guard (ADR 0002) bounds worst-case daily spend regardless of
// which model is picked. docs/architecture/README.md section 14 still lists
// this as an open question, so default to the best-quality option here.
// claude-haiku-4-5 is the documented, materially cheaper alternative if the
// maintainer decides cost should win for these short biographical answers.
const MODEL = "claude-sonnet-5";

// Filip's date of birth, so the prompt never states a stale age. A hardcoded
// age rots silently and without warning: this one had drifted to three years
// out of date before anyone noticed, and the chatbot confidently repeated it.
// Month is 0-based, and UTC is used throughout so the value does not flip a
// day early or late depending on where the server runs.
const BIRTHDATE = { year: 1997, month: 7, day: 16 }; // 16 August 1997

function currentAge(now = new Date()) {
  let age = now.getUTCFullYear() - BIRTHDATE.year;
  const hadBirthdayThisYear =
    now.getUTCMonth() > BIRTHDATE.month ||
    (now.getUTCMonth() === BIRTHDATE.month && now.getUTCDate() >= BIRTHDATE.day);
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}

// Built per request rather than once at module load: a long-running process
// would otherwise keep serving last year's age indefinitely. The string only
// actually changes on one day a year, so this stays stable enough for prompt
// caching to work if it is ever enabled (see the note below).
function buildSystemPrompt() {
  return `
You are a chatbot on Filip Hagen's website (www.filiphagen.com). You are helpful and answer questions about Filip Hagen.
Filip is a ${currentAge()} years old software developer with a specialization within web, data-pipeline, and Mixed Reality development.
He likes to play board games, bouldering, and read books in his spare time.
Filip currently works at Blank A/S, but he worked in Sopra Steria for 3.5 years before.
Some of the customers Filip has worked for are: Politiets IT-Enhet, Vår-Energi, RaaLabs, Autodesk, and illumie.
Filip knows Elixir, .NET, C#, Typescript/Javascript, React, Kafka, Kubernetes, Terraform, Docker, Unity3D, Kotlin, Mixpanel, and GCP/Azure fundamentals.

This is some of Filips project experience:
PIT (Police Information Technology)
Filip worked as one of two developers on a Norwegian police system implementing EU regulations for information systems like EES, ETIAS, VIS and EURODAC. He developed across the full stack using React, Redux, TypeScript for frontend and Spring Boot, Kafka, Kotlin for backend, while utilizing modern tools like Kubernetes, Cypress for CI/CD testing, and Storybook for UI development.

Illumie (AR Accessibility Solution)
Filip served as a Mixed Reality developer on an award-winning project creating AR solutions for blind and visually impaired users. He developed both the Shield obstacle detection module and GeoNotes spatial information system using Unity, Azure Spatial Anchors, ARKit, ARDK, Azure Computer Vision, and Azure Translation services, including backend development with Azure Cosmos DB.

Energy Company Well Planning
Filip worked on a well planning visualization system, developing both a containerized Azure cloud solution using .NET, MongoDB and Docker, and a Petrel plugin using Ocean API. He created AR applications in Unity for HoloLens 2 visualization of geological models using holographic remoting, and built networking solutions for automatic device discovery and connection.

RaaLabs (Maritime Data Platform)
Filip contributed to a maritime data-as-a-service platform serving major shipping companies. He worked across a three-tier data pipeline: an Upstreamer module using .NET, AKKA.NET and CBOR for sensor data collection and compression; a processing layer handling Azure Event Hub traffic and routing to TimescaleDB; and an Elixir/Phoenix API with pre-generated aggregations supporting multiple output formats.

Autodesk (Experimentation and Data)
Filip worked on data-driven product development for Autodesk, centred on A/B testing and experimentation. He drafted and implemented experiments end to end, instrumented and analysed them in Mixpanel, and worked across data science and AI-driven development.

You are a kind chatbot, and enjoy talking to users. You answer questions with short sentences.
`;
}
// ^ Roughly 900 tokens after the Autodesk section: still under the ~1024-token
// minimum cacheable prefix
// (ADR 0004), so prompt caching will not engage as written. If this prompt
// grows, add a cache breakpoint by turning the `system` param above into
// `[{ type: "text", text: buildSystemPrompt(), cache_control: { type: "ephemeral" } }]`
// (the age changes one day a year, so the cached prefix stays stable)
// — it is identical on every request and close to free to cache once it
// clears the minimum. Do not add the breakpoint below that threshold; it
// would just add overhead for a prefix that never gets reused.

// Headers for the streamed chat reply. Sent once, before any Anthropic
// token or DB write, so the abuse guard's 429s (routes/chats.js) always
// happen as ordinary JSON responses — this only ever runs after the guard
// has already let the request through.
const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  // Disables response buffering on nginx-style proxies in front of the API,
  // so tokens actually reach the browser as they arrive instead of being
  // held until the buffer fills.
  "X-Accel-Buffering": "no",
};

function writeEvent(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// getChats (list-all-chats) is gone: it read req.user._id, a property
// nothing ever set now that chat is anonymous by constraint (ADR 0002),
// so the route threw on every call. There is no ownership model to list
// against any more.

//get a single chat, addressed by its high-entropy token rather than its
// Mongo ObjectId (see ChatModel.js) so a transcript can't be fetched by
// guessing/enumerating ids.
const getChat = async (req, res) => {
  const { id } = req.params;

  const chat = await Chat.findOne({ token: id });

  if (!chat) {
    return res.status(404).json({ error: "No such chat" });
  }

  res.status(200).json(chat);
};

//create a new chat
const createChat = async (req, res) => {
  const { messages, token } = req.body;
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

  // Reject oversized conversations before any billable call.
  if (messages.length > MAX_MESSAGES) {
    return res
      .status(400)
      .json({ error: `Too many messages; max is ${MAX_MESSAGES}` });
  }

  // Validate and format the messages
  let formattedMessages;
  try {
    formattedMessages = messages.map((message) => {
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
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  // Everything above this line can fail before any billable call, and
  // responds with an ordinary status code + JSON body. From here on the
  // response is a stream, so status is fixed at 200 and any failure is
  // reported in-band as an "error" event instead.
  res.writeHead(200, SSE_HEADERS);

  let claudeResponse;
  try {
    claudeResponse = await sendMessageToClaude(formattedMessages, {
      onDelta: (text) => writeEvent(res, { type: "delta", text }),
    });
  } catch (error) {
    console.error(error);
    writeEvent(res, { type: "error", error: error.message || "Claude request failed" });
    return res.end();
  }

  const combineMessages = [...formattedMessages, claudeResponse];

  try {
    let chat;

    if (token) {
      // Continue an existing chat, addressed by its token (see ChatModel.js).
      chat = await Chat.findOneAndUpdate(
        { token },
        { messages: combineMessages },
        { new: true }
      );
      if (!chat) {
        writeEvent(res, { type: "error", error: "No such chat" });
        return res.end();
      }
    } else {
      // Create new chat. No user_id: chat is anonymous by constraint (ADR
      // 0002), and `token` gets its high-entropy default from the schema.
      chat = await Chat.create({ messages: combineMessages });
    }

    writeEvent(res, { type: "done", chat });
    res.end();
  } catch (error) {
    console.log(error);
    writeEvent(res, { type: "error", error: error.message });
    res.end();
  }
};


//delete a chat, addressed by its token
const deleteChat = async (req, res) => {
  const { id } = req.params;

  const chat = await Chat.findOneAndDelete({ token: id });

  if (!chat) {
    return res.status(404).json({ error: "No such chat" });
  }

  res.status(200).json(chat);
};

//update a chat, addressed by its token
const updateChat = async (req, res) => {
  const { id } = req.params;

  // Same message-array cap as createChat — this path also calls Anthropic.
  if (
    !Array.isArray(req.body.messages) ||
    req.body.messages.length > MAX_MESSAGES
  ) {
    return res
      .status(400)
      .json({ error: `Messages must be an array of at most ${MAX_MESSAGES}` });
  }

  // From here on the response is a stream — see the comment in createChat.
  res.writeHead(200, SSE_HEADERS);

  let claudeResponse;
  try {
    claudeResponse = await sendMessageToClaude(req.body.messages, {
      onDelta: (text) => writeEvent(res, { type: "delta", text }),
    });
  } catch (error) {
    console.error(error);
    writeEvent(res, { type: "error", error: error.message || "Claude request failed" });
    return res.end();
  }

  const chat = await Chat.findOneAndUpdate(
    { token: id },
    { messages: [...req.body.messages, claudeResponse] },
    { new: true }
  );

  if (!chat) {
    writeEvent(res, { type: "error", error: "No such chat" });
    return res.end();
  }

  writeEvent(res, { type: "done", chat });
  res.end();
};

// Streams a reply from Anthropic. `onDelta`, if given, is called with each
// text chunk as it arrives so the caller can relay it to the client before
// the full reply is done (ADR 0004). Retry semantics — connection errors,
// 429 and 5xx retried, 400s never retried — come from the SDK itself; there
// is no hand-rolled retry loop here any more (that loop used to retry 400s
// too, multiplying spend on requests that could never succeed).
async function sendMessageToClaude(messages, { onDelta } = {}) {
  const cleanedList = cleanObjects(messages, ["role", "content"]);

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: cleanedList,
  });

  if (onDelta) {
    stream.on("text", onDelta);
  }

  // Rejects if the SDK's retries are exhausted or the request was invalid;
  // callers are responsible for catching this once streaming has started.
  const finalMessage = await stream.finalMessage();

  // Part of the abuse guard (ADR 0002): add this call's spend to the
  // persisted daily counter so the ceiling check on the next request
  // sees it. Fire-and-forget with its own error handling so a logging
  // failure never breaks the chat response itself. The SDK reports usage
  // on the final message of the stream.
  const usage = finalMessage.usage;
  if (usage) {
    const totalTokens = (usage.input_tokens || 0) + (usage.output_tokens || 0);
    recordTokenUsage(totalTokens).catch((err) =>
      console.error("Failed to record token usage:", err)
    );
  }

  return {
    role: finalMessage.role,
    time: new Date().toString(),
    content: finalMessage.content,
  };
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
  currentAge,
  buildSystemPrompt,
  getChat,
  createChat,
  deleteChat,
  updateChat,
};
