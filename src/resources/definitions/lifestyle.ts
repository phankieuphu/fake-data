import type { ResourceDefinition } from '../resource.types.js';
import { address, isoDate, money } from './helpers.js';

const GENRES = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Sci-Fi',
  'Romance',
  'Thriller',
  'Animation',
  'Documentary',
  'Fantasy',
  'Adventure',
  'Crime',
];

export const entertainmentResources: ResourceDefinition[] = [
  {
    name: 'movies',
    topic: 'entertainment',
    description: 'Movies with genres, cast, rating and poster',
    total: 500,
    generate: ({ faker, id }) => ({
      title: faker.book.title(),
      tagline: faker.company.catchPhrase(),
      overview: faker.lorem.paragraph(),
      genres: faker.helpers.arrayElements(GENRES, { min: 1, max: 3 }),
      director: faker.person.fullName(),
      cast: Array.from({ length: 4 }, () => faker.person.fullName()),
      releaseDate: isoDate(
        faker.date.between({ from: '1970-01-01', to: '2025-12-31' }),
      ),
      runtimeMinutes: faker.number.int({ min: 80, max: 190 }),
      language: faker.helpers.arrayElement([
        'en',
        'fr',
        'es',
        'ja',
        'ko',
        'hi',
        'de',
        'it',
        'zh',
      ]),
      rating: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
      voteCount: faker.number.int({ min: 10, max: 500_000 }),
      budget: faker.number.int({ min: 1, max: 300 }) * 1_000_000,
      poster: `https://picsum.photos/seed/movie-${id}/500/750`,
    }),
  },
  {
    name: 'books',
    topic: 'entertainment',
    description: 'Books with author, ISBN, genre and publisher',
    total: 1000,
    generate: ({ faker, id }) => ({
      title: faker.book.title(),
      author: faker.book.author(),
      isbn: faker.commerce.isbn(),
      genre: faker.book.genre(),
      publisher: faker.book.publisher(),
      format: faker.book.format(),
      series: faker.datatype.boolean(0.3) ? faker.book.series() : null,
      pages: faker.number.int({ min: 80, max: 1200 }),
      language: faker.helpers.arrayElement([
        'English',
        'Spanish',
        'French',
        'German',
        'Japanese',
      ]),
      publishedYear: faker.number.int({ min: 1850, max: 2025 }),
      price: money(faker, 4.99, 79.99),
      rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      cover: `https://picsum.photos/seed/book-${id}/400/600`,
    }),
  },
  {
    name: 'songs',
    topic: 'entertainment',
    description: 'Songs with artist, album, genre and duration',
    total: 2000,
    generate: ({ faker, id }) => ({
      title: faker.music.songName(),
      artist: faker.music.artist(),
      album: faker.music.album(),
      genre: faker.music.genre(),
      durationSeconds: faker.number.int({ min: 90, max: 420 }),
      releaseYear: faker.number.int({ min: 1960, max: 2025 }),
      plays: faker.number.int({ max: 500_000_000 }),
      explicit: faker.datatype.boolean(0.2),
      coverArt: `https://picsum.photos/seed/song-${id}/300/300`,
    }),
  },
  {
    name: 'games',
    topic: 'entertainment',
    description: 'Video games with platforms, genre and price',
    total: 300,
    generate: ({ faker, id }) => ({
      title: `${faker.word.adjective()} ${faker.word.noun()}`.replace(
        /\b\w/g,
        (c) => c.toUpperCase(),
      ),
      studio: faker.company.name(),
      genre: faker.helpers.arrayElement([
        'RPG',
        'Shooter',
        'Strategy',
        'Puzzle',
        'Platformer',
        'Racing',
        'Sports',
        'Simulation',
        'MOBA',
      ]),
      platforms: faker.helpers.arrayElements(
        [
          'PC',
          'PlayStation 5',
          'Xbox Series X',
          'Nintendo Switch',
          'iOS',
          'Android',
        ],
        { min: 1, max: 4 },
      ),
      releaseDate: isoDate(
        faker.date.between({ from: '2000-01-01', to: '2025-12-31' }),
      ),
      price: faker.helpers.arrayElement([
        0, 9.99, 19.99, 29.99, 49.99, 59.99, 69.99,
      ]),
      rating: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
      multiplayer: faker.datatype.boolean(),
      cover: `https://picsum.photos/seed/game-${id}/460/215`,
    }),
  },
];

export const foodResources: ResourceDefinition[] = [
  {
    name: 'recipes',
    topic: 'food',
    description: 'Recipes with ingredients, steps and nutrition',
    total: 300,
    generate: ({ faker, id }) => ({
      name: faker.food.dish(),
      description: faker.food.description(),
      cuisine: faker.food.ethnicCategory(),
      difficulty: faker.helpers.arrayElement(['easy', 'medium', 'hard']),
      prepTimeMinutes: faker.number.int({ min: 5, max: 60 }),
      cookTimeMinutes: faker.number.int({ min: 0, max: 180 }),
      servings: faker.number.int({ min: 1, max: 8 }),
      ingredients: faker.helpers.uniqueArray(
        () => faker.food.ingredient(),
        faker.number.int({ min: 4, max: 10 }),
      ),
      instructions: Array.from(
        { length: faker.number.int({ min: 3, max: 7 }) },
        () => faker.lorem.sentence(),
      ),
      caloriesPerServing: faker.number.int({ min: 120, max: 1200 }),
      tags: faker.helpers.arrayElements(
        [
          'vegetarian',
          'vegan',
          'gluten-free',
          'quick',
          'spicy',
          'healthy',
          'dessert',
          'breakfast',
        ],
        { min: 0, max: 3 },
      ),
      rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
      image: `https://picsum.photos/seed/recipe-${id}/600/400`,
    }),
  },
  {
    name: 'restaurants',
    topic: 'food',
    description: 'Restaurants with cuisine, price level and location',
    total: 300,
    generate: ({ faker, id }) => ({
      name: `${faker.person.lastName()}'s ${faker.helpers.arrayElement(['Kitchen', 'Bistro', 'Grill', 'Diner', 'Eatery', 'House'])}`,
      cuisine: faker.food.ethnicCategory(),
      priceLevel: faker.helpers.arrayElement(['$', '$$', '$$$', '$$$$']),
      rating: faker.number.float({ min: 2, max: 5, fractionDigits: 1 }),
      reviewCount: faker.number.int({ max: 5000 }),
      phone: faker.phone.number({ style: 'international' }),
      address: address(faker),
      delivery: faker.datatype.boolean(0.6),
      signatureDish: faker.food.dish(),
      image: `https://picsum.photos/seed/restaurant-${id}/600/400`,
    }),
  },
];

export const travelResources: ResourceDefinition[] = [
  {
    name: 'flights',
    topic: 'travel',
    description: 'Flights with airline, airports, schedule and status',
    total: 2000,
    generate: ({ faker }) => {
      const airline = faker.airline.airline();
      const departure = faker.date.soon({ days: 30 });
      const durationMinutes = faker.number.int({ min: 45, max: 900 });
      return {
        flightNumber: `${airline.iataCode}${faker.airline.flightNumber({ length: { min: 2, max: 4 } })}`,
        airline: airline.name,
        aircraftType: faker.airline.aircraftType(),
        origin: faker.airline.airport(),
        destination: faker.airline.airport(),
        departureTime: departure.toISOString(),
        arrivalTime: new Date(
          departure.getTime() + durationMinutes * 60_000,
        ).toISOString(),
        durationMinutes,
        status: faker.helpers.weightedArrayElement([
          { value: 'scheduled', weight: 60 },
          { value: 'boarding', weight: 5 },
          { value: 'delayed', weight: 15 },
          { value: 'departed', weight: 10 },
          { value: 'landed', weight: 8 },
          { value: 'cancelled', weight: 2 },
        ]),
        price: money(faker, 49, 2500),
        currency: 'USD',
        seatsAvailable: faker.number.int({ max: 180 }),
      };
    },
  },
  {
    name: 'hotels',
    topic: 'travel',
    description: 'Hotels with stars, amenities and nightly price',
    total: 300,
    generate: ({ faker, id }) => ({
      name: `${faker.location.city()} ${faker.helpers.arrayElement(['Grand Hotel', 'Resort', 'Inn', 'Suites', 'Plaza', 'Lodge'])}`,
      stars: faker.number.int({ min: 1, max: 5 }),
      address: address(faker),
      pricePerNight: money(faker, 30, 900),
      currency: 'USD',
      amenities: faker.helpers.arrayElements(
        [
          'wifi',
          'pool',
          'spa',
          'gym',
          'parking',
          'breakfast',
          'airport-shuttle',
          'pet-friendly',
          'bar',
        ],
        { min: 2, max: 6 },
      ),
      rating: faker.number.float({ min: 5, max: 10, fractionDigits: 1 }),
      reviewCount: faker.number.int({ max: 8000 }),
      roomsAvailable: faker.number.int({ max: 120 }),
      images: [1, 2, 3].map(
        (n) => `https://picsum.photos/seed/hotel-${id}-${n}/800/533`,
      ),
    }),
  },
  {
    name: 'bookings',
    topic: 'travel',
    description: 'Hotel bookings referencing users and hotels',
    total: 2000,
    generate: ({ faker, ref }) => {
      const checkIn = faker.date.soon({ days: 120 });
      const nights = faker.number.int({ min: 1, max: 14 });
      return {
        confirmationCode: faker.airline.recordLocator(),
        userId: ref('users'),
        hotelId: ref('hotels'),
        checkIn: isoDate(checkIn),
        checkOut: isoDate(new Date(checkIn.getTime() + nights * 86_400_000)),
        nights,
        guests: faker.number.int({ min: 1, max: 4 }),
        totalPrice: money(faker, 60, 8000),
        status: faker.helpers.arrayElement([
          'confirmed',
          'confirmed',
          'pending',
          'cancelled',
        ]),
      };
    },
  },
  {
    name: 'addresses',
    topic: 'travel',
    description: 'Postal addresses with coordinates and time zone',
    total: 2000,
    generate: ({ faker }) => ({
      ...address(faker),
      buildingNumber: faker.location.buildingNumber(),
      secondaryAddress: faker.datatype.boolean(0.3)
        ? faker.location.secondaryAddress()
        : null,
      countryCode: faker.location.countryCode(),
      timeZone: faker.location.timeZone(),
    }),
  },
  {
    name: 'vehicles',
    topic: 'automotive',
    description:
      'Vehicles with VIN, plate, model and owner (mirrors the vehicle SQL dataset)',
    total: 5000,
    generate: ({ faker, ref }) => {
      const status = faker.helpers.weightedArrayElement([
        { value: 'ACTIVE', weight: 75 },
        { value: 'SOLD', weight: 20 },
        { value: 'SCRAPPED', weight: 5 },
      ]);
      return {
        vin: faker.vehicle.vin(),
        licensePlate: faker.datatype.boolean(0.9) ? faker.vehicle.vrm() : null,
        make: faker.vehicle.manufacturer(),
        model: faker.vehicle.model(),
        year: faker.number.int({ min: 1990, max: 2025 }),
        type: faker.vehicle.type(),
        fuel: faker.vehicle.fuel(),
        color: faker.vehicle.color(),
        mileageKm: faker.number.int({ max: 300_000 }),
        ownerId: ref('customers'),
        warrantyEndDate:
          status === 'SCRAPPED' || faker.datatype.boolean(0.2)
            ? null
            : isoDate(faker.date.future({ years: 5 })),
        status,
      };
    },
  },
];
