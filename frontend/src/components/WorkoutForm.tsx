import React, { FormEvent, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAddWorkoutMutation } from "../api/workoutApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Workout } from "../types/Workout";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";

const WorkoutForm = () => {
  const methods = useForm();
  const [addWorkout, { error, isSuccess }] = useAddWorkoutMutation();

  useEffect(() => {
    if (isSuccess) {
      methods.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const onSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    // do your early validation here

    methods.handleSubmit(() => {
      const data: Workout = methods.getValues();
      console.log(data);
      addWorkout(data);
    })(e);
  };

  return (
    <Card
      sx={{ minWidth: "20em", maxWidth: "25em", margin: "2em", height: "0" }}
    >
      <form onSubmit={onSubmit}>
        <CardContent style={{}}>
          <Typography variant="h5" component="div">
            Add a New Workout
          </Typography>
          <Controller
            control={methods.control}
            name="title"
            defaultValue={""}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextField
                required
                margin={"normal"}
                error={!!error}
                value={value}
                variant={"standard"}
                onChange={onChange}
                label="Title"
              />
            )}
          />

          <Controller
            control={methods.control}
            name="load"
            defaultValue={0}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextField
                required
                error={!!error}
                margin={"normal"}
                value={value}
                type={"number"}
                onChange={onChange}
                label="Load"
              />
            )}
          />

          <Controller
            control={methods.control}
            name="reps"
            defaultValue={0}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextField
                required
                error={!!error}
                margin={"normal"}
                value={value}
                type={"number"}
                onChange={onChange}
                label="Repetitions"
              />
            )}
          />

          {(error as FetchBaseQueryError)?.status && (
            <Typography color="text.secondary">
              {JSON.stringify((error as FetchBaseQueryError)?.data)}
            </Typography>
          )}
        </CardContent>

        <CardActions>
          <Button onClick={onSubmit}>Add Workout</Button>
        </CardActions>
      </form>
    </Card>
  );
};

export default WorkoutForm;
