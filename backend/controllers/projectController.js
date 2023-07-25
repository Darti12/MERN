const Project = require("../models/ProjectModel");
const mongoose = require("mongoose");

//get all projects
const getProjects = async (req, res) => {
  const user_id = req.user._id;

  const projects = await Project.find({ user_id }).sort({ createdAt: -1 });

  res.status(200).json(projects);
};

//get a single workout
const getProject = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such project" });
  }

  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({ error: "No such project" });
  }

  res.status(200).json(project);
};

//create a new project
const createProject = async (req, res) => {
  const { title, shortDescription, longDescription, gitHubUrl } = req.body;

  let emptyFields = [];

  if (!title) {
    emptyFields.push("title");
  }
  if (!shortDescription) {
    emptyFields.push("shortDescription");
  }
  if (!longDescription) {
    emptyFields.push("longDescription");
  }
  if (!gitHubUrl) {
    emptyFields.push("gitHubUrl");
  }
  if (emptyFields.length > 0) {
    return res
      .status(400)
      .json({ error: "Please fill in all the fields", emptyFields });
  }

  //add doc to DB
  try {
    const user_id = req.user._id;
    const project = await Project.create({
      title,
      shortDescription,
      longDescription,
      gitHubUrl,
    });
    res.status(200).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//delete a workout
const deleteProject = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such project" });
  }

  const project = await Project.findOneAndDelete({ _id: id });

  if (!project) {
    return res.status(404).json({ error: "No such project" });
  }

  res.status(200).json(project);
};

//update a project
const updateProject = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such project" });
  }

  const project = await Project.findOneAndUpdate(
    { _id: id },
    {
      ...req.body,
    },
  );

  if (!project) {
    return res.status(404).json({ error: "No such project" });
  }

  res.status(200).json(project);
};

module.exports = {
  getProject,
  getProjects,
  createProject,
  deleteProject,
  updateProject,
};
