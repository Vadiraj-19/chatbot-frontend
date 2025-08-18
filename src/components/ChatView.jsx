import { useState, useEffect, useRef } from "react";
import { useSubscription, useMutation } from "@apollo/client";
import {
  MESSAGES,
  INSERT_USER_MESSAGE,
  SEND_MESSAGE,
  UPDATE_CHAT_TITLE,
  UPDATE_MESSAGE,
  DELETE_USER_AND_BOT_MESSAGES,
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
  const [deleteMessages] = useMutation(DELETE_USER_AND_BOT_MESSAGES, {
    refetchQueries: ["MESSAGES"],
    awaitRefetchQueries: true,
  });

  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data, botLoading]);

  const handleSend = async () => {
    if (!input.trim() || !chatId) return;
    try {
      const content = String(input);
      const chat_id = String(chatId);

      const resUserMsg = await sendUserMessage({
        variables: { chat_id, content },
      });

      const parent_message_id = resUserMsg.data.insert_messages_one.id;

      await sendToBot({
        variables: { chat_id, content, parent_message_id },
      });

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
        variables: {
          chat_id: chatId,
          content: editingContent,
          parent_message_id: id,
        },
      });
      setEditingMessageId(null);
      setEditingContent("");
    } catch (err) {
      console.error("Update message error:", err);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (confirm("Are you sure you want to delete this message and its responses?")) {
      await deleteMessages({ variables: { message_id: id } });
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

  if (loading)
    return <p className="p-4 text-gray-400">Loading messages...</p>;

  const userMessages = (data?.messages || []).filter(
    (m) => m.role === "user"
  );
  const botMessages = (data?.messages || []).filter((m) => m.role !== "user");

  return (
    <div className="flex flex-col h-screen min-h-0 bg-gradient-to-b from-neutral-950 to-black">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar pb-28">
        {userMessages.map((userMsg) => {
          const botMsg = botMessages.find(
            (b) => b.parent_message_id === userMsg.id
          );
          return (
            <div key={userMsg.id}>
              <MessageBubble
                msg={userMsg}
                isUser={true}
                editingMessageId={editingMessageId}
                editingContent={editingContent}
                setEditingMessageId={setEditingMessageId}
                setEditingContent={setEditingContent}
                handleUpdateMessage={handleUpdateMessage}
                handleDeleteMessage={handleDeleteMessage}
                handleKeyDown={handleKeyDown}
              />
              {botMsg && <MessageBubble msg={botMsg} isUser={false} />}
            </div>
          );
        })}
        {/* Typing indicator */}
        {botLoading && (
          <div className="px-6 py-3 text-center text-gray-400 italic select-none animate-pulse text-base">
            Vynt is typing...
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input fixed at bottom on mobile */}
      <div
        className="p-3 border-t border-neutral-800 flex gap-2 items-center bg-black/80
          backdrop-blur-xl fixed bottom-0 left-0 w-full sm:static sm:w-auto"
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none bg-neutral-900/80 text-white border border-neutral-700 rounded-full px-4 py-2
            focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/30 transition text-base"
          style={{ minHeight: "44px", maxHeight: "120px" }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || botLoading}
          className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 transition
            disabled:opacity-50 disabled:cursor-not-allowed shadow-md min-w-[44px] min-h-[44px]"
          aria-label="Send message"
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  isUser,
  editingMessageId,
  editingContent,
  setEditingMessageId,
  setEditingContent,
  handleUpdateMessage,
  handleDeleteMessage,
  handleKeyDown,
}) {
  return (
    <div className="mb-6">
      <div
        className={`flex items-end ${
          isUser
            ? "flex-row-reverse"
            : "flex-row"
        }`}
      >
        {/* Avatar desktop-side (md+) */}
        <div
          className={`hidden md:flex w-10 h-10 rounded-full items-center justify-center font-bold text-xl shadow-md select-none
            ${isUser
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white ml-2"
              : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white mr-2"
            }`}
        >
          {isUser ? "U" : "V"}
        </div>

        {/* Message bubble */}
        <div
          className={`
            relative
            max-w-[90vw] 
            md:max-w-[40ch]
            px-5 py-3
            rounded-2xl shadow-md leading-relaxed
            ${isUser
              ? "bg-cyan-900/70 text-white rounded-br-none ml-auto md:ml-0"
              : "bg-purple-900/70 text-gray-100 rounded-bl-none mr-auto md:mr-0"
            }
          `}
        >
          {editingMessageId === msg.id ? (
            <input
              type="text"
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              autoFocus
              className="w-full bg-neutral-800 text-white border border-gray-600 rounded-2xl px-3 py-2 outline-none"
              onKeyDown={handleKeyDown}
              onBlur={() => editingMessageId && handleUpdateMessage(msg.id)}
            />
          ) : (
            <p className="break-words whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>
      </div>
      {/* Avatar below bubble on mobile */}
      <div
        className={`flex md:hidden mt-2 w-full ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg shadow-md select-none ${
            isUser
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
              : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
          }`}
        >
          {isUser ? "U" : "V"}
        </div>
      </div>
      {/* Controls and timestamp */}
      <div>
        {isUser && editingMessageId !== msg.id && (
          <div className="flex gap-2 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setEditingMessageId(msg.id);
                setEditingContent(msg.content);
              }}
              className="text-gray-400 hover:text-gray-200 p-1"
              title="Edit"
              type="button"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDeleteMessage(msg.id)}
              className="text-gray-400 hover:text-gray-200 p-1"
              title="Delete"
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        <TimeStamp created_at={msg.created_at} />
      </div>
    </div>
  );
}



function TimeStamp({ created_at }) {
  const date = new Date(created_at);
  return (
    <span className="text-xs text-gray-400 mt-1 select-none">
      {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}
