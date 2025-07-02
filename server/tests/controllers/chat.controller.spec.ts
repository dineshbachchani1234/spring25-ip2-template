import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';
import * as chatService from '../../services/chat.service';
import * as databaseUtil from '../../utils/database.util';
import { Chat } from '../../types/chat';
import { Message } from '../../types/message';
import { addAnswerToQuestion } from '../../services/answer.service';

/**
 * Spies on the service functions
 */
const saveChatSpy = jest.spyOn(chatService, 'saveChat');
const createMessageSpy = jest.spyOn(chatService, 'createMessage');
const addMessageSpy = jest.spyOn(chatService, 'addMessageToChat');
const getChatSpy = jest.spyOn(chatService, 'getChat');
const addParticipantSpy = jest.spyOn(chatService, 'addParticipantToChat');
const populateDocumentSpy = jest.spyOn(databaseUtil, 'populateDocument');
const getChatsByParticipantsSpy = jest.spyOn(chatService, 'getChatsByParticipants');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

/**
 * Sample test suite for the /chat endpoints
 */
describe('Chat Controller', () => {
  describe('POST /chat/createChat', () => {
    // TODO: Task 3 Write additional tests for the createChat endpoint
    it('should create a new chat successfully', async () => {
      const validChatPayload = {
        participants: ['user1', 'user2'],
        messages: [{ msg: 'Hello!', msgFrom: 'user1', msgDateTime: new Date('2025-01-01') }],
      };

      const serializedPayload = {
        ...validChatPayload,
        messages: validChatPayload.messages.map(message => ({
          ...message,
          msgDateTime: message.msgDateTime.toISOString(),
        })),
      };

      const chatResponse: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [
          {
            _id: new mongoose.Types.ObjectId(),
            msg: 'Hello!',
            msgFrom: 'user1',
            msgDateTime: new Date('2025-01-01'),
            user: {
              _id: new mongoose.Types.ObjectId(),
              username: 'user1',
            },
            type: 'direct',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue(chatResponse);

      const response = await supertest(app).post('/chat/createChat').send(validChatPayload);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        _id: chatResponse._id?.toString(),
        participants: chatResponse.participants.map(participant => participant.toString()),
        messages: chatResponse.messages.map(message => ({
          ...message,
          _id: message._id?.toString(),
          msgDateTime: message.msgDateTime.toISOString(),
          user: {
            ...message.user,
            _id: message.user?._id.toString(),
          },
        })),
        createdAt: chatResponse.createdAt?.toISOString(),
        updatedAt: chatResponse.updatedAt?.toISOString(),
      });

      expect(saveChatSpy).toHaveBeenCalledWith(serializedPayload);
      expect(populateDocumentSpy).toHaveBeenCalledWith(chatResponse._id?.toString(), 'chat');
    });

    it('should return 400 for invalid request body - missing participants', async () => {
      const invalidPayload = {
        messages: [],
      };

      const response = await supertest(app).post('/chat/createChat').send(invalidPayload);
      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid chat request body');
    });

    it('should return 400 for empty participants array', async () => {
      const invalidPayload = {
        participants: [],
        messages: [],
      };

      const response = await supertest(app).post('/chat/createChat').send(invalidPayload);
      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid chat request body');
    });

    it('should return 400 for participants with empty strings', async () => {
      const invalidPayload = {
        participants: ['user1', '', 'user2'],
        messages: [],
      };

      const response = await supertest(app).post('/chat/createChat').send(invalidPayload);
      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid chat request body');
    });

    it('should return 500 if saveChat service returns error', async () => {
      const validPayload = {
        participants: ['user1', 'user2'],
        messages: [],
      };

      saveChatSpy.mockResolvedValue({ error: 'Database error' });

      const response = await supertest(app).post('/chat/createChat').send(validPayload);
      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when creating chat');
    });
  });

  describe('POST /chat/:chatId/addMessage', () => {
    // TODO: Task 3 Write additional tests for the addMessage endpoint
    it('should add a message to chat successfully', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const messagePayload: Message = {
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
        type: 'direct',
      };

      const serializedPayload = {
        ...messagePayload,
        msgDateTime: messagePayload.msgDateTime.toISOString(),
      };

      const messageResponse = {
        _id: new mongoose.Types.ObjectId(),
        ...messagePayload,
        user: {
          _id: new mongoose.Types.ObjectId(),
          username: 'user1',
        },
      };

      const chatResponse = {
        _id: chatId,
        participants: ['user1', 'user2'],
        messages: [messageResponse],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      createMessageSpy.mockResolvedValue(messageResponse);
      addMessageSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue(chatResponse);

      const response = await supertest(app).post(`/chat/${chatId}/addMessage`).send(messagePayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: chatResponse._id.toString(),
        participants: chatResponse.participants.map(participant => participant.toString()),
        messages: chatResponse.messages.map(message => ({
          ...message,
          _id: message._id.toString(),
          msgDateTime: message.msgDateTime.toISOString(),
          user: {
            ...message.user,
            _id: message.user._id.toString(),
          },
        })),
        createdAt: chatResponse.createdAt.toISOString(),
        updatedAt: chatResponse.updatedAt.toISOString(),
      });

      expect(createMessageSpy).toHaveBeenCalledWith({
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: expect.any(Date), // Accept any Date object
        type: 'direct',
      });
      expect(addMessageSpy).toHaveBeenCalledWith(chatId.toString(), messageResponse._id.toString());
      expect(populateDocumentSpy).toHaveBeenCalledWith(chatResponse._id.toString(), 'chat');
    });

    it('should return 400 for missing message text', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const invalidPayload = {
        msgFrom: 'user1',
        msgDateTime: new Date(),
      };

      const response = await supertest(app).post(`/chat/${chatId}/addMessage`).send(invalidPayload);
      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid message request body');
    });

    it('should return 400 for empty message text', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const invalidPayload = {
        msg: '',
        msgFrom: 'user1',
        msgDateTime: new Date(),
      };

      const response = await supertest(app).post(`/chat/${chatId}/addMessage`).send(invalidPayload);
      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid message request body');
    });

    it('should return 400 for missing msgFrom', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const invalidPayload = {
        msg: 'Hello!',
        msgDateTime: new Date(),
      };

      const response = await supertest(app).post(`/chat/${chatId}/addMessage`).send(invalidPayload);
      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid message request body');
    });

    it('should return 500 if createMessage service returns error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const validPayload = {
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date(),
      };

      createMessageSpy.mockResolvedValue({ error: 'Failed to create message' });

      const response = await supertest(app).post(`/chat/${chatId}/addMessage`).send(validPayload);
      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when adding message to chat');
    });

    it('should return 500 if addMessageToChat service returns error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const validPayload = {
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date(),
      };

      const messageResponse = {
        _id: new mongoose.Types.ObjectId(),
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date(),
        type: 'direct' as const,
      };

      createMessageSpy.mockResolvedValue(messageResponse);
      addMessageSpy.mockResolvedValue({ error: 'Chat not found' });

      const response = await supertest(app).post(`/chat/${chatId}/addMessage`).send(validPayload);
      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when adding message to chat');
    });
  });

  describe('GET /chat/:chatId', () => {
    // TODO: Task 3 Write additional tests for the getChat endpoint
    it('should retrieve a chat by ID', async () => {
      // 1) Prepare a valid chatId param
      const chatId = new mongoose.Types.ObjectId().toString();

      // 2) Mock a fully enriched chat
      const mockFoundChat: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1'],
        messages: [
          {
            _id: new mongoose.Types.ObjectId(),
            msg: 'Hello!',
            msgFrom: 'user1',
            msgDateTime: new Date('2025-01-01T00:00:00Z'),
            user: {
              _id: new mongoose.Types.ObjectId(),
              username: 'user1',
            },
            type: 'direct',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 3) Mock the service calls
      getChatSpy.mockResolvedValue(mockFoundChat);
      populateDocumentSpy.mockResolvedValue(mockFoundChat);

      // 4) Invoke the endpoint
      const response = await supertest(app).get(`/chat/${chatId}`);

      // 5) Assertions
      expect(response.status).toBe(200);
      expect(getChatSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).toHaveBeenCalledWith(mockFoundChat._id?.toString(), 'chat');

      // Convert ObjectIds and Dates for comparison
      expect(response.body).toMatchObject({
        _id: mockFoundChat._id?.toString(),
        participants: mockFoundChat.participants.map(p => p.toString()),
        messages: mockFoundChat.messages.map(m => ({
          _id: m._id?.toString(),
          msg: m.msg,
          msgFrom: m.msgFrom,
          msgDateTime: m.msgDateTime.toISOString(),
          user: {
            _id: m.user?._id.toString(),
            username: m.user?.username,
          },
        })),
        createdAt: mockFoundChat.createdAt?.toISOString(),
        updatedAt: mockFoundChat.updatedAt?.toISOString(),
      });
    });

    it('should return 500 if getChat service returns error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      getChatSpy.mockResolvedValue({ error: 'Chat not found' });

      const response = await supertest(app).get(`/chat/${chatId}`);
      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when retrieving chat');
    });
  });

  describe('POST /chat/:chatId/addParticipant', () => {
    // TODO: Task 3 Write additional tests for the addParticipant endpoint
    it('should add a participant to an existing chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      const updatedChat: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addParticipantSpy.mockResolvedValue(updatedChat);

      const response = await supertest(app).post(`/chat/${chatId}/participant`).send({ userId });

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        _id: updatedChat._id?.toString(),
        participants: updatedChat.participants.map(id => id.toString()),
        messages: [],
        createdAt: updatedChat.createdAt?.toISOString(),
        updatedAt: updatedChat.updatedAt?.toISOString(),
      });

      expect(addParticipantSpy).toHaveBeenCalledWith(chatId, userId);
    });

    it('should return 404 for missing userId', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const invalidPayload = {};

      const response = await supertest(app)
        .post(`/chat/${chatId}/addParticipant`)
        .send(invalidPayload);
      expect(response.status).toBe(404);
    });

    it('should return 404 for empty userId', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const invalidPayload = { userId: '' };

      const response = await supertest(app)
        .post(`/chat/${chatId}/addParticipant`)
        .send(invalidPayload);
      expect(response.status).toBe(404);
    });

    it('should return 404 if addParticipantToChat service returns error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      addParticipantSpy.mockResolvedValue({ error: 'User not found' });

      const response = await supertest(app).post(`/chat/${chatId}/addParticipant`).send({ userId });
      expect(response.status).toBe(404);
    });
  });

  describe('POST /chat/getChatsByUser/:username', () => {
    it('should return 200 with an array of chats', async () => {
      const username = 'user1';
      const chats: Chat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user2'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      getChatsByParticipantsSpy.mockResolvedValueOnce(chats);
      populateDocumentSpy.mockResolvedValueOnce(chats[0]);

      const response = await supertest(app).get(`/chat/getChatsByUser/${username}`);

      expect(getChatsByParticipantsSpy).toHaveBeenCalledWith([username]);
      expect(populateDocumentSpy).toHaveBeenCalledWith(chats[0]._id?.toString(), 'chat');
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject([
        {
          _id: chats[0]._id?.toString(),
          participants: ['user1', 'user2'],
          messages: [],
          createdAt: chats[0].createdAt?.toISOString(),
          updatedAt: chats[0].updatedAt?.toISOString(),
        },
      ]);
    });

    it('should return 500 for empty username', async () => {
      const response = await supertest(app).get('/chat/getChatsByUser/');
      expect(response.status).toBe(500);
    });

    it('should return 500 for whitespace-only username', async () => {
      const response = await supertest(app).get('/chat/getChatsByUser/   ');
      expect(response.status).toBe(500);
      expect(response.text).toBe(
        'Error when retrieving chat: Error: Chat not found',
      );
    });

    it('should return 200 with empty array if no chats found', async () => {
      const username = 'userWithNoChats';

      getChatsByParticipantsSpy.mockResolvedValueOnce([]);

      const response = await supertest(app).get(`/chat/getChatsByUser/${username}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return error if populateDocument fails for any chat', async () => {
      const username = 'user1';
      const chats: Chat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user2'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      getChatsByParticipantsSpy.mockResolvedValueOnce(chats);
      populateDocumentSpy.mockResolvedValueOnce({ error: 'Service error' });

      const response = await supertest(app).get(`/chat/getChatsByUser/${username}`);

      expect(getChatsByParticipantsSpy).toHaveBeenCalledWith([username]);
      expect(populateDocumentSpy).toHaveBeenCalledWith(chats[0]._id?.toString(), 'chat');
      expect(response.body[0].error).toBe('Service error');
    });
  });
});
