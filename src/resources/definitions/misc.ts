import type { ResourceDefinition } from '../resource.types.js';
import { address, isoDate, money } from './helpers.js';

export const educationResources: ResourceDefinition[] = [
  {
    name: 'courses',
    topic: 'education',
    description: 'Online courses with instructor, level and price',
    total: 200,
    generate: ({ faker, id }) => {
      const subject = faker.helpers.arrayElement([
        'JavaScript',
        'Python',
        'Data Science',
        'UX Design',
        'Marketing',
        'Photography',
        'Finance',
        'Machine Learning',
        'Spanish',
        'Cloud Computing',
      ]);
      return {
        title: `${faker.helpers.arrayElement(['Mastering', 'Intro to', 'Complete', 'Practical', 'Advanced'])} ${subject}`,
        subject,
        instructor: faker.person.fullName(),
        level: faker.helpers.arrayElement([
          'beginner',
          'intermediate',
          'advanced',
        ]),
        lessons: faker.number.int({ min: 8, max: 120 }),
        durationHours: faker.number.int({ min: 2, max: 60 }),
        price: faker.helpers.arrayElement([0, 19.99, 49.99, 99.99, 199.99]),
        enrolled: faker.number.int({ max: 100_000 }),
        rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
        thumbnail: `https://picsum.photos/seed/course-${id}/480/270`,
      };
    },
  },
  {
    name: 'students',
    topic: 'education',
    description: 'Students with grade, GPA and enrolled courses',
    total: 1000,
    generate: ({ faker, ref }) => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return {
        studentNumber: faker.string.numeric(8),
        firstName,
        lastName,
        email: faker.internet
          .email({ firstName, lastName, provider: 'school.example' })
          .toLowerCase(),
        birthDate: isoDate(
          faker.date.birthdate({ mode: 'age', min: 17, max: 30 }),
        ),
        major: faker.helpers.arrayElement([
          'Computer Science',
          'Biology',
          'Economics',
          'History',
          'Mathematics',
          'Art',
          'Physics',
          'Psychology',
        ]),
        year: faker.number.int({ min: 1, max: 4 }),
        gpa: faker.number.float({ min: 2, max: 4, fractionDigits: 2 }),
        courseIds: faker.helpers.uniqueArray(
          () => ref('courses'),
          faker.number.int({ min: 1, max: 5 }),
        ),
        avatar: faker.image.avatar(),
      };
    },
  },
];

export const healthResources: ResourceDefinition[] = [
  {
    name: 'patients',
    topic: 'healthcare',
    description: 'Patients with blood type, allergies and insurance',
    total: 1000,
    generate: ({ faker }) => ({
      medicalRecordNumber: `MRN-${faker.string.numeric(8)}`,
      fullName: faker.person.fullName(),
      gender: faker.person.sex(),
      birthDate: isoDate(faker.date.birthdate()),
      phone: faker.phone.number({ style: 'international' }),
      bloodType: faker.helpers.arrayElement([
        'A+',
        'A-',
        'B+',
        'B-',
        'AB+',
        'AB-',
        'O+',
        'O-',
      ]),
      heightCm: faker.number.int({ min: 145, max: 205 }),
      weightKg: faker.number.int({ min: 40, max: 140 }),
      allergies: faker.helpers.arrayElements(
        ['penicillin', 'peanuts', 'latex', 'pollen', 'shellfish', 'dust'],
        { min: 0, max: 2 },
      ),
      insuranceProvider: faker.company.name(),
      address: address(faker),
    }),
  },
  {
    name: 'appointments',
    topic: 'healthcare',
    description: 'Doctor appointments, 3 per patient',
    parent: { resource: 'patients', perParent: 3, key: 'patientId' },
    generate: ({ faker }) => ({
      doctor: `Dr. ${faker.person.fullName()}`,
      specialty: faker.helpers.arrayElement([
        'General Practice',
        'Cardiology',
        'Dermatology',
        'Pediatrics',
        'Orthopedics',
        'Neurology',
        'Dentistry',
      ]),
      scheduledAt: faker.date.soon({ days: 60 }).toISOString(),
      durationMinutes: faker.helpers.arrayElement([15, 30, 45, 60]),
      reason: faker.lorem.sentence(),
      status: faker.helpers.arrayElement([
        'scheduled',
        'confirmed',
        'completed',
        'cancelled',
        'no-show',
      ]),
      fee: money(faker, 20, 400),
    }),
  },
];

export const techResources: ResourceDefinition[] = [
  {
    name: 'repositories',
    topic: 'tech',
    description: 'Git repositories with language, stars and last commit',
    total: 500,
    generate: ({ faker, ref }) => {
      const name = faker.helpers
        .slugify(faker.word.words({ count: { min: 1, max: 3 } }))
        .toLowerCase();
      const owner = faker.internet.username().toLowerCase();
      return {
        name,
        fullName: `${owner}/${name}`,
        ownerId: ref('users'),
        description: faker.hacker.phrase(),
        language: faker.helpers.arrayElement([
          'TypeScript',
          'JavaScript',
          'Python',
          'Go',
          'Rust',
          'Java',
          'C#',
          'Kotlin',
          'Swift',
          'PHP',
        ]),
        stars: faker.number.int({ max: 80_000 }),
        forks: faker.number.int({ max: 10_000 }),
        openIssues: faker.number.int({ max: 500 }),
        license: faker.helpers.arrayElement([
          'MIT',
          'Apache-2.0',
          'GPL-3.0',
          'BSD-3-Clause',
          null,
        ]),
        defaultBranch: faker.helpers.arrayElement([
          'main',
          'master',
          'develop',
        ]),
        latestVersion: faker.system.semver(),
        lastCommit: {
          sha: faker.git.commitSha(),
          message: faker.git.commitMessage(),
          date: faker.date.recent({ days: 90 }).toISOString(),
        },
        private: faker.datatype.boolean(0.2),
      };
    },
  },
  {
    name: 'logs',
    topic: 'tech',
    description:
      'HTTP access / application logs for dashboards and log viewers',
    total: 10_000,
    generate: ({ faker }) => {
      const status = faker.helpers.weightedArrayElement([
        { value: 200, weight: 70 },
        { value: 201, weight: 8 },
        { value: 304, weight: 5 },
        { value: 400, weight: 5 },
        { value: 401, weight: 3 },
        { value: 404, weight: 5 },
        { value: 500, weight: 3 },
        { value: 503, weight: 1 },
      ]);
      return {
        timestamp: faker.date.recent({ days: 7 }).toISOString(),
        level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
        service: faker.helpers.arrayElement([
          'api-gateway',
          'auth-service',
          'order-service',
          'payment-service',
          'user-service',
        ]),
        method: faker.internet.httpMethod(),
        path: `/${faker.helpers.arrayElement(['users', 'orders', 'products', 'auth', 'payments'])}/${faker.number.int({ max: 999 })}`,
        status,
        latencyMs: faker.number.int({
          min: 2,
          max: status >= 500 ? 5000 : 800,
        }),
        ip: faker.internet.ipv4(),
        userAgent: faker.internet.userAgent(),
        traceId: faker.string.hexadecimal({
          length: 32,
          casing: 'lower',
          prefix: '',
        }),
      };
    },
  },
  {
    name: 'devices',
    topic: 'tech',
    description: 'IoT / managed devices with telemetry',
    total: 500,
    generate: ({ faker }) => ({
      serialNumber: faker.string.alphanumeric({ length: 12, casing: 'upper' }),
      name: `${faker.helpers.arrayElement(['sensor', 'camera', 'thermostat', 'gateway', 'tracker'])}-${faker.string.numeric(4)}`,
      model: faker.commerce.productName(),
      firmware: faker.system.semver(),
      macAddress: faker.internet.mac(),
      ipAddress: faker.internet.ipv4(),
      online: faker.datatype.boolean(0.85),
      batteryPercent: faker.number.int({ max: 100 }),
      temperatureC: faker.number.float({
        min: -10,
        max: 45,
        fractionDigits: 1,
      }),
      location: {
        lat: faker.location.latitude(),
        lng: faker.location.longitude(),
      },
      lastSeenAt: faker.date.recent({ days: 2 }).toISOString(),
    }),
  },
];

export const miscResources: ResourceDefinition[] = [
  {
    name: 'quotes',
    topic: 'misc',
    description: 'Inspirational-style quotes with author',
    total: 500,
    generate: ({ faker }) => ({
      quote:
        faker.company.buzzPhrase().replace(/^\w/, (c) => c.toUpperCase()) + '.',
      author: faker.person.fullName(),
      tags: faker.helpers.arrayElements(
        ['life', 'success', 'motivation', 'wisdom', 'business', 'happiness'],
        { min: 1, max: 2 },
      ),
    }),
  },
  {
    name: 'events',
    topic: 'misc',
    description: 'Events / meetups with venue, date and tickets',
    total: 500,
    generate: ({ faker, id }) => {
      const startsAt = faker.date.soon({ days: 180 });
      return {
        title: `${faker.company.buzzNoun().replace(/^\w/, (c) => c.toUpperCase())} ${faker.helpers.arrayElement(['Summit', 'Conference', 'Meetup', 'Festival', 'Workshop', 'Expo'])} ${startsAt.getUTCFullYear()}`,
        category: faker.helpers.arrayElement([
          'tech',
          'music',
          'sports',
          'business',
          'art',
          'food',
        ]),
        description: faker.lorem.paragraph(),
        venue: `${faker.location.city()} ${faker.helpers.arrayElement(['Arena', 'Convention Center', 'Hall', 'Park'])}`,
        address: address(faker),
        startsAt: startsAt.toISOString(),
        endsAt: new Date(
          startsAt.getTime() +
            faker.number.int({ min: 2, max: 72 }) * 3_600_000,
        ).toISOString(),
        ticketPrice: faker.helpers.arrayElement([0, 15, 29, 49, 99, 199]),
        capacity: faker.number.int({ min: 50, max: 20_000 }),
        attendees: faker.number.int({ max: 20_000 }),
        banner: `https://picsum.photos/seed/event-${id}/1200/400`,
      };
    },
  },
  {
    name: 'pets',
    topic: 'misc',
    description: 'Pets with species, breed and owner',
    total: 500,
    generate: ({ faker, id, ref }) => {
      const species = faker.helpers.arrayElement([
        'dog',
        'cat',
        'bird',
        'rabbit',
        'fish',
        'horse',
      ] as const);
      const breeds: Record<string, () => string> = {
        dog: () => faker.animal.dog(),
        cat: () => faker.animal.cat(),
        bird: () => faker.animal.bird(),
        rabbit: () => faker.animal.rabbit(),
        fish: () => faker.animal.fish(),
        horse: () => faker.animal.horse(),
      };
      return {
        name: faker.animal.petName(),
        species,
        breed: breeds[species](),
        ageYears: faker.number.int({ min: 0, max: 18 }),
        ownerId: ref('users'),
        vaccinated: faker.datatype.boolean(0.8),
        adoptable: faker.datatype.boolean(0.3),
        photo: `https://picsum.photos/seed/pet-${id}/400/400`,
      };
    },
  },
  {
    name: 'weather',
    topic: 'misc',
    description: 'Current weather readings for cities',
    total: 500,
    generate: ({ faker }) => {
      const temperatureC = faker.number.float({
        min: -20,
        max: 42,
        fractionDigits: 1,
      });
      return {
        city: faker.location.city(),
        country: faker.location.country(),
        condition: faker.helpers.arrayElement([
          'sunny',
          'cloudy',
          'partly-cloudy',
          'rain',
          'thunderstorm',
          'snow',
          'fog',
          'windy',
        ]),
        temperatureC,
        temperatureF: Number((temperatureC * 1.8 + 32).toFixed(1)),
        humidity: faker.number.int({ min: 10, max: 100 }),
        windKph: faker.number.float({ min: 0, max: 90, fractionDigits: 1 }),
        uvIndex: faker.number.int({ max: 11 }),
        observedAt: faker.date.recent({ days: 1 }).toISOString(),
      };
    },
  },
];
