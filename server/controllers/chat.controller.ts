import express, { Response } from 'express';
import {
  saveChat,
  createMessage,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
} from '../services/chat.service';
import { populateDocument } from '../utils/database.util';
import {
  CreateChatRequest,
  AddMessageRequestToChat,
  AddParticipantRequest,
  ChatIdRequest,
  GetChatByParticipantsRequest,
} from '../types/chat';
import { FakeSOSocket } from '../types/socket';

/*
 * This controller handles chat-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the chat routes.
 * @throws {Error} Throws an error if the chat creation fails.
 */
const chatController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Validates that the request body contains all required fields for a chat.
   * @param req The incoming request containing chat data.
   * @returns `true` if the body contains valid chat fields; otherwise, `false`.
   */
  const isCreateChatRequestValid = (req: CreateChatRequest): boolean =>
    req.body !== undefined &&
    req.body.participants !== undefined &&
    Array.isArray(req.body.participants) &&
    req.body.participants.length > 0 &&
    req.body.participants.every((p: unknown) => typeof p === 'string' && p.trim() !== '');

  // TODO: Task 3 - Implement the isCreateChatRequestValid function.

  /**
   * Validates that the request body contains all required fields for a message.
   * @param req The incoming request containing message data.
   * @returns `true` if the body contains valid message fields; otherwise, `false`.
   */
  const isAddMessageRequestValid = (req: AddMessageRequestToChat): boolean =>
    req.body !== undefined &&
    req.body.msg !== undefined &&
    typeof req.body.msg === 'string' &&
    req.body.msg.trim() !== '' &&
    req.body.msgFrom !== undefined &&
    typeof req.body.msgFrom === 'string' &&
    req.body.msgFrom.trim() !== '' &&
    req.body.msgDateTime !== undefined;
  // TODO: Task 3 - Implement the isAddMessageRequestValid function.

  /**
   * Validates that the request body contains all required fields for a participant.
   * @param req The incoming request containing participant data.
   * @returns `true` if the body contains valid participant fields; otherwise, `false`.
   */
  const isAddParticipantRequestValid = (req: AddParticipantRequest): boolean =>
    req.body !== undefined &&
    req.body.userId !== undefined &&
    typeof req.body.userId === 'string' &&
    req.body.userId.trim() !== '';
  // TODO: Task 3 - Implement the isAddParticipantRequestValid function.

  /**
   * Creates a new chat with the given participants (and optional initial messages).
   * @param req The request object containing the chat data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is created.
   * @throws {Error} Throws an error if the chat creation fails.
   */
  const createChatRoute = async (req: CreateChatRequest, res: Response): Promise<void> => {
    // TODO: Task 3 - Implement the createChatRoute function
    // Emit a `chatUpdate` event to share the creation of a new chat
    try {
      if (!isCreateChatRequestValid(req)) {
        res.status(400).send('Invalid chat request body');
        return;
      }

      const chatPayload = {
        participants: req.body.participants,
        messages: req.body.messages || [],
      };

      const result = await saveChat(chatPayload);

      if ('error' in result) {
        throw new Error(result.error);
      }

      const populatedChat = await populateDocument(result._id?.toString(), 'chat');

      if (!populatedChat) {
        throw new Error('Failed to populate chat document');
      }

      socket.emit('chatUpdate', {
        chat: populatedChat,
        type: 'created',
      });

      res.status(200).json(populatedChat);
    } catch (error) {
      res.status(500).send(`Error when creating chat: ${error}`);
    }
  };
  /**
   * Adds a new message to an existing chat.
   * @param req The request object containing the message data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the message is added.
   * @throws {Error} Throws an error if the message addition fails.
   */
  const addMessageToChatRoute = async (
    req: AddMessageRequestToChat,
    res: Response,
  ): Promise<void> => {
    // TODO: Task 3 - Implement the addMessageToChatRoute function
    // Emit a `chatUpdate` event to share the updated chat, specifically to
    // the chat room where the message was added (hint: look into socket rooms)
    // NOTE: Make sure to define the message type to be a direct message when creating it.
    try {
      if (!isAddMessageRequestValid(req)) {
        res.status(400).send('Invalid message request body');
        return;
      }

      const { chatId } = req.params;
      const { msg, msgFrom, msgDateTime } = req.body;

      const messageData = {
        msg,
        msgFrom,
        msgDateTime: msgDateTime ? new Date(msgDateTime) : new Date(),
        type: 'direct' as const,
      };

      const messageResult = await createMessage(messageData);

      if ('error' in messageResult) {
        throw new Error(messageResult.error);
      }

      if (!messageResult._id) {
        throw new Error('Message ID is undefined');
      }

      const chatResult = await addMessageToChat(chatId, messageResult._id.toString());

      if ('error' in chatResult) {
        throw new Error(chatResult.error);
      }

      const populatedChat = await populateDocument(chatResult._id?.toString(), 'chat');

      if (!populatedChat) {
        throw new Error('Failed to populate chat document');
      }

      socket.to(chatId).emit('chatUpdate', {
        chat: populatedChat,
        type: 'newMessage',
      });

      res.status(200).json(populatedChat);
    } catch (error) {
      res.status(500).send(`Error when adding message to chat: ${error}`);
    }
  };

  /**
   * Retrieves a chat by its ID, optionally populating participants and messages.
   * @param req The request object containing the chat ID.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is retrieved.
   * @throws {Error} Throws an error if the chat retrieval fails.
   */
  const getChatRoute = async (req: ChatIdRequest, res: Response): Promise<void> => {
    // TODO: Task 3 - Implement the getChatRoute function
    try {
      const { chatId } = req.params;

      const result = await getChat(chatId);

      if ('error' in result) {
        throw new Error(result.error);
      }

      const populatedChat = await populateDocument(result._id?.toString(), 'chat');

      if (!populatedChat) {
        throw new Error('Failed to populate chat document');
      }

      res.status(200).json(populatedChat);
    } catch (error) {
      res.status(500).send(`Error when retrieving chat: ${error}`);
    }
  };

  /**
   * Retrieves chats for a user based on their username.
   * @param req The request object containing the username parameter in `req.params`.
   * @param res The response object to send the result, either the populated chats or an error message.
   * @returns {Promise<void>} A promise that resolves when the chats are successfully retrieved and populated.
   */
  const getChatsByUserRoute = async (
    req: GetChatByParticipantsRequest,
    res: Response,
  ): Promise<void> => {
    // TODO: Task 3 - Implement the getChatsByUserRoute function
    try {
      const { username } = req.params;

      if (!username || username.trim() === '') {
        res.status(400).send('Username parameter is required');
        return;
      }

      const chats = await getChatsByParticipants([username]);

      const populatedChats = await Promise.all(
        chats.map(async chat => {
          const populatedChat = await populateDocument(chat._id?.toString(), 'chat');
          if (!populatedChat) {
            throw new Error(`Failed to populate chat document with ID: ${chat._id}`);
          }
          return populatedChat;
        }),
      );

      res.status(200).json(populatedChats);
    } catch (error) {
      res.status(500).send(`Error when retrieving chats by user: ${error}`);
    }
  };

  /**
   * Adds a participant to an existing chat.
   * @param req The request object containing the participant data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the participant is added.
   * @throws {Error} Throws an error if the participant addition fails.
   */
  const addParticipantToChatRoute = async (
    req: AddParticipantRequest,
    res: Response,
  ): Promise<void> => {
    // TODO: Task 3 - Implement the addParticipantToChatRoute function
    try {
      if (!isAddParticipantRequestValid(req)) {
        res.status(400).send('Invalid participant request body');
        return;
      }

      const { chatId } = req.params;
      const { userId } = req.body;

      const result = await addParticipantToChat(chatId, userId);

      if ('error' in result) {
        throw new Error(result.error);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when adding participant to chat: ${error}`);
    }
  };

  socket.on('connection', conn => {
    conn.on('joinChat', (chatId: string | undefined) => {
      if (chatId) {
        conn.join(chatId);
        console.log(`User ${conn.id} joined chat room: ${chatId}`);
      }
    });

    conn.on('leaveChat', (chatId: string | undefined) => {
      if (chatId) {
        conn.leave(chatId);
        console.log(`User ${conn.id} left chat room: ${chatId}`);
      }
    });
  });
  // TODO: Task 3 - Implement the `joinChat` event listener on `conn`
  // The socket room will be defined to have the chat ID as the room name
  // TODO: Task 3 - Implement the `leaveChat` event listener on `conn`
  // You should only leave the chat if the chat ID is provided/defined

  // Register the routes
  // TODO: Task 3 - Add appropriate HTTP verbs and endpoints to the router

  router.post('/createChat', createChatRoute);
  router.post('/:chatId/addMessage', addMessageToChatRoute);
  router.get('/:chatId', getChatRoute);
  router.post('/:chatId/participant', addParticipantToChatRoute);
  router.get('/getChatsByUser/:username', getChatsByUserRoute);

  return router;
};

export default chatController;
