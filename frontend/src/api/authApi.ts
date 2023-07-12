import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { LoginInput } from "../pages/Login"
import { RegisterInput } from '../pages/Register';

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:4000/api",
    }),
    endpoints: (builder) => ({
        registerUser: builder.mutation<{ email: string; token: string }, RegisterInput>({
            query(data) {
                return {
                    url: '/signup',
                    method: 'POST',
                    body: data,
                };
            },
        }),
        loginUser: builder.mutation<
            { email: string; token: string },
            LoginInput
        >({
            query(data) {
                return {
                    url: '/login',
                    method: 'POST',
                    body: data,
                    credentials: 'include',
                };
            },
            async onQueryStarted(args, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    //await dispatch(userApi.endpoints.getMe.initiate(null));
                } catch (error) {}
            },
        }),
    }),
});

export const {
    useLoginUserMutation,
    useRegisterUserMutation,
} = authApi;
