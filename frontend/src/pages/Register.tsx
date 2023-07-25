import React, { FormEvent, useEffect, useState } from "react";
import { InferType, object, string } from "yup";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useRegisterUserMutation } from "../api/authApi";
import { yupResolver } from "@hookform/resolvers/yup";
import AuthContainer from "../components/AuthContainer";
import { isFetchBaseQueryErrorType } from "../types/Error";

const registerSchema = object({
  email: string()
    .min(1, "Email address is required")
    .email("Email Address is invalid"),
  password: string()
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export type RegisterInput = InferType<typeof registerSchema>;

const Register = () => {
  const [errorMessage, setErrorMessage] = useState("");

  const methods = useForm({
    resolver: yupResolver(registerSchema),
  });

  const [registerUser, { isLoading, error, isSuccess }] =
    useRegisterUserMutation();

  const onSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    // do your early validation here

    methods.handleSubmit(async () => {
      const data: RegisterInput = methods.getValues();
      await registerUser(data);
    })(e);
  };

  useEffect(() => {
    if (isFetchBaseQueryErrorType(error)) {
      setErrorMessage(error.data.error);
    } else {
      setErrorMessage("");
    }
  }, [error]);

  return (
    <AuthContainer>
      <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
        Register
      </Typography>
      <Stack spacing={1}>
        {isSuccess && (
          <Alert severity="success">
            Successfully registered user and logged in!
          </Alert>
        )}
        {error && <Alert severity="error">{errorMessage}</Alert>}
        {methods.formState.errors.email && (
          <Alert severity="error">
            {methods.formState.errors.email.message}
          </Alert>
        )}
        {methods.formState.errors.password && (
          <Alert severity="error">
            {methods.formState.errors.password.message}
          </Alert>
        )}
      </Stack>

      <form onSubmit={onSubmit}>
        <Controller
          control={methods.control}
          name="email"
          defaultValue={""}
          render={({ field, fieldState }) => (
            <TextField
              onChange={field.onChange}
              value={field.value}
              error={!!fieldState.error}
              margin={"normal"}
              style={{ display: "block" }}
              required
              label="Email"
            />
          )}
        />
        <Controller
          control={methods.control}
          name="password"
          defaultValue={""}
          render={({ field, fieldState }) => (
            <TextField
              required
              onChange={field.onChange}
              margin={"normal"}
              error={!!fieldState.error}
              style={{ display: "block" }}
              value={field.value}
              label="Password"
              type="password"
            />
          )}
        />
        {!isLoading && (
          <Button variant={"contained"} onClick={onSubmit}>
            Register
          </Button>
        )}
        {isLoading && <CircularProgress />}
      </form>
    </AuthContainer>
  );
};

export default Register;
