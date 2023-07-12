import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {Workout} from "../types/Workout";

export const workoutApi = createApi({
    reducerPath: "workoutApi",
    // Setting the baseUrl for every endpoint below
    baseQuery: fetchBaseQuery({baseUrl: "http://localhost:4000/api/workouts"}),
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
            query: ({_id, createdAt, updatedAt, ...patch}) => ({
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
