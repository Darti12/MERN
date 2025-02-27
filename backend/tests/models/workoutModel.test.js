const Workout = require('../../models/WorkoutModel');
const mongoose = require('mongoose');

describe('Workout Model Tests', () => {
  it('should create a new workout when all required fields are provided', async () => {
    const workoutData = {
      title: 'Bench Press',
      reps: 10,
      load: 100,
      user_id: '645d12e31530e123456789ab'
    };
    
    const workout = new Workout(workoutData);
    const savedWorkout = await workout.save();
    
    expect(savedWorkout._id).toBeDefined();
    expect(savedWorkout.title).toBe(workoutData.title);
    expect(savedWorkout.reps).toBe(workoutData.reps);
    expect(savedWorkout.load).toBe(workoutData.load);
    expect(savedWorkout.user_id).toBe(workoutData.user_id);
    expect(savedWorkout.createdAt).toBeDefined();
    expect(savedWorkout.updatedAt).toBeDefined();
  });
  
  it('should fail validation when title is missing', async () => {
    const workoutData = {
      reps: 10,
      load: 100,
      user_id: '645d12e31530e123456789ab'
    };
    
    const workout = new Workout(workoutData);
    
    await expect(workout.validate()).rejects.toThrow();
  });
  
  it('should fail validation when reps is missing', async () => {
    const workoutData = {
      title: 'Bench Press',
      load: 100,
      user_id: '645d12e31530e123456789ab'
    };
    
    const workout = new Workout(workoutData);
    
    await expect(workout.validate()).rejects.toThrow();
  });
  
  it('should fail validation when load is missing', async () => {
    const workoutData = {
      title: 'Bench Press',
      reps: 10,
      user_id: '645d12e31530e123456789ab'
    };
    
    const workout = new Workout(workoutData);
    
    await expect(workout.validate()).rejects.toThrow();
  });
  
  it('should fail validation when user_id is missing', async () => {
    const workoutData = {
      title: 'Bench Press',
      reps: 10,
      load: 100
    };
    
    const workout = new Workout(workoutData);
    
    await expect(workout.validate()).rejects.toThrow();
  });
  
  it('should save with timestamps', async () => {
    const workoutData = {
      title: 'Squats',
      reps: 12,
      load: 150,
      user_id: '645d12e31530e123456789ab'
    };
    
    const workout = new Workout(workoutData);
    const savedWorkout = await workout.save();
    
    expect(savedWorkout.createdAt).toBeInstanceOf(Date);
    expect(savedWorkout.updatedAt).toBeInstanceOf(Date);
  });
});