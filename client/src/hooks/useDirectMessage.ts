import { useEffect, useState } from 'react';
import { Chat, ChatUpdatePayload, Message, User } from '../types';
import useUserContext from './useUserContext';
import { createChat, getChatById, getChatsByUser, sendMessage } from '../services/chatService';

/**
 * useDirectMessage is a custom hook that provides state and functions for direct messaging between users.
 * It includes a selected user, messages, and a new message state.
 */

const useDirectMessage = () => {
  const { user, socket } = useUserContext();
  const [showCreatePanel, setShowCreatePanel] = useState<boolean>(false);
  const [chatToCreate, setChatToCreate] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const handleJoinChat = (chatID: string) => {
    socket.emit('joinChat', chatID);
    // TODO: Task 3 - Emit a 'joinChat' event to the socket with the chat ID function argument.
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat?._id) {
      return;
    }
    try {
      const messageData = {
        msg: newMessage.trim(),
        msgFrom: user.username,
        msgDateTime: new Date(),
      };
      await sendMessage(messageData, selectedChat._id);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    // TODO: Task 3 - Implement the send message handler function.
    // Whitespace-only messages should not be sent, and the current chat to send this message to
    // should be defined. Use the appropriate service function to make an API call, and update the
    // states accordingly.
  };

  const handleChatSelect = async (chatID: string | undefined) => {
    if (!chatID) {
      return;
    }

    try {
      const chatDetails = await getChatById(chatID);
      setSelectedChat(chatDetails);
      handleJoinChat(chatID);
    } catch (error) {
      console.error('Failed to fetch chat details:', error);
    }
    // TODO: Task 3 - Implement the chat selection handler function.
    // If the chat ID is defined, fetch the chat details using the appropriate service function,
    // and update the appropriate state variables. Make sure the client emits a socket event to
    // subscribe to the chat room.
  };

  const handleUserSelect = (selectedUser: User) => {
    setChatToCreate(selectedUser.username);
  };

  const handleCreateChat = async () => {
    if (!chatToCreate) {
      return;
    }

    try {
      const newChat = await createChat([user.username, chatToCreate]);
      setChats(prevChats => [...prevChats, newChat]);
      setSelectedChat(newChat);
      if (newChat._id) {
        handleJoinChat(newChat._id);
      }
      setShowCreatePanel(false);
      setChatToCreate('');
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
    // TODO: Task 3 - Implement the create chat handler function.
    // If the username to create a chat is defined, use the appropriate service function to create a new chat
    // between the current user and the chosen user. Update the appropriate state variables and emit a socket
    // event to join the chat room. Hide the create panel after creating the chat.
  };

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const userChats = await getChatsByUser(user.username);
        setChats(userChats);
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      }
      // TODO: Task 3 - Fetch all the chats with the current user and update the state variable.
    };

    const handleChatUpdate = (chatUpdate: ChatUpdatePayload) => {
      // TODO: Task 3 - Implement the chat update handler function.
      // This function is responsible for updating the state variables based on the
      // socket events received. The function should handle the following cases:
      // - A new chat is created (add the chat to the current list of chats)
      // - A new message is received (update the selected chat with the new message)
      // - Throw an error for an invalid chatUpdate type
      // NOTE: For new messages, the user will only receive the update if they are
      // currently subscribed to the chat room.
      switch (chatUpdate.type) {
        case 'created':
          setChats(prevChats => {
            const exists = prevChats.some(chat => chat._id === chatUpdate.chat._id);
            if (exists) {
              return prevChats;
            }
            return [...prevChats, chatUpdate.chat];
          });
          break;
        case 'newMessage':
          if (selectedChat && selectedChat._id === chatUpdate.chat._id) {
            setSelectedChat(chatUpdate.chat);
          }
          setChats(prevChats =>
            prevChats.map(chat => (chat._id === chatUpdate.chat._id ? chatUpdate.chat : chat)),
          );
          break;
        default:
          throw new Error(`Invalid chatUpdate type: ${chatUpdate.type}`);
      }
    };

    fetchChats();

    // TODO: Task 3 - Register the 'chatUpdate' event listener

    socket.on('chatUpdate', handleChatUpdate);

    return () => {
      socket.off('chatUpdate', handleChatUpdate);
      if (selectedChat?._id) {
        socket.emit('leaveChat', selectedChat._id);
      }
      // TODO: Task 3 - Unsubscribe from the socket event
      // TODO: Task 3 - Emit a socket event to leave the particular chat room
      // they are currently in when the component unmounts.
    };
  }, [user.username, socket, selectedChat?._id]);

  return {
    selectedChat,
    chatToCreate,
    chats,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
    handleUserSelect,
    handleCreateChat,
  };
};

export default useDirectMessage;
