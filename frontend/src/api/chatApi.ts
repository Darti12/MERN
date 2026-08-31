import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {Chat} from "../types/Chat";
import { CHAT_API_BASE_URL } from "../config";
export const chatApi = createApi({
  reducerPath: "chatApi",
  // Setting the baseUrl for every endpoint below.
  // No auth header: /api/chat is deliberately unauthenticated (see ADR 0002 —
  // anonymity is a hard constraint for the portfolio chatbot), and there is
  // no user state left in the store to source a token from since ADR 0005.
  baseQuery: fetchBaseQuery({
    baseUrl: CHAT_API_BASE_URL,
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
