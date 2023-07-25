import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { Project } from "../types/Project";

const apiURI = process.env.REACT_APP_API_URL;
export const projectApi = createApi({
  reducerPath: "projectApi",
  // Setting the baseUrl for every endpoint below
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiURI}/api/projects`,
    prepareHeaders: (headers, api) => {
      headers.set(
        "Authorization",
        `Bearer ${(api.getState() as RootState).userState.user?.token}`,
      );
      return headers;
    },
  }),
  tagTypes: ["Projects"],
  endpoints: (builder) => ({
    getProject: builder.query<Project, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["Projects"],
    }),
    getProjects: builder.query<Project[], void>({
      query: () => ({
        url: `/`,
        method: "GET",
      }),
      providesTags: ["Projects"],
    }),
    addProject: builder.mutation<Project, Project>({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Projects"],
    }),
    updateProject: builder.mutation<Project, Project>({
      query: ({ _id, createdAt, updatedAt, ...patch }) => ({
        url: `/${_id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: ["Projects"],
    }),
    deleteProject: builder.mutation<Project, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
  }),
});

export const {
  useGetProjectQuery,
  useGetProjectsQuery,
  useAddProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi;
