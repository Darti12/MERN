import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { LoginInput } from "../pages/Login";
import { RegisterInput } from "../pages/Register";
import { setUser } from "../user/userSlice";
import { User } from "../types/User";
import { workoutApi } from "./workoutApi";

const apiURI = process.env.REACT_APP_API_URL;
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiURI}/api/user`,
  }),
  endpoints: (builder) => ({
    registerUser: builder.mutation<
      { user: User; token: string },
      RegisterInput
    >({
      query(data) {
        return {
          url: "/signup",
          method: "POST",
          body: data,
        };
      },
      transformResponse: (result: { user: User; token: string }) => result,
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          localStorage.setItem("user", JSON.stringify(data));
          dispatch(setUser(data.user));
          dispatch(workoutApi.util.invalidateTags(["Workouts"]));
        } catch (error) {}
      },
    }),
    loginUser: builder.mutation<{ user: User }, LoginInput>({
      query(data) {
        return {
          url: "/login",
          method: "POST",
          body: data,
        };
      },
      transformResponse: (result: { user: User }) => result,
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          localStorage.setItem("user", JSON.stringify(data));
          dispatch(setUser(data.user));
          dispatch(workoutApi.util.invalidateTags(["Workouts"]));
        } catch (error) {}
      },
    }),
  }),
});

export const { useLoginUserMutation, useRegisterUserMutation } = authApi;
