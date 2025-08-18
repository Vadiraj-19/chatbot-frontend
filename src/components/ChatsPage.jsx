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
    fetchPolicy: "network-only",
  });

  const [selectedChat, setSelectedChat] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [createChat] = useMutation(CREATE_CHAT, {
    update(cache, { data: { insert_chats_one } }) {
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
      setDrawerOpen(false);
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

  if (loading)
    return <p className="p-4 text-gray-400">Loading chats...</p>;
  if (error)
    return <p className="p-4 text-red-500">Error: {error.message}</p>;

  return (
    <div className="h-screen w-screen flex bg-black text-white overflow-hidden">
      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Drawer */}
      <aside
        role="navigation"
        aria-label="Sidebar chat list"
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-neutral-900 border-r border-neutral-800
          flex flex-col transition-transform duration-300 ease-in-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
          sm:static sm:translate-x-0
        `}
      >
        {/* Close button (mobile only) */}
        <button
          aria-label="Close sidebar"
          className="sm:hidden absolute top-4 right-4 text-white bg-neutral-900 p-2 rounded-full focus:outline-none focus:ring"
          onClick={() => setDrawerOpen(false)}
        >
          ×
        </button>

        {/* Branding/header - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2 px-6 py-6 border-b border-neutral-800">
          <img src={Logo} alt="Vynt Logo" className="w-12 h-12 select-none" draggable={false} />
          <h1 className="text-3xl font-semibold tracking-wide">Vynt</h1>
        </div>

        {/* New Chat button */}
        <button
          onClick={handleCreateChat}
          className="bg-neutral-800 hover:bg-neutral-700 text-white w-full py-2 rounded-md text-sm transition mb-4 px-6"
          aria-label="Start new chat"
        >
          + New Chat
        </button>

        {/* Chat list */}
        <ul className="flex-1 overflow-y-auto space-y-1 px-6 pr-3 custom-scrollbar">
          {data?.chats?.map((chat) => (
            <li
              key={chat.id}
              className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer truncate text-sm transition-all ${
                selectedChat === chat.id
                  ? "bg-neutral-800 text-white"
                  : "text-gray-400 hover:bg-neutral-800/70"
              }`}
              onClick={() => {
                setSelectedChat(chat.id);
                setDrawerOpen(false);
              }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if(e.key === 'Enter' || e.key === ' ') {
                  setSelectedChat(chat.id);
                  setDrawerOpen(false);
                }
              }}
              aria-current={selectedChat === chat.id ? "page" : undefined}
            >
              <span className="flex-1 truncate">{chat.title || "Untitled"}</span>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(chat.id);
                }}
                className="text-red-500 hover:text-red-400 px-1 focus:outline-none"
                aria-label={`Delete chat ${chat.title || "Untitled"}`}
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>

        {/* User Info and Logout */}
        <footer className="px-6 py-4 border-t border-neutral-800 bg-black">
          <div className="flex items-center gap-3 mb-2">
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
          <button
            onClick={() => nhost.auth.signOut()}
            className="bg-gray-800 text-white px-3 py-2 rounded-md hover:bg-red-700 mt-3 text-sm w-full"
            aria-label="Logout"
          >
            Logout
          </button>
        </footer>
      </aside>

      {/* Main chat window */}
      <main className="flex-1 min-h-0 flex flex-col bg-gradient-to-b from-neutral-950 to-black">
        {/* Mobile header with hamburger */}
        <header className="flex items-center justify-between bg-neutral-900 p-4 border-b border-neutral-700 sm:hidden">
          <button
            aria-label="Open sidebar"
            onClick={() => setDrawerOpen(true)}
            className="text-white focus:outline-none focus:ring focus:ring-cyan-500"
          >
            ☰
          </button>
          <h2 className="text-lg font-bold truncate">
            {data?.chats?.find((c) => c.id === selectedChat)?.title || "Chat"}
          </h2>
          <div style={{ width: "24px" }} /> {/* spacer */}
        </header>

        {selectedChat ? (
          <ChatView chatId={selectedChat} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-base">
            Select a chat to start
          </div>
        )}
      </main>
    </div>
  );
}
