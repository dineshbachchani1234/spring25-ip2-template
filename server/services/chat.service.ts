import ChatModel from '../models/chat.model';
import MessageModel from '../models/messages.model';
import UserModel from '../models/users.model';
import { Chat, ChatResponse, CreateChatPayload } from '../types/chat';
import { Message, MessageResponse } from '../types/message';

/**
 * Creates and saves a new message document in the database.
 * @param messageData - The message data to be created.
 * @returns {Promise<MessageResponse>} - Resolves with the created message or an error message.
 */
export const createMessage = async (messageData: Message): Promise<MessageResponse> => {
  // TODO: Task 3 - Implement the createMessage function. Refer to other service files for guidance.
  try {
    const result = await MessageModel.create(messageData);

    if (!result) {
      throw new Error('Failed to create message');
    }

    const messageObj = result.toObject();
    return {
      _id: messageObj._id,
      msg: messageObj.msg,
      msgFrom: messageObj.msgFrom,
      msgDateTime: messageObj.msgDateTime,
      type: messageObj.type,
    };
  } catch (error) {
    return { error: `Error occurred when creating message: ${error}` };
  }
};

/**
 * Creates and saves a new chat document in the database, saving messages dynamically.
 *
 * @param chat - The chat object to be saved, including full message objects.
 * @returns {Promise<ChatResponse>} - Resolves with the saved chat or an error message.
 */
export const saveChat = async (chatPayload: CreateChatPayload): Promise<ChatResponse> => {
  try {
    const messageIds: string[] = [];

    if (chatPayload.messages && chatPayload.messages.length > 0) {
      const messageResults = await Promise.all(
        chatPayload.messages.map(async messageData => {
          const messageResult = await createMessage(messageData);
          if ('error' in messageResult) {
            throw new Error(messageResult.error);
          }
          return messageResult._id;
        }),
      );
      messageIds.push(...messageResults.toString());
    }
    const chatData = {
      participants: chatPayload.participants,
      messages: messageIds,
    };

    const result = await ChatModel.create(chatData);

    if (!result) {
      throw new Error('Failed to create chat');
    }

    return {
      _id: result._id,
      participants: result.participants,
      messages: result.messages,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  } catch (error) {
    return { error: `Error occurred when saving chat: ${error}` };
  }
};
// TODO: Task 3 - Implement the saveChat function. Refer to other service files for guidance.

/**
 * Adds a message ID to an existing chat.
 * @param chatId - The ID of the chat to update.
 * @param messageId - The ID of the message to add to the chat.
 * @returns {Promise<ChatResponse>} - Resolves with the updated chat object or an error message.
 */
export const addMessageToChat = async (
  chatId: string,
  messageId: string,
): Promise<ChatResponse> => {
  try {
    const updatedChat = await ChatModel.findByIdAndUpdate(
      chatId,
      { $push: { messages: messageId } },
      { new: true },
    );

    if (!updatedChat) {
      throw new Error('Chat not found or failed to update');
    }

    return {
      _id: updatedChat._id,
      participants: updatedChat.participants,
      messages: updatedChat.messages,
      createdAt: updatedChat.createdAt,
      updatedAt: updatedChat.updatedAt,
    };
  } catch (error) {
    return { error: `Error occurred when adding message to chat: ${error}` };
  }
};
// TODO: Task 3 - Implement the addMessageToChat function. Refer to other service files for guidance.
/**
 * Retrieves a chat document by its ID.
 * @param chatId - The ID of the chat to retrieve.
 * @returns {Promise<ChatResponse>} - Resolves with the found chat object or an error message.
 */
export const getChat = async (chatId: string): Promise<ChatResponse> => {
  try {
    const chat = await ChatModel.findById(chatId);

    if (!chat) {
      throw new Error('Chat not found');
    }

    return {
      _id: chat._id,
      participants: chat.participants,
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  } catch (error) {
    return { error: `Error occurred when retrieving chat: ${error}` };
  }
};
// TODO: Task 3 - Implement the getChat function. Refer to other service files for guidance.

/**
 * Retrieves chats that include all the provided participants.
 * @param p An array of participant usernames to match in the chat's participants.
 * @returns {Promise<Chat[]>} A promise that resolves to an array of chats where the participants match.
 * If no chats are found or an error occurs, the promise resolves to an empty array.
 */
export const getChatsByParticipants = async (p: string[]): Promise<Chat[]> => {
  try {
    const chats = await ChatModel.find({
      participants: { $all: p },
    });

    return chats.map(chat => {
      const chatObj = chat.toObject();
      return {
        _id: chatObj._id,
        participants: chatObj.participants,
        messages: chatObj.messages,
        createdAt: chatObj.createdAt,
        updatedAt: chatObj.updatedAt,
      };
    });
  } catch (error) {
    console.error(`Error occurred when retrieving chats by participants: ${error}`);
    return [];
  }
};
// TODO: Task 3 - Implement the getChatsByParticipants function. Refer to other service files for guidance.

/**
 * Adds a participant to an existing chat.
 *
 * @param chatId - The ID of the chat to update.
 * @param userId - The ID of the user to add to the chat.
 * @returns {Promise<ChatResponse>} - Resolves with the updated chat object or an error message.
 */
export const addParticipantToChat = async (
  chatId: string,
  userId: string,
): Promise<ChatResponse> => {
  // TODO: Task 3 - Implement the addParticipantToChat function. Refer to other service files for guidance.
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedChat = await ChatModel.findByIdAndUpdate(
      chatId,
      { $addToSet: { participants: user.username } },
      { new: true },
    );

    if (!updatedChat) {
      throw new Error('Chat not found or failed to update');
    }

    return {
      _id: updatedChat._id,
      participants: updatedChat.participants,
      messages: updatedChat.messages,
      createdAt: updatedChat.createdAt,
      updatedAt: updatedChat.updatedAt,
    };
  } catch (error) {
    return { error: `Error occurred when adding participant to chat: ${error}` };
  }
};
