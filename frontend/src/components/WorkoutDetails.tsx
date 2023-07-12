import React from "react";
import {Workout} from "../types/Workout";
import { useDeleteWorkoutMutation} from "../api/workoutApi";

import {formatDistanceToNow} from "date-fns"
import {Button, Card, CardActions, CardContent, Typography} from "@mui/material";

export interface WorkoutDetailsProps {
    workout: Workout;
}

const WorkoutDetails = (props: WorkoutDetailsProps) => {

    const [deleteWorkout] =
        useDeleteWorkoutMutation();

    return (
        <Card sx={{ minWidth: "25em", margin: "2em" }}>
            <CardContent>
                <Typography variant="h5" component="div">
                    {props.workout.title}
                </Typography>
                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                    <strong>Load (kg): </strong>
                    {props.workout.load}
                </Typography>
                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                    <strong>Reps: </strong>
                    {props.workout.reps}
                </Typography>
                <Typography sx={{ mb: 2 }} color="text.secondary">
                    {formatDistanceToNow(new Date(props.workout.createdAt!!), {addSuffix: true})}
                </Typography>
            </CardContent>
            <CardActions>
                <Button size="small" onClick={() => deleteWorkout(props.workout._id!!)}>Delete workout</Button>
            </CardActions>
        </Card>
    )
};

export default WorkoutDetails;
