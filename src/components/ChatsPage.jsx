import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { nhost } from "../nhost";
import { CHATS, CREATE_CHAT, DELETE_CHAT } from "../gql";
import ChatView from "./ChatView";
import { useUserData } from "@nhost/react";
import Logo from "../assets/logo.png";

export default function ChatsPage() {
  const user = useUserData();
 const { data, loading, error } = useQuery(CHATS, {
  fetchPolicy: "network-only", // ensures fresh RLS-filtered data
});


  const [selectedChat, setSelectedChat] = useState(null);

  // Updated CREATE_CHAT mutation inserts user into chat_members
 const [createChat] = useMutation(CREATE_CHAT, {
  update(cache, { data: { insert_chats_one } }) {
    // Update CHATS query manually
    const existing = cache.readQuery({ query: CHATS });
    if (existing) {
      cache.writeQuery({
        query: CHATS,
        data: {
          chats: [insert_chats_one, ...existing.chats],
        },
      });
    }
    setSelectedChat(insert_chats_one.id);
  },
  onError: (err) => console.error(err),
});


  const [deleteChat] = useMutation(DELETE_CHAT, {
    refetchQueries: [{ query: CHATS }],
    awaitRefetchQueries: true,
    onError: (err) => console.error("Delete chat error:", err),
    onCompleted: (data) => {
      if (selectedChat === data.delete_chats_by_pk.id) setSelectedChat(null);
    },
  });

  // Auto-select first chat if none selected
  useEffect(() => {
    if (data?.chats?.length && !selectedChat) {
      setSelectedChat(data.chats[0].id);
    }
  }, [data, selectedChat]);

  const handleCreateChat = () => {
    createChat({ variables: { title: "New Chat" } });
  };

  const handleDeleteChat = (id) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      deleteChat({ variables: { id } });
    }
  };

  if (loading) return <p className="p-4 text-gray-400">Loading chats...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error.message}</p>;

  return (
    <div className="flex h-screen bg-black text-white font-sans">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-neutral-800 p-5 flex flex-col bg-neutral-950">
        {/* Logo + Branding */}
        <div className="flex items-center gap-2 mb-8">
          <img src={Logo} alt="Vynt Logo" className="h-12 w-12" />
          <h1 className="text-3xl font-semibold tracking-wide">Vynt</h1>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleCreateChat}
          className="bg-neutral-800 hover:bg-neutral-700 text-white w-full py-2 rounded-md text-sm transition mb-4"
        >
          + New Chat
        </button>

        {/* Chats List */}
        <ul className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
          {data?.chats?.map((chat) => (
            <li
              key={chat.id}
              className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer truncate text-sm transition-all ${
                selectedChat === chat.id
                  ? "bg-neutral-800 text-white"
                  : "text-gray-400 hover:bg-neutral-800/70"
              }`}
              onClick={() => setSelectedChat(chat.id)}
            >
              <span className="flex-1 truncate">{chat.title || "Untitled"}</span>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent selecting chat
                  handleDeleteChat(chat.id);
                }}
                className="text-red-500 hover:text-red-400 px-1"
                title="Delete"
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>

        {/* User Info */}
        <div className="flex items-center gap-3 p-3 border-t border-neutral-800 mt-4">
          <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-lg font-bold">
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium truncate">
              {user?.displayName || "User"}
            </span>
            <span className="text-gray-400 text-xs truncate">{user?.email}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => nhost.auth.signOut()}
          className="bg-gray-800 text-white px-3 py-2 rounded-md hover:bg-red-700 mt-3 text-sm w-full"
        >
          Logout
        </button>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1">
        {selectedChat ? (
          <ChatView chatId={selectedChat} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-base">
            Select a chat to start
          </div>
        )}
      </div>
    </div>
  );
}
