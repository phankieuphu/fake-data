import type { Faker } from '@faker-js/faker';

export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const money = (faker: Faker, min: number, max: number): number =>
  faker.number.float({ min, max, fractionDigits: 2 });

/** createdAt in the past two years and an updatedAt after it. */
export function timestamps(faker: Faker) {
  const createdAt = faker.date.past({ years: 2 });
  const updatedAt = faker.date.between({
    from: createdAt,
    to: faker.defaultRefDate(),
  });
  return {
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

export function address(faker: Faker) {
  return {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    country: faker.location.country(),
    coordinates: {
      lat: faker.location.latitude(),
      lng: faker.location.longitude(),
    },
  };
}
