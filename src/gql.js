import { gql } from "@apollo/client";

/* ===========================
   QUERIES
   =========================== */

// Fetch all chats for the logged-in user
export const CHATS = gql`
  query GetMyChats {
    chats(order_by: { created_at: desc }) {
      id
      title
      created_at
      chat_members {
        user_id
      }
    }
  }
`;

// Fetch messages for a chat
export const MESSAGES = gql`
  subscription GetMessages($chat_id: uuid!) {
    messages(
      where: { chat_id: { _eq: $chat_id } }
      order_by: { created_at: asc }
    ) {
      id
      content
      role
      created_at
      user_id
    }
  }
`;

// Fetch members of a chat
export const CHAT_MEMBERS = gql`
  query GetChatMembers($chat_id: uuid!) {
    chat_members(where: { chat_id: { _eq: $chat_id } }) {
      id
      user_id
    }
  }
`;

/* ===========================
   MUTATIONS: CHATS
   =========================== */

export const CREATE_CHAT = gql`
  mutation CreateChat {
  insert_chats_one(
    object: {
      title: "New Chat"
      chat_members: { data: {} } # 👈 automatically adds current user
    }
  ) {
    id
    title
    created_at
    chat_members {
      id
      user_id
    }
  }
}

`;

export const UPDATE_CHAT_TITLE = gql`
  mutation UpdateChatTitle($id: uuid!, $title: String!) {
    update_chats_by_pk(pk_columns: { id: $id }, _set: { title: $title }) {
      id
      title
    }
  }
`;

export const DELETE_CHAT = gql`
  mutation DeleteChat($id: uuid!) {
    delete_chats_by_pk(id: $id) {
      id
    }
  }
`;

/* ===========================
   MUTATIONS: CHAT MEMBERS
   =========================== */

// Add current logged-in user to a chat (user_id filled via Hasura preset)
export const ADD_CHAT_MEMBER = gql`
  mutation AddChatMember($chat_id: uuid!) {
    insert_chat_members_one(object: { chat_id: $chat_id }) {
      id
      chat_id
      user_id
    }
  }
`;

// Remove current logged-in user from a chat
export const LEAVE_CHAT = gql`
  mutation LeaveChat($chat_id: uuid!) {
    delete_chat_members(where: { chat_id: { _eq: $chat_id } }) {
      affected_rows
    }
  }
`;

/* ===========================
   MUTATIONS: MESSAGES
   =========================== */

export const INSERT_USER_MESSAGE = gql`
  mutation InsertUserMessage($chat_id: uuid!, $content: String!) {
    insert_messages_one(
      object: { chat_id: $chat_id, content: $content, role: "user" }
    ) {
      id
      content
      role
      created_at
    }
  }
`;

export const UPDATE_MESSAGE = gql`
  mutation UpdateMessage($id: uuid!, $content: String!) {
    update_messages_by_pk(
      pk_columns: { id: $id }
      _set: { content: $content }
    ) {
      id
      content
      updated_at
    }
  }
`;

export const DELETE_MESSAGE = gql`
  mutation DeleteMessage($id: uuid!) {
    delete_messages_by_pk(id: $id) {
      id
    }
  }
`;

/* ===========================
   ACTIONS
   =========================== */

export const SEND_MESSAGE = gql`
  mutation SendMessageToBot($chat_id: uuid!, $content: String!) {
    sendMessage(chat_id: $chat_id, content: $content) {
      id
      content
      role
      created_at
    }
  }
`;
