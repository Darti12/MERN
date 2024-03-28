import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { Project } from "../types/Project";
import {Chat} from "../types/Chat";

const apiURI = process.env.REACT_APP_API_URL;
export const chatApi = createApi({
  reducerPath: "chatApi",
  // Setting the baseUrl for every endpoint below
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiURI}/api/chat`,
    prepareHeaders: (headers, api) => {
      headers.set(
        "Authorization",
        `Bearer ${(api.getState() as RootState).userState.user?.token}`,
      );
      return headers;
    },
  }),
  tagTypes: ["Chat"],
  endpoints: (builder) => ({
    getChat: builder.query<Chat, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["Chat"],
    }),
    getChats: builder.query<Chat[], void>({
      query: () => ({
        url: `/`,
        method: "GET",
      }),
      providesTags: ["Chat"],
    }),
    updateChat: builder.mutation<Chat, Chat>({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Chat"],
    }),
    deleteChat: builder.mutation<Chat, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chat"],
    }),
  }),
});

export const {
  useGetChatQuery,
  useLazyGetChatQuery,
  useGetChatsQuery,
  useUpdateChatMutation,
  useDeleteChatMutation
} = chatApi;
