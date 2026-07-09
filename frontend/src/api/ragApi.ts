import apiClient from "./client";

export interface ChatMessageResponse {
  _id: string;
  userId: string;
  courseId: string;
  lectureId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * @desc Fetch chat history for a specific course/lecture.
 * @input {string} courseId - The course ID.
 * @input {string} lectureId - The lecture ID.
 * @output {Promise<ChatMessageResponse[]>} Array of chat messages sorted by creation time.
 */
export async function fetchChatHistory(
  courseId: string,
  lectureId: string,
): Promise<ChatMessageResponse[]> {
  const res = await apiClient.get(`/internal-rag/chat-history/${courseId}/${lectureId}`);
  return res.data?.data?.messages ?? [];
}

/**
 * @desc Send a chat question to the RAG-backed backend and return the answer.
 * @input {string} courseId - The course ID.
 * @input {string} lectureId - The lecture ID.
 * @input {string} question - The user's question.
 * @output {Promise<{ message: string }>} The assistant's response.
 */
export async function sendChatMessage(
  courseId: string,
  lectureId: string,
  question: string,
): Promise<{ message: string }> {
  const res = await apiClient.post("/internal-rag/chat", {
    courseId,
    lectureId,
    question,
  });
  return res.data?.data ?? res.data;
}
