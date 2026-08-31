import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Project } from "../types/Project";
import {Chat} from "../types/Chat";

const apiURI = process.env.REACT_APP_API_URL;
export const chatApi = createApi({
  reducerPath: "chatApi",
  // Setting the baseUrl for every endpoint below.
  // No auth header: /api/chat is deliberately unauthenticated (see ADR 0002 —
  // anonymity is a hard constraint for the portfolio chatbot), and there is
  // no user state left in the store to source a token from since ADR 0005.
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiURI}/api/chat`,
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
