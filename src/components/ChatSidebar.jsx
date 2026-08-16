import { useEffect, useState } from "react";

export default function ChatSidebar({
  userId,
  onSelectConversation,
}) {
  const [conversations, setConversations] =
    useState([]);

  useEffect(() => {
    fetch(
      `/api/v1/chat/history/${userId}`
    )
      .then((res) => res.json())
      .then((data) => setConversations(data));
  }, [userId]);

  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-4">
      <h2 className="font-bold text-xl mb-4">
        Chat History
      </h2>

      {conversations.map((chat) => (
        <div
          key={chat.conversation_id}
          className="p-3 rounded hover:bg-gray-700 cursor-pointer border-b border-gray-800"
          onClick={() =>
            onSelectConversation(chat.conversation_id)
          }
        >
          <div className="font-medium text-sm">
            {chat.title || "New Chat"}
          </div>

          <div className="text-xs text-gray-400 mt-1">
            {new Date(
              chat.updated_at
            ).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
