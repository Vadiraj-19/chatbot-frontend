import { useState, useEffect, useRef } from "react";
import { useSubscription, useMutation } from "@apollo/client";
import {
  MESSAGES,
  INSERT_USER_MESSAGE,
  SEND_MESSAGE,
  UPDATE_CHAT_TITLE,
  UPDATE_MESSAGE,
  DELETE_MESSAGE,
} from "../gql";
import { Send, Edit, Trash2 } from "lucide-react";

export default function ChatView({ chatId }) {
  const [input, setInput] = useState("");
  const { data, loading } = useSubscription(MESSAGES, {
    variables: { chat_id: chatId },
  });

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const [sendUserMessage] = useMutation(INSERT_USER_MESSAGE);
  const [sendToBot, { loading: botLoading }] = useMutation(SEND_MESSAGE, {
    fetchPolicy: "no-cache",
  });

  const [updateChatTitle] = useMutation(UPDATE_CHAT_TITLE, {
    refetchQueries: ["CHATS"],
    awaitRefetchQueries: true,
  });

  const [updateMessage] = useMutation(UPDATE_MESSAGE, {
    refetchQueries: ["MESSAGES"],
    awaitRefetchQueries: true,
  });

  const [deleteMessage] = useMutation(DELETE_MESSAGE, {
    refetchQueries: ["MESSAGES"],
    awaitRefetchQueries: true,
  });

  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data]);

  const handleSend = async () => {
    if (!input.trim() || !chatId) return;
    try {
      const content = String(input);
      const chat_id = String(chatId);

      await sendUserMessage({ variables: { chat_id, content } });
      await sendToBot({ variables: { chat_id, content } });
      setInput("");

      const currentTitle = data?.messages?.[0]?.chat?.title || "New Chat";
      if (currentTitle === "New Chat" && content.trim()) {
        const newTitle = content.split(" ").slice(0, 5).join(" ");
        await updateChatTitle({ variables: { id: chatId, title: newTitle } });
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const handleUpdateMessage = async (id) => {
    if (!editingContent.trim()) {
      setEditingMessageId(null);
      setEditingContent("");
      return;
    }
    try {
      await updateMessage({ variables: { id, content: editingContent } });
      await sendToBot({
        variables: { chat_id: chatId, content: editingContent },
      });

      setEditingMessageId(null);
      setEditingContent("");
    } catch (err) {
      console.error("Update message error:", err);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (confirm("Are you sure you want to delete this message?")) {
      await deleteMessage({ variables: { id } });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (editingMessageId) {
        e.preventDefault();
        handleUpdateMessage(editingMessageId);
      } else if (!e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  if (loading) return <p className="p-4 text-gray-400">Loading messages...</p>;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-neutral-950 to-black">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
        {data?.messages.map((msg, idx) => {
          const role = msg.role ?? "user";
          const isUser = role === "user";
          const nextMsg = data?.messages[idx + 1];
          const showTime =
            !nextMsg ||
            new Date(nextMsg.created_at).getMinutes() !==
              new Date(msg.created_at).getMinutes();

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isUser ? "items-end" : "items-start"
              } group`}
            >
              <div className="flex items-end gap-2">
                {!isUser && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                    V
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`relative max-w-[90%] sm:max-w-[80%] md:max-w-[40ch] lg:max-w-[60ch] xl:max-w-[80ch] 
                  px-5 py-3 rounded-2xl shadow-md leading-relaxed
                  ${
                    isUser
                      ? "bg-cyan-900/70 text-white rounded-br-none"
                      : "bg-purple-900/70 text-gray-100 rounded-bl-none"
                  }`}
                >
                  {editingMessageId === msg.id ? (
                    <input
                      type="text"
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      autoFocus
                      className="w-full bg-neutral-800 text-white border border-gray-600 rounded-2xl px-3 py-2 outline-none"
                      onKeyDown={handleKeyDown}
                      onBlur={() =>
                        editingMessageId && handleUpdateMessage(msg.id)
                      }
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words break-all">
                      {msg.content}
                    </p>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                    U
                  </div>
                )}
              </div>

              {/* Actions below bubble */}
              {isUser && editingMessageId !== msg.id && (
                <div className="flex gap-2 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingMessageId(msg.id);
                      setEditingContent(msg.content);
                    }}
                    className="text-gray-400 hover:text-gray-200 p-1"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="text-gray-400 hover:text-gray-200 p-1"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {showTime && (
                <span className="text-xs text-gray-400 mt-1 select-none">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {botLoading && (
        <div className="px-6 py-3 text-gray-500 italic select-none animate-pulse">
          Vynt is typing...
        </div>
      )}

      {/* Input */}
      <div className="p-5 border-t border-neutral-800 flex gap-4 items-center bg-black/70 backdrop-blur-xl">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none bg-neutral-900/80 text-white border border-neutral-700 rounded-full px-5 py-3 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/30 transition"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || botLoading}
          className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
