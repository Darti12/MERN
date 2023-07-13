import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Workout } from "../types/Workout";
import { RootState } from "../store";

const apiURI = process.env.REACT_APP_API_URL;
export const workoutApi = createApi({
  reducerPath: "workoutApi",
  // Setting the baseUrl for every endpoint below
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiURI}/api/workouts`,
    prepareHeaders: (headers, api) => {
      headers.set(
        "Authorization",
        `Bearer ${(api.getState() as RootState).userState.user?.token}`,
      );
      return headers;
    },
  }),
  tagTypes: ["Workouts"],
  endpoints: (builder) => ({
    getWorkout: builder.query<Workout, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["Workouts"],
    }),
    getWorkouts: builder.query<Workout[], void>({
      query: () => ({
        url: `/`,
        method: "GET",
      }),
      providesTags: ["Workouts"],
    }),
    addWorkout: builder.mutation<Workout, Workout>({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Workouts"],
    }),
    updateWorkout: builder.mutation<Workout, Workout>({
      query: ({ _id, createdAt, updatedAt, ...patch }) => ({
        url: `/${_id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: ["Workouts"],
    }),
    deleteWorkout: builder.mutation<Workout, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Workouts"],
    }),
  }),
});

export const {
  useGetWorkoutQuery,
  useGetWorkoutsQuery,
  useAddWorkoutMutation,
  useUpdateWorkoutMutation,
  useDeleteWorkoutMutation,
} = workoutApi;
