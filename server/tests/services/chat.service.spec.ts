/* eslint-disable @typescript-eslint/no-var-requires */
import mongoose from 'mongoose';

import ChatModel from '../../models/chat.model';
import MessageModel from '../../models/messages.model';
import UserModel from '../../models/users.model';
import * as chatService from '../../services/chat.service';
import {
  saveChat,
  createMessage,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
} from '../../services/chat.service';
import { Chat, CreateChatPayload } from '../../types/chat';
import { Message } from '../../types/message';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

describe('Chat service', () => {
  beforeEach(() => {
    mockingoose.resetAll();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // TODO: Clean up mocks and spies to prevent memory leaks
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockingoose.resetAll();
  });

  afterAll(async () => {
    // TODO: Final cleanup
    jest.restoreAllMocks();
    mockingoose.resetAll();

    // Wait for cleanup
    await new Promise<void>(resolve => {
      setTimeout(resolve, 100);
    });
  });

  // ----------------------------------------------------------------------------
  // 1. saveChat
  // ----------------------------------------------------------------------------
  describe('saveChat', () => {
    const mockChatPayload: CreateChatPayload = {
      participants: ['testUser'],
      messages: [
        {
          msg: 'Hello!',
          msgFrom: 'testUser',
          msgDateTime: new Date('2025-01-01T00:00:00Z'),
          type: 'direct',
        },
      ],
    };
    // TODO: Task 3 - Write tests for the saveChat function

    it('should successfully save a chat and verify its body (ignore exact IDs)', async () => {
      // 2) Mock message creation
      mockingoose(MessageModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          msg: 'Hello!',
          msgFrom: 'testUser',
          msgDateTime: new Date('2025-01-01T00:00:00Z'),
          type: 'direct',
        },
        'create',
      );

      // 3) Mock chat creation
      mockingoose(ChatModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['testUser'],
          messages: [new mongoose.Types.ObjectId()],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'create',
      );

      // 4) Call the service
      const result = await saveChat(mockChatPayload);

      // 5) Verify no error
      if ('error' in result) {
        throw new Error(`Expected a Chat, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
      expect(Array.isArray(result.participants)).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.participants[0]?.toString()).toEqual(expect.any(String));
      expect(result.messages[0]?.toString()).toEqual(expect.any(String));
    });

    it('should save a chat with no initial messages', async () => {
      const payloadWithoutMessages: CreateChatPayload = {
        participants: ['user1', 'user2'],
        messages: [],
      };

      mockingoose(ChatModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user2'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'create',
      );

      const result = await saveChat(payloadWithoutMessages);

      if ('error' in result) {
        throw new Error(`Expected a Chat, got error: ${result.error}`);
      }

      expect(result.participants).toEqual(['user1', 'user2']);
      expect(result.messages).toEqual([]);
    });

    it('should return error if message creation fails', async () => {
      const mockPayload: CreateChatPayload = {
        participants: ['testUser'],
        messages: [
          {
            msg: 'Hello!',
            msgFrom: 'testUser',
            msgDateTime: new Date(),
            type: 'direct',
          },
        ],
      };

      jest
        .spyOn(chatService, 'createMessage')
        .mockResolvedValueOnce({ error: 'Failed to create message' });

      const result = await saveChat(mockPayload);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when saving chat');
      }
    });

    it('should return error if chat creation fails', async () => {
      const mockPayload: CreateChatPayload = {
        participants: ['testUser'],
        messages: [],
      };
      jest.spyOn(ChatModel, 'create').mockRejectedValueOnce(new Error('Database error'));

      const result = await saveChat(mockPayload);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when saving chat');
      }
    });

    it('should return error if chat creation returns null', async () => {
      const mockPayload: CreateChatPayload = {
        participants: ['testUser'],
        messages: [],
      };

      jest
        .spyOn(ChatModel, 'create')
        .mockRejectedValueOnce(new Error('Chat Creation returns error'));

      const result = await saveChat(mockPayload);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Chat Creation returns error');
      }
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  // ----------------------------------------------------------------------------
  // 2. createMessage
  // ----------------------------------------------------------------------------
  describe('createMessage', () => {
    // TODO: Task 3 - Write tests for the createMessage function
    const mockMessage: Message = {
      msg: 'Hey!',
      msgFrom: 'userX',
      msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
      type: 'direct',
    };

    it('should create a message successfully if user exists', async () => {
      // Mock the user existence check
      mockingoose(UserModel).toReturn(
        { _id: new mongoose.Types.ObjectId(), username: 'userX' },
        'findOne',
      );

      // Mock the created message
      const mockCreatedMsg = {
        _id: new mongoose.Types.ObjectId(),
        ...mockMessage,
      };
      mockingoose(MessageModel).toReturn(mockCreatedMsg, 'create');

      const result = await createMessage(mockMessage);

      expect(result).toMatchObject({
        msg: 'Hey!',
        msgFrom: 'userX',
        msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
        type: 'direct',
      });
    });

    it('should return error if message creation fails', async () => {
      const mockMessageFail: Message = {
        msg: 'Hey!',
        msgFrom: 'userX',
        msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
        type: 'direct',
      };
      jest.spyOn(MessageModel, 'create').mockRejectedValueOnce(new Error('Database error'));

      const result = await createMessage(mockMessageFail);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when creating message');
      }
    });

    it('should return error if message creation returns null', async () => {
      const mockMessageNull: Message = {
        msg: 'Hey!',
        msgFrom: 'userX',
        msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
        type: 'direct',
      };

      jest.spyOn(MessageModel, 'create').mockRejectedValueOnce(new Error('Creation failed'));

      const result = await createMessage(mockMessageNull);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Creation failed');
      }
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  // ----------------------------------------------------------------------------
  // 3. addMessageToChat
  // ----------------------------------------------------------------------------
  describe('addMessageToChat', () => {
    // TODO: Task 3 - Write tests for the addMessageToChat function
    it('should add a message ID to an existing chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();

      const mockUpdatedChat: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Chat;

      // Mock findByIdAndUpdate
      mockingoose(ChatModel).toReturn(mockUpdatedChat, 'findOneAndUpdate');

      const result = await addMessageToChat(chatId, messageId);
      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }

      expect(result.messages).toEqual(mockUpdatedChat.messages);
    });

    it('should return error if chat not found', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();

      mockingoose(ChatModel).toReturn(null, 'findOneAndUpdate');

      const result = await addMessageToChat(chatId, messageId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Chat not found or failed to update');
      }
    });

    it('should return error if database error occurs', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();

      mockingoose(ChatModel).toReturn(new Error('Database error'), 'findOneAndUpdate');

      const result = await addMessageToChat(chatId, messageId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when adding message to chat');
      }
    });

    it('should add multiple messages to the same chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId1 = new mongoose.Types.ObjectId().toString();
      const messageId2 = new mongoose.Types.ObjectId().toString();

      const mockChatWithMultipleMessages: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Chat;

      mockingoose(ChatModel).toReturn(mockChatWithMultipleMessages, 'findOneAndUpdate');

      const result = await addMessageToChat(chatId, messageId2);

      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }

      expect(result.messages).toHaveLength(2);
    });
  });

  // ----------------------------------------------------------------------------
  // 5. addParticipantToChat
  // ----------------------------------------------------------------------------
  describe('addParticipantToChat', () => {
    // TODO: Task 3 - Write tests for the addParticipantToChat function
    it('should add a participant if user exists', async () => {
      // Mock user
      mockingoose(UserModel).toReturn(
        { _id: new mongoose.Types.ObjectId(), username: 'testUser' },
        'findOne',
      );

      const mockChat: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Chat;

      mockingoose(ChatModel).toReturn(mockChat, 'findOneAndUpdate');

      const result = await addParticipantToChat(mockChat._id!.toString(), 'newUserId');
      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }
      expect(result._id).toEqual(mockChat._id);
    });

    it('should return error if user not found', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      mockingoose(UserModel).toReturn(null, 'findOne');

      const result = await addParticipantToChat(chatId, userId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('User not found');
      }
    });

    it('should return error if chat not found', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      mockingoose(UserModel).toReturn(
        { _id: new mongoose.Types.ObjectId(), username: 'testUser' },
        'findOne',
      );
      mockingoose(ChatModel).toReturn(null, 'findOneAndUpdate');

      const result = await addParticipantToChat(chatId, userId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Chat not found or failed to update');
      }
    });

    it('should return error if database error occurs during user lookup', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      mockingoose(UserModel).toReturn(new Error('Database error'), 'findOne');

      const result = await addParticipantToChat(chatId, userId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when adding participant to chat');
      }
    });
  });

  describe('getChatsByParticipants', () => {
    it('should retrieve chats by participants', async () => {
      const mockChats: Chat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user2'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user3'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockingoose(ChatModel).toReturn([mockChats[0]], 'find');

      const result = await getChatsByParticipants(['user1', 'user2']);
      expect(result).toHaveLength(1);
      expect(result).toEqual([mockChats[0]]);
    });

    it('should retrieve chats by participants where the provided list is a subset', async () => {
      const mockChats: Chat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user2'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user3'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user2', 'user3'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockingoose(ChatModel).toReturn([mockChats[0], mockChats[1]], 'find');

      const result = await getChatsByParticipants(['user1']);
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockChats[0], mockChats[1]]);
    });

    it('should return an empty array if no chats are found', async () => {
      mockingoose(ChatModel).toReturn([], 'find');

      const result = await getChatsByParticipants(['user1']);
      expect(result).toHaveLength(0);
    });

    it('should return an empty array if a database error occurs', async () => {
      mockingoose(ChatModel).toReturn(new Error('database error'), 'find');

      const result = await getChatsByParticipants(['user1']);
      expect(result).toHaveLength(0);
    });
  });

  describe('getChat', () => {
    it('should retrieve a chat by ID successfully', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const mockChat: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockingoose(ChatModel).toReturn(mockChat, 'findOne');

      const result = await getChat(chatId);

      if ('error' in result) {
        throw new Error('Expected a Chat, got an error');
      }

      expect(result.participants).toEqual(['user1', 'user2']);
      expect(result.messages).toEqual([]);
    });

    it('should return error if chat not found', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      mockingoose(ChatModel).toReturn(null, 'findOne');

      const result = await getChat(chatId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Chat not found');
      }
    });

    it('should return error if database error occurs', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      mockingoose(ChatModel).toReturn(new Error('Database error'), 'findOne');

      const result = await getChat(chatId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when retrieving chat');
      }
    });
  });
});
