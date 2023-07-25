import React, { FormEvent, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import { useAddProjectMutation } from "../api/projectApi";
import { Project } from "../types/Project";

const ProjectForm = () => {
  const methods = useForm();
  const [addProject, { error, isSuccess }] = useAddProjectMutation();

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
      const data: Project = methods.getValues();
      addProject(data);
    })(e);
  };

  return (
    <Card
      sx={{ minWidth: "20em", maxWidth: "25em", margin: "2em", height: "0" }}
    >
      <form onSubmit={onSubmit}>
        <CardContent style={{}}>
          <Typography variant="h5" component="div">
            Add a New Project
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
            name="shortDescription"
            defaultValue={0}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextField
                required
                error={!!error}
                margin={"normal"}
                value={value}
                onChange={onChange}
                label="Short description"
              />
            )}
          />

          <Controller
            control={methods.control}
            name="longDescription"
            defaultValue={0}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextField
                required
                error={!!error}
                margin={"normal"}
                value={value}
                onChange={onChange}
                label="Long description"
              />
            )}
          />
          <Controller
            control={methods.control}
            name="gitHubUrl"
            defaultValue={0}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextField
                required
                error={!!error}
                margin={"normal"}
                value={value}
                onChange={onChange}
                label="GitHub URL"
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
          <Button onClick={onSubmit}>Add Project</Button>
        </CardActions>
      </form>
    </Card>
  );
};

export default ProjectForm;
