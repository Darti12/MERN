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
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useLoginUserMutation } from "../api/authApi";
import AuthContainer from "../components/AuthContainer";
import { isFetchBaseQueryErrorType } from "../types/Error";

const loginSchema = object({
  email: string()
    .min(1, "Email address is required")
    .email("Email Address is invalid"),
  password: string()
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export type LoginInput = InferType<typeof loginSchema>;

const Login = () => {
  const [errorMessage, setErrorMessage] = useState("");

  const methods = useForm({
    resolver: yupResolver(loginSchema),
  });

  const [loginUser, { isLoading, error, isSuccess }] = useLoginUserMutation();

  const onSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    // do your early validation here

    methods.handleSubmit(async () => {
      const data: LoginInput = methods.getValues();
      await loginUser(data);
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
      <Typography variant="h5" component="div">
        Login
      </Typography>
      <Stack spacing={1}>
        {isSuccess && <Alert severity="success">Successfully logged in!</Alert>}
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
          render={({ field: { onChange, value } }) => (
            <TextField
              onChange={onChange}
              style={{ display: "block" }}
              value={value}
              margin={"normal"}
              required
              label="Email"
            />
          )}
        />
        <Controller
          control={methods.control}
          name="password"
          defaultValue={""}
          render={({ field: { onChange, value } }) => (
            <TextField
              required
              onChange={onChange}
              margin={"normal"}
              style={{ display: "block" }}
              value={value}
              label="Password"
              type="password"
              autoComplete="current-password"
            />
          )}
        />
        {!isLoading && (
          <Button disabled={isSuccess} variant={"contained"} onClick={onSubmit}>
            Login
          </Button>
        )}
        {isLoading && <CircularProgress />}
      </form>
    </AuthContainer>
  );
};

export default Login;
