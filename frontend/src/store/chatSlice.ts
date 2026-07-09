import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchChatHistory, sendChatMessage } from "../api/ragApi";
import type { ChatMessageResponse } from "../api/ragApi";

interface ChatState {
  messages: Record<string, ChatMessageResponse[]>;
  loading: boolean;
  sending: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: {},
  loading: false,
  sending: false,
  error: null,
};

const chatKey = (courseId: string, lectureId: string) => `${courseId}:${lectureId}`;

export const fetchChatHistoryThunk = createAsyncThunk(
  "chat/fetchHistory",
  async ({ courseId, lectureId }: { courseId: string; lectureId: string }) => {
    const messages = await fetchChatHistory(courseId, lectureId);
    return { key: chatKey(courseId, lectureId), messages };
  },
);

export const sendChatMessageThunk = createAsyncThunk(
  "chat/sendMessage",
  async (
    { courseId, lectureId, question }: { courseId: string; lectureId: string; question: string },
    { rejectWithValue },
  ) => {
    try {
      const answer = await sendChatMessage(courseId, lectureId, question);
      return {
        key: chatKey(courseId, lectureId),
        question,
        answer: answer.message,
      };
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : "Failed to send message");
    }
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    clearChatError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchChatHistoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatHistoryThunk.fulfilled, (state, action) => {
        state.messages[action.payload.key] = action.payload.messages;
        state.loading = false;
      })
      .addCase(fetchChatHistoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch chat history";
      })

      .addCase(sendChatMessageThunk.pending, (state, action) => {
        state.sending = true;
        state.error = null;
        // Optimistically add the user message
        const { courseId, lectureId, question } = action.meta.arg;
        const key = chatKey(courseId, lectureId);
        if (!state.messages[key]) {
          state.messages[key] = [];
        }
        state.messages[key].push({
          _id: `temp-${Date.now()}`,
          userId: "",
          courseId,
          lectureId,
          role: "user",
          content: question,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      })
      .addCase(sendChatMessageThunk.fulfilled, (state, action) => {
        state.sending = false;
        const { key, answer } = action.payload;
        if (!state.messages[key]) {
          state.messages[key] = [];
        }
        state.messages[key].push({
          _id: `asst-${Date.now()}`,
          userId: "",
          courseId: "",
          lectureId: "",
          role: "assistant",
          content: answer,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      })
      .addCase(sendChatMessageThunk.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearChatError } = chatSlice.actions;
export default chatSlice.reducer;
