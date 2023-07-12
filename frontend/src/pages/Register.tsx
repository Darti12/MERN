import React, {FormEvent} from 'react';
import {InferType, object, string} from 'yup';
import {Box, Button, TextField, Typography} from "@mui/material";
import {Controller, useForm} from "react-hook-form";
import {useRegisterUserMutation} from "../api/authApi";
import {yupResolver} from "@hookform/resolvers/yup";
import AuthContainer from "../components/AuthContainer";

const registerSchema = object({
    email: string()
        .min(1,'Email address is required')
        .email('Email Address is invalid'),
    password: string()
        .min(1,'Password is required')
        .min(8, 'Password must be more than 8 characters')
        .max(32, 'Password must be less than 32 characters')
});

export type RegisterInput = InferType<typeof registerSchema>;

const Register = () => {
    const methods = useForm({
        resolver: yupResolver(registerSchema)
    });

    const [registerUser, {error, isSuccess}] =
        useRegisterUserMutation();

    const onSubmit =(e?: FormEvent) => {
        e?.preventDefault();
        // do your early validation here

        methods.handleSubmit(()=> {
            const data: RegisterInput = methods.getValues();
            console.log(data)
            registerUser(data);
        })(e)
    }

    return (
        <AuthContainer>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Register
            </Typography>
            <form onSubmit={onSubmit}>
                <Controller
                    control={methods.control}
                    name="email"
                    defaultValue={""}
                    render={({field: {onChange, value}}) => (
                        <TextField
                            onChange={onChange}
                            value={value}
                            margin={"normal"}
                            style={{display: "block"}}
                            required
                            label="Email"
                        />
                    )}
                />
                <Controller
                    control={methods.control}
                    name="password"
                    defaultValue={""}
                    render={({field: {onChange, value}}) => (
                        <TextField
                            required
                            onChange={onChange}
                            margin={"normal"}
                            style={{display: "block"}}
                            value={value}
                            label="Password"
                            type="password"
                        />
                    )}
                />
                <Button variant={"contained"} onClick={onSubmit}>Register</Button>
            </form>
        </AuthContainer>
    )
}

export default Register;