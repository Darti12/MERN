const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Workout = require('../../models/WorkoutModel');
const User = require('../../models/userModel');
const { getWorkouts, getWorkout, createWorkout, deleteWorkout, updateWorkout } = require('../../controllers/workoutController');
const requireAuth = require('../../middleware/requireAuth');

// Create a mock express app for testing controllers
const app = express();
app.use(express.json());

// Mock requireAuth middleware
jest.mock('../../middleware/requireAuth', () => {
  return jest.fn((req, res, next) => {
    // Mock authenticated user
    req.user = {
      _id: '645d12e31530e123456789ab'
    };
    next();
  });
});

// Mock routes with auth middleware
app.use(requireAuth);
app.get('/api/workouts', getWorkouts);
app.get('/api/workouts/:id', getWorkout);
app.post('/api/workouts', createWorkout);
app.delete('/api/workouts/:id', deleteWorkout);
app.patch('/api/workouts/:id', updateWorkout);

describe('Workout Controller Tests', () => {
  
  describe('Get Workouts Controller', () => {
    beforeEach(async () => {
      // Create some test workouts
      await Workout.create([
        {
          title: 'Bench Press',
          reps: 10,
          load: 100,
          user_id: '645d12e31530e123456789ab'
        },
        {
          title: 'Squats',
          reps: 12,
          load: 150,
          user_id: '645d12e31530e123456789ab'
        }
      ]);
    });
    
    it('should get all workouts for the authenticated user', async () => {
      const response = await request(app)
        .get('/api/workouts')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body[0].title).toBeDefined();
      expect(response.body[0].user_id).toBe('645d12e31530e123456789ab');
    });
  });
  
  describe('Get Single Workout Controller', () => {
    let testWorkout;
    
    beforeEach(async () => {
      // Create a test workout
      testWorkout = await Workout.create({
        title: 'Bench Press',
        reps: 10,
        load: 100,
        user_id: '645d12e31530e123456789ab'
      });
    });
    
    it('should get a single workout by ID', async () => {
      const response = await request(app)
        .get(`/api/workouts/${testWorkout._id}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.title).toBe(testWorkout.title);
      expect(response.body.reps).toBe(testWorkout.reps);
      expect(response.body.load).toBe(testWorkout.load);
      expect(response.body.user_id).toBe(testWorkout.user_id);
    });
    
    it('should return 404 for invalid workout ID format', async () => {
      const response = await request(app)
        .get('/api/workouts/invalid-id')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.error).toBe('No such workout');
    });
    
    it('should return 404 for non-existent workout ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/workouts/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.error).toBe('No such workout');
    });
  });
  
  describe('Create Workout Controller', () => {
    it('should create a new workout with valid data', async () => {
      const workoutData = {
        title: 'Deadlift',
        reps: 5,
        load: 200
      };
      
      const response = await request(app)
        .post('/api/workouts')
        .send(workoutData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body._id).toBeDefined();
      expect(response.body.title).toBe(workoutData.title);
      expect(response.body.reps).toBe(workoutData.reps);
      expect(response.body.load).toBe(workoutData.load);
      expect(response.body.user_id).toBe('645d12e31530e123456789ab');
    });
    
    it('should return 400 with error for missing fields', async () => {
      const workoutData = {
        title: 'Deadlift',
        // Missing reps and load
      };
      
      const response = await request(app)
        .post('/api/workouts')
        .send(workoutData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.error).toBe('Please fill in all the fields');
      expect(response.body.emptyFields).toContain('load');
      expect(response.body.emptyFields).toContain('reps');
    });
  });
  
  describe('Delete Workout Controller', () => {
    let testWorkout;
    
    beforeEach(async () => {
      // Create a test workout
      testWorkout = await Workout.create({
        title: 'Bench Press',
        reps: 10,
        load: 100,
        user_id: '645d12e31530e123456789ab'
      });
    });
    
    it('should delete a workout by ID', async () => {
      const response = await request(app)
        .delete(`/api/workouts/${testWorkout._id}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body._id.toString()).toBe(testWorkout._id.toString());
      
      // Verify the workout was deleted
      const deletedWorkout = await Workout.findById(testWorkout._id);
      expect(deletedWorkout).toBeNull();
    });
    
    it('should return 404 for invalid workout ID format', async () => {
      const response = await request(app)
        .delete('/api/workouts/invalid-id')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.error).toBe('No such workout');
    });
    
    it('should return 404 for non-existent workout ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/workouts/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.error).toBe('No such workout');
    });
  });
  
  describe('Update Workout Controller', () => {
    let testWorkout;
    
    beforeEach(async () => {
      // Create a test workout
      testWorkout = await Workout.create({
        title: 'Bench Press',
        reps: 10,
        load: 100,
        user_id: '645d12e31530e123456789ab'
      });
    });
    
    it('should update a workout by ID', async () => {
      const updateData = {
        title: 'Incline Bench Press',
        reps: 12,
        load: 80
      };
      
      const response = await request(app)
        .patch(`/api/workouts/${testWorkout._id}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Verify the workout was updated
      const updatedWorkout = await Workout.findById(testWorkout._id);
      expect(updatedWorkout.title).toBe(updateData.title);
      expect(updatedWorkout.reps).toBe(updateData.reps);
      expect(updatedWorkout.load).toBe(updateData.load);
    });
    
    it('should return 404 for invalid workout ID format', async () => {
      const response = await request(app)
        .patch('/api/workouts/invalid-id')
        .send({ title: 'Updated Title' })
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.error).toBe('No such workout');
    });
    
    it('should return 404 for non-existent workout ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .patch(`/api/workouts/${nonExistentId}`)
        .send({ title: 'Updated Title' })
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.error).toBe('No such workout');
    });
  });
});