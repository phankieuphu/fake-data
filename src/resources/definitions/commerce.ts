import type { ResourceDefinition } from '../resource.types.js';
import { address, money, timestamps } from './helpers.js';

const topic = 'e-commerce';

const CATEGORIES = [
  'Electronics',
  'Computers',
  'Smartphones',
  'Home & Kitchen',
  'Furniture',
  'Clothing',
  'Shoes',
  'Jewelry',
  'Beauty',
  'Health',
  'Sports & Outdoors',
  'Toys & Games',
  'Books',
  'Grocery',
  'Automotive',
  'Pet Supplies',
  'Garden',
  'Office Supplies',
  'Music',
  'Baby',
];

export const commerceResources: ResourceDefinition[] = [
  {
    name: 'categories',
    topic,
    description: 'Product categories',
    total: CATEGORIES.length,
    generate: ({ faker, id }) => {
      const name = CATEGORIES[id - 1];
      return {
        name,
        slug: name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '-'),
        description: faker.commerce.productDescription(),
        image: `https://picsum.photos/seed/category-${id}/400/300`,
      };
    },
  },
  {
    name: 'products',
    topic,
    description: 'Products with price, stock, rating and images',
    total: 1000,
    generate: ({ faker, id, ref }) => {
      const price = money(faker, 5, 2000);
      const discountPercentage = faker.datatype.boolean(0.3)
        ? faker.number.int({ min: 5, max: 50 })
        : 0;
      const categoryId = ref('categories');
      return {
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId,
        category: CATEGORIES[categoryId - 1],
        brand: faker.company.name(),
        sku: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
        barcode: faker.commerce.upc(),
        price,
        discountPercentage,
        finalPrice: Number((price * (1 - discountPercentage / 100)).toFixed(2)),
        currency: 'USD',
        stock: faker.number.int({ max: 500 }),
        rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
        material: faker.commerce.productMaterial(),
        color: faker.color.human(),
        weightKg: faker.number.float({ min: 0.1, max: 30, fractionDigits: 2 }),
        thumbnail: `https://picsum.photos/seed/product-${id}/300/300`,
        images: [1, 2, 3].map(
          (n) => `https://picsum.photos/seed/product-${id}-${n}/800/800`,
        ),
        ...timestamps(faker),
      };
    },
  },
  {
    name: 'reviews',
    topic,
    description: 'Product reviews, 5 per product',
    parent: { resource: 'products', perParent: 5, key: 'productId' },
    generate: ({ faker, ref }) => ({
      userId: ref('users'),
      reviewerName: faker.person.fullName(),
      rating: faker.helpers.weightedArrayElement([
        { value: 5, weight: 40 },
        { value: 4, weight: 30 },
        { value: 3, weight: 15 },
        { value: 2, weight: 8 },
        { value: 1, weight: 7 },
      ]),
      title: faker.lorem.sentence({ min: 2, max: 6 }).replace(/\.$/, ''),
      comment: faker.lorem.sentences({ min: 1, max: 4 }),
      verifiedPurchase: faker.datatype.boolean(0.8),
      helpfulCount: faker.number.int({ max: 200 }),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    }),
  },
  {
    name: 'carts',
    topic,
    description: 'Shopping carts with line items referencing real products',
    total: 500,
    generate: ({ faker, ref, lookup }) => {
      const items = faker.helpers
        .uniqueArray(
          () => ref('products'),
          faker.number.int({ min: 1, max: 5 }),
        )
        .map((productId) => {
          const product = lookup('products', productId);
          const quantity = faker.number.int({ min: 1, max: 4 });
          const price = product.finalPrice as number;
          return {
            productId,
            title: product.title,
            thumbnail: product.thumbnail,
            price,
            quantity,
            total: Number((price * quantity).toFixed(2)),
          };
        });
      const total = Number(
        items.reduce((sum, item) => sum + item.total, 0).toFixed(2),
      );
      return {
        userId: ref('users'),
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        total,
        currency: 'USD',
        updatedAt: faker.date.recent({ days: 7 }).toISOString(),
      };
    },
  },
  {
    name: 'orders',
    topic,
    description: 'Orders with status, payment and shipping, 3 per user',
    parent: { resource: 'users', perParent: 3, key: 'userId' },
    generate: ({ faker, ref, lookup }) => {
      const items = Array.from(
        { length: faker.number.int({ min: 1, max: 4 }) },
        () => {
          const productId = ref('products');
          const product = lookup('products', productId);
          const quantity = faker.number.int({ min: 1, max: 3 });
          return {
            productId,
            title: product.title,
            price: product.finalPrice as number,
            quantity,
          };
        },
      );
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const shipping = subtotal > 100 ? 0 : 9.99;
      const tax = subtotal * 0.08;
      const orderedAt = faker.date.past({ years: 1 });
      return {
        orderNumber: `ORD-${faker.string.numeric(8)}`,
        status: faker.helpers.weightedArrayElement([
          { value: 'pending', weight: 10 },
          { value: 'processing', weight: 15 },
          { value: 'shipped', weight: 20 },
          { value: 'delivered', weight: 45 },
          { value: 'cancelled', weight: 7 },
          { value: 'refunded', weight: 3 },
        ]),
        items,
        subtotal: Number(subtotal.toFixed(2)),
        shipping,
        tax: Number(tax.toFixed(2)),
        total: Number((subtotal + shipping + tax).toFixed(2)),
        currency: 'USD',
        paymentMethod: faker.helpers.arrayElement([
          'card',
          'paypal',
          'apple_pay',
          'google_pay',
          'bank_transfer',
          'cod',
        ]),
        shippingAddress: address(faker),
        trackingNumber: faker.string.alphanumeric({
          length: 12,
          casing: 'upper',
        }),
        orderedAt: orderedAt.toISOString(),
      };
    },
  },
  {
    name: 'coupons',
    topic,
    description: 'Discount coupons',
    total: 100,
    generate: ({ faker }) => {
      const type = faker.helpers.arrayElement(['percentage', 'fixed']);
      const validFrom = faker.date.past({ years: 1 });
      return {
        code: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
        type,
        value:
          type === 'percentage'
            ? faker.number.int({ min: 5, max: 50 })
            : money(faker, 5, 50),
        minOrderAmount: faker.helpers.arrayElement([0, 25, 50, 100]),
        usageLimit: faker.number.int({ min: 50, max: 5000 }),
        used: faker.number.int({ max: 50 }),
        validFrom: validFrom.toISOString(),
        validTo: faker.date
          .future({ years: 1, refDate: validFrom })
          .toISOString(),
        active: faker.datatype.boolean(0.7),
      };
    },
  },
  {
    name: 'stores',
    topic,
    description: 'Physical store locations with opening hours',
    total: 200,
    generate: ({ faker }) => ({
      name: `${faker.company.name()} ${faker.helpers.arrayElement(['Store', 'Outlet', 'Market', 'Shop'])}`,
      phone: faker.phone.number({ style: 'international' }),
      email: faker.internet.email().toLowerCase(),
      address: address(faker),
      openingHours: {
        weekdays: '08:00-21:00',
        saturday: '09:00-20:00',
        sunday: faker.datatype.boolean(0.6) ? '10:00-18:00' : 'closed',
      },
      rating: faker.number.float({ min: 2.5, max: 5, fractionDigits: 1 }),
    }),
  },
];
