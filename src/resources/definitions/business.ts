import type { ResourceDefinition } from '../resource.types.js';
import { address, isoDate, money, timestamps } from './helpers.js';

export const businessResources: ResourceDefinition[] = [
  {
    name: 'companies',
    topic: 'business',
    description: 'Companies with industry, size and revenue',
    total: 200,
    generate: ({ faker, id }) => {
      const name = faker.company.name();
      return {
        name,
        industry: faker.helpers.arrayElement([
          'Technology',
          'Finance',
          'Healthcare',
          'Retail',
          'Manufacturing',
          'Education',
          'Media',
          'Logistics',
          'Energy',
          'Real Estate',
          'Hospitality',
        ]),
        catchPhrase: faker.company.catchPhrase(),
        description: faker.company.buzzPhrase(),
        website: `https://www.${faker.internet.domainWord()}.${faker.internet.domainSuffix()}`,
        email: faker.internet
          .email({ provider: `${faker.internet.domainWord()}.com` })
          .toLowerCase(),
        phone: faker.phone.number({ style: 'international' }),
        logo: `https://picsum.photos/seed/company-${id}/200/200`,
        foundedYear: faker.number.int({ min: 1950, max: 2024 }),
        employeeCount: faker.number.int({ min: 10, max: 50_000 }),
        annualRevenue: faker.number.int({ min: 100_000, max: 5_000_000_000 }),
        headquarters: address(faker),
      };
    },
  },
  {
    name: 'employees',
    topic: 'business',
    description:
      'Employees with department, salary and manager, 25 per company',
    parent: { resource: 'companies', perParent: 25, key: 'companyId' },
    generate: ({ faker, id }) => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const indexInCompany = (id - 1) % 25;
      return {
        employeeCode: `EMP-${String(id).padStart(6, '0')}`,
        firstName,
        lastName,
        email: faker.internet
          .email({ firstName, lastName, provider: 'company.example' })
          .toLowerCase(),
        phone: faker.phone.number({ style: 'international' }),
        avatar: faker.image.avatar(),
        department: faker.commerce.department(),
        jobTitle: faker.person.jobTitle(),
        level: faker.helpers.arrayElement([
          'Intern',
          'Junior',
          'Mid',
          'Senior',
          'Lead',
          'Principal',
          'Manager',
          'Director',
        ]),
        // The first employee of each company is the top manager.
        managerId: indexInCompany === 0 ? null : id - indexInCompany,
        salary: faker.number.int({ min: 30_000, max: 250_000 }),
        currency: 'USD',
        employmentType: faker.helpers.weightedArrayElement([
          { value: 'full-time', weight: 80 },
          { value: 'part-time', weight: 10 },
          { value: 'contract', weight: 10 },
        ]),
        hireDate: isoDate(faker.date.past({ years: 10 })),
        remote: faker.datatype.boolean(0.35),
        skills: faker.helpers.arrayElements(
          [
            'TypeScript',
            'Java',
            'Python',
            'Go',
            'SQL',
            'React',
            'Leadership',
            'Sales',
            'Design',
            'Excel',
            'Communication',
            'Kubernetes',
          ],
          { min: 2, max: 5 },
        ),
      };
    },
  },
  {
    name: 'jobs',
    topic: 'business',
    description: 'Job postings with salary range and requirements',
    total: 500,
    generate: ({ faker, ref }) => {
      const minSalary = faker.number.int({ min: 30, max: 150 }) * 1000;
      return {
        title: faker.person.jobTitle(),
        companyId: ref('companies'),
        location: `${faker.location.city()}, ${faker.location.country()}`,
        workplace: faker.helpers.arrayElement(['on-site', 'remote', 'hybrid']),
        employmentType: faker.helpers.arrayElement([
          'full-time',
          'part-time',
          'contract',
          'internship',
        ]),
        seniority: faker.helpers.arrayElement([
          'entry',
          'mid',
          'senior',
          'lead',
        ]),
        salaryRange: {
          min: minSalary,
          max: minSalary + faker.number.int({ min: 10, max: 80 }) * 1000,
          currency: 'USD',
        },
        description: faker.lorem.paragraphs(2),
        requirements: Array.from(
          { length: faker.number.int({ min: 3, max: 6 }) },
          () => faker.hacker.phrase().replace(/\.$/, ''),
        ),
        applicants: faker.number.int({ max: 400 }),
        postedAt: faker.date.recent({ days: 60 }).toISOString(),
        status: faker.helpers.arrayElement(['open', 'open', 'open', 'closed']),
      };
    },
  },
  {
    name: 'customers',
    topic: 'business',
    description: 'CRM customers with status (mirrors the customer SQL dataset)',
    total: 1000,
    generate: ({ faker }) => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return {
        name: `${firstName} ${faker.person.middleName()} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: faker.phone.number({ style: 'international' }),
        birthday: isoDate(faker.date.birthdate()),
        status: faker.helpers.weightedArrayElement([
          { value: 'ACTIVE', weight: 90 },
          { value: 'INACTIVE', weight: 8 },
          { value: 'BANNED', weight: 2 },
        ]),
        segment: faker.helpers.arrayElement([
          'consumer',
          'small-business',
          'enterprise',
        ]),
        lifetimeValue: money(faker, 0, 25_000),
        address: address(faker),
        ...timestamps(faker),
      };
    },
  },
  {
    name: 'invoices',
    topic: 'business',
    description: 'Invoices with line items, 3 per customer',
    parent: { resource: 'customers', perParent: 3, key: 'customerId' },
    generate: ({ faker, id }) => {
      const lines = Array.from(
        { length: faker.number.int({ min: 1, max: 5 }) },
        () => {
          const quantity = faker.number.int({ min: 1, max: 10 });
          const unitPrice = money(faker, 10, 500);
          return {
            description: faker.commerce.productName(),
            quantity,
            unitPrice,
            amount: Number((quantity * unitPrice).toFixed(2)),
          };
        },
      );
      const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
      const tax = subtotal * 0.1;
      const issuedAt = faker.date.past({ years: 1 });
      return {
        invoiceNumber: `INV-${new Date(issuedAt).getUTCFullYear()}-${String(id).padStart(5, '0')}`,
        status: faker.helpers.arrayElement([
          'draft',
          'sent',
          'paid',
          'paid',
          'overdue',
          'void',
        ]),
        lines,
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        total: Number((subtotal + tax).toFixed(2)),
        currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP']),
        issuedAt: isoDate(issuedAt),
        dueAt: isoDate(faker.date.soon({ days: 30, refDate: issuedAt })),
      };
    },
  },
];

export const financeResources: ResourceDefinition[] = [
  {
    name: 'bank-accounts',
    topic: 'finance',
    description:
      'Bank accounts with IBAN, BIC and balance (fake, test-only values)',
    total: 1000,
    generate: ({ faker, ref }) => ({
      userId: ref('users'),
      accountName: faker.finance.accountName(),
      accountNumber: faker.finance.accountNumber(10),
      iban: faker.finance.iban(),
      bic: faker.finance.bic(),
      currency: faker.finance.currencyCode(),
      balance: money(faker, -500, 100_000),
      type: faker.helpers.arrayElement([
        'checking',
        'savings',
        'credit',
        'loan',
      ]),
      status: faker.helpers.weightedArrayElement([
        { value: 'active', weight: 90 },
        { value: 'frozen', weight: 5 },
        { value: 'closed', weight: 5 },
      ]),
      openedAt: isoDate(faker.date.past({ years: 15 })),
    }),
  },
  {
    name: 'transactions',
    topic: 'finance',
    description: 'Bank / card transactions, 20 per bank account',
    parent: { resource: 'bank-accounts', perParent: 20, key: 'accountId' },
    generate: ({ faker }) => {
      const type = faker.helpers.arrayElement([
        'deposit',
        'withdrawal',
        'payment',
        'transfer',
        'refund',
      ]);
      const amount = money(faker, 1, 5000);
      return {
        reference: faker.string.alphanumeric({ length: 16, casing: 'upper' }),
        type,
        amount: ['withdrawal', 'payment', 'transfer'].includes(type)
          ? -amount
          : amount,
        currency: faker.finance.currencyCode(),
        merchant: type === 'payment' ? faker.company.name() : null,
        category: faker.helpers.arrayElement([
          'groceries',
          'rent',
          'salary',
          'utilities',
          'travel',
          'dining',
          'shopping',
          'health',
          'entertainment',
        ]),
        description: faker.finance.transactionDescription(),
        status: faker.helpers.weightedArrayElement([
          { value: 'completed', weight: 88 },
          { value: 'pending', weight: 8 },
          { value: 'failed', weight: 4 },
        ]),
        createdAt: faker.date.past({ years: 1 }).toISOString(),
      };
    },
  },
  {
    name: 'credit-cards',
    topic: 'finance',
    description:
      'Fake credit cards for UI / payment-form testing (not real numbers)',
    total: 500,
    generate: ({ faker, ref }) => {
      const issuer = faker.helpers.arrayElement([
        'visa',
        'mastercard',
        'amex',
        'discover',
      ]);
      const expiry = faker.date.future({ years: 5 });
      return {
        userId: ref('users'),
        holderName: faker.person.fullName().toUpperCase(),
        issuer,
        number: faker.finance.creditCardNumber(issuer),
        cvv: faker.finance.creditCardCVV(),
        expiryMonth: expiry.getUTCMonth() + 1,
        expiryYear: expiry.getUTCFullYear(),
        limit: faker.helpers.arrayElement([1000, 2500, 5000, 10_000, 25_000]),
      };
    },
  },
  {
    name: 'stocks',
    topic: 'finance',
    description: 'Stock tickers with price, change and market cap',
    total: 300,
    generate: ({ faker }) => {
      const price = money(faker, 1, 1500);
      const changePercent = faker.number.float({
        min: -10,
        max: 10,
        fractionDigits: 2,
      });
      return {
        symbol: faker.string.alpha({
          length: { min: 3, max: 4 },
          casing: 'upper',
        }),
        name: faker.company.name(),
        exchange: faker.helpers.arrayElement([
          'NASDAQ',
          'NYSE',
          'LSE',
          'TSE',
          'HKEX',
          'EURONEXT',
        ]),
        sector: faker.helpers.arrayElement([
          'Technology',
          'Finance',
          'Healthcare',
          'Energy',
          'Consumer',
          'Industrials',
          'Utilities',
        ]),
        price,
        change: Number(((price * changePercent) / 100).toFixed(2)),
        changePercent,
        volume: faker.number.int({ min: 10_000, max: 50_000_000 }),
        marketCap: faker.number.int({
          min: 50_000_000,
          max: 3_000_000_000_000,
        }),
        peRatio: faker.number.float({ min: 5, max: 80, fractionDigits: 2 }),
      };
    },
  },
  {
    name: 'crypto',
    topic: 'finance',
    description: 'Crypto assets with price and 24h stats',
    total: 100,
    generate: ({ faker }) => {
      const name = faker.word.adjective({ length: { min: 4, max: 8 } });
      return {
        name: `${name[0].toUpperCase()}${name.slice(1)}coin`,
        symbol: faker.string.alpha({ length: 3, casing: 'upper' }),
        price: faker.number.float({
          min: 0.0001,
          max: 60_000,
          fractionDigits: 4,
        }),
        change24h: faker.number.float({ min: -25, max: 25, fractionDigits: 2 }),
        volume24h: faker.number.int({ min: 1000, max: 10_000_000_000 }),
        marketCap: faker.number.int({ min: 100_000, max: 1_000_000_000_000 }),
        circulatingSupply: faker.number.int({
          min: 1_000_000,
          max: 100_000_000_000,
        }),
        walletAddress: faker.finance.ethereumAddress(),
      };
    },
  },
];
