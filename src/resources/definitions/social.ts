import type { ResourceDefinition } from '../resource.types.js';
import { address, isoDate, timestamps } from './helpers.js';

const topic = 'social';

export const socialResources: ResourceDefinition[] = [
  {
    name: 'users',
    topic,
    description: 'User profiles with address, company and avatar',
    total: 1000,
    generate: ({ faker }) => {
      const sex = faker.person.sexType();
      const firstName = faker.person.firstName(sex);
      const lastName = faker.person.lastName(sex);
      return {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        username: faker.internet.username({ firstName, lastName }),
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: faker.phone.number({ style: 'international' }),
        gender: sex,
        birthDate: isoDate(
          faker.date.birthdate({ mode: 'age', min: 18, max: 80 }),
        ),
        avatar: faker.image.avatar(),
        bio: faker.person.bio(),
        website: faker.internet.url(),
        role: faker.helpers.weightedArrayElement([
          { value: 'user', weight: 85 },
          { value: 'moderator', weight: 10 },
          { value: 'admin', weight: 5 },
        ]),
        address: address(faker),
        company: {
          name: faker.company.name(),
          title: faker.person.jobTitle(),
          catchPhrase: faker.company.catchPhrase(),
        },
        ...timestamps(faker),
      };
    },
  },
  {
    name: 'posts',
    topic,
    description: 'Blog / social posts, 10 per user',
    parent: { resource: 'users', perParent: 10, key: 'userId' },
    generate: ({ faker }) => ({
      title: faker.lorem.sentence({ min: 4, max: 10 }).replace(/\.$/, ''),
      body: faker.lorem.paragraphs({ min: 2, max: 4 }),
      tags: faker.helpers.uniqueArray(
        () => faker.word.noun(),
        faker.number.int({ min: 1, max: 4 }),
      ),
      reactions: {
        likes: faker.number.int({ max: 5000 }),
        dislikes: faker.number.int({ max: 300 }),
      },
      views: faker.number.int({ max: 100_000 }),
      published: faker.datatype.boolean(0.9),
      ...timestamps(faker),
    }),
  },
  {
    name: 'comments',
    topic,
    description: 'Comments on posts, 5 per post',
    parent: { resource: 'posts', perParent: 5, key: 'postId' },
    generate: ({ faker, ref }) => {
      const userId = ref('users');
      return {
        userId,
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        body: faker.lorem.sentences({ min: 1, max: 3 }),
        likes: faker.number.int({ max: 500 }),
        createdAt: faker.date.past({ years: 1 }).toISOString(),
      };
    },
  },
  {
    name: 'todos',
    topic,
    description: 'Todo items, 20 per user',
    parent: { resource: 'users', perParent: 20, key: 'userId' },
    generate: ({ faker }) => ({
      title: faker.hacker.phrase().replace(/\.$/, ''),
      completed: faker.datatype.boolean(0.45),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
      dueDate: isoDate(faker.date.soon({ days: 60 })),
    }),
  },
  {
    name: 'albums',
    topic,
    description: 'Photo albums, 5 per user',
    parent: { resource: 'users', perParent: 5, key: 'userId' },
    generate: ({ faker }) => ({
      title: faker.word.words({ count: { min: 2, max: 5 } }),
      createdAt: faker.date.past({ years: 3 }).toISOString(),
    }),
  },
  {
    name: 'photos',
    topic,
    description: 'Photos with full-size and thumbnail URLs, 20 per album',
    parent: { resource: 'albums', perParent: 20, key: 'albumId' },
    generate: ({ faker, id }) => ({
      title: faker.lorem.sentence({ min: 3, max: 7 }).replace(/\.$/, ''),
      url: `https://picsum.photos/seed/photo-${id}/800/600`,
      thumbnailUrl: `https://picsum.photos/seed/photo-${id}/150/150`,
      width: 800,
      height: 600,
    }),
  },
  {
    name: 'notifications',
    topic,
    description: 'In-app notifications, 10 per user',
    parent: { resource: 'users', perParent: 10, key: 'userId' },
    generate: ({ faker }) => {
      const type = faker.helpers.arrayElement([
        'like',
        'comment',
        'follow',
        'mention',
        'system',
      ]);
      const actor = faker.person.fullName();
      const messages: Record<string, string> = {
        like: `${actor} liked your post`,
        comment: `${actor} commented on your post`,
        follow: `${actor} started following you`,
        mention: `${actor} mentioned you in a comment`,
        system: faker.hacker.phrase(),
      };
      return {
        type,
        message: messages[type],
        read: faker.datatype.boolean(0.6),
        createdAt: faker.date.recent({ days: 30 }).toISOString(),
      };
    },
  },
  {
    name: 'messages',
    topic,
    description: 'Chat messages between users',
    total: 5000,
    generate: ({ faker, ref }) => ({
      conversationId: faker.number.int({ min: 1, max: 500 }),
      senderId: ref('users'),
      receiverId: ref('users'),
      text: faker.lorem.sentences({ min: 1, max: 2 }),
      emoji: faker.datatype.boolean(0.2) ? faker.internet.emoji() : null,
      seen: faker.datatype.boolean(0.7),
      sentAt: faker.date.recent({ days: 14 }).toISOString(),
    }),
  },
];
