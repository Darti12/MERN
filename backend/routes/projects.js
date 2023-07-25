const express = require("express");
const Project = require("../models/ProjectModel");
const {
  createProject,
  getProject,
  getProjects,
  deleteProject,
  updateProject,
} = require("../controllers/projectController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

//middleware for authentication
router.use(requireAuth);

//GET all projects
router.get("/", getProjects);

//GET a single project
router.get("/:id", getProject);

//POST a new project
router.post("/", createProject);

//DELETE a project
router.delete("/:id", deleteProject);

//UPDATE a project
router.patch("/:id", updateProject);

module.exports = router;
