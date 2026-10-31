import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL_LOCAL;

if (!connectionString) {
  throw new Error('DATABASE_URL_LOCAL is not defined');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const CATEGORIES = [
  { name: 'Кофе', slug: 'coffee', sortOrder: 0 },
  { name: 'Чай', slug: 'tea', sortOrder: 1 },
  { name: 'Десерты', slug: 'dessert', sortOrder: 2 },
  { name: 'Холодные напитки', slug: 'cold', sortOrder: 3 },
] as const;

function createImageUrl(photoId: string) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&fm=webp&w=800&q=80`;
}

const PRODUCTS = [
  {
    categorySlug: 'coffee',
    name: 'Капучино',
    description: 'Эспрессо и нежная молочная пенка',
    servingLabel: '300 мл',
    badgeText: 'Популярное',
    priceRub: 280,
    sortOrder: 0,
    imageUrl: createImageUrl('photo-1495474472287-4d71bcdd2085'),
  },
  {
    categorySlug: 'coffee',
    name: 'Латте',
    description: 'Мягкий кофе с бархатистым молоком',
    servingLabel: '350 мл',
    priceRub: 290,
    sortOrder: 1,
    imageUrl: createImageUrl('photo-1512568400610-62da28bc8a13'),
  },
  {
    categorySlug: 'coffee',
    name: 'Флэт уайт',
    description: 'Двойной эспрессо и плотная микропена',
    servingLabel: '200 мл',
    priceRub: 310,
    sortOrder: 2,
    imageUrl: createImageUrl('photo-1509042239860-f550ce710b93'),
  },
  {
    categorySlug: 'coffee',
    name: 'Американо',
    description: 'Эспрессо с горячей водой и ярким вкусом кофе',
    servingLabel: '250 мл',
    priceRub: 190,
    sortOrder: 3,
    imageUrl: createImageUrl('photo-1517701604599-bb29b565090c'),
  },
  {
    categorySlug: 'coffee',
    name: 'Раф ванильный',
    description: 'Нежный кофе со сливками и натуральной ванилью',
    servingLabel: '300 мл',
    priceRub: 330,
    sortOrder: 4,
    imageUrl: createImageUrl('photo-1445116572660-236099ec97a0'),
  },
  {
    categorySlug: 'coffee',
    name: 'Мокка',
    description: 'Эспрессо, шоколад и молоко в одном напитке',
    servingLabel: '300 мл',
    priceRub: 340,
    sortOrder: 5,
    imageUrl: createImageUrl('photo-1514432324607-a09d9b4aefdd'),
  },
  {
    categorySlug: 'tea',
    name: 'Эрл Грей',
    description: 'Чёрный чай с бергамотом',
    servingLabel: '400 мл',
    badgeText: 'Популярное',
    priceRub: 220,
    sortOrder: 0,
    imageUrl: createImageUrl('photo-1544787219-7f47ccb76574'),
  },
  {
    categorySlug: 'tea',
    name: 'Жасминовый чай',
    description: 'Зелёный чай с тонким цветочным ароматом',
    servingLabel: '400 мл',
    priceRub: 230,
    sortOrder: 1,
    imageUrl: createImageUrl('photo-1564890369478-c89ca6d9cde9'),
  },
  {
    categorySlug: 'tea',
    name: 'Гречишный чай',
    description: 'Насыщенный аромат с карамельными нотами',
    servingLabel: '400 мл',
    priceRub: 240,
    sortOrder: 2,
    imageUrl: createImageUrl('photo-1594631252845-29fc4cc8cde9'),
  },
  {
    categorySlug: 'tea',
    name: 'Матча латте',
    description: 'Японская матча с молоком и мягкой сладостью',
    servingLabel: '300 мл',
    priceRub: 310,
    sortOrder: 3,
    imageUrl: createImageUrl('photo-1515823662972-da6e0c80c7ff'),
  },
  {
    categorySlug: 'tea',
    name: 'Облепиховый чай',
    description: 'Яркий чай с облепихой, апельсином и мёдом',
    servingLabel: '400 мл',
    priceRub: 290,
    sortOrder: 4,
    imageUrl: createImageUrl('photo-1563822249548-916d2c9e0e3c'),
  },
  {
    categorySlug: 'tea',
    name: 'Чай с чабрецом',
    description: 'Чёрный чай с ароматным горным чабрецом',
    servingLabel: '400 мл',
    priceRub: 250,
    sortOrder: 5,
    imageUrl: createImageUrl('photo-1576092768241-dec231879fc3'),
  },
  {
    categorySlug: 'dessert',
    name: 'Шоколадный мусс',
    description: 'Нежный мусс на основе тёмного шоколада',
    servingLabel: '150 г',
    badgeText: 'Популярное',
    priceRub: 340,
    sortOrder: 0,
    imageUrl: createImageUrl('photo-1571877227200-a0d98ea607e9'),
  },
  {
    categorySlug: 'dessert',
    name: 'Чизкейк Нью-Йорк',
    description: 'Сливочный десерт с хрустящей основой',
    servingLabel: '180 г',
    priceRub: 360,
    sortOrder: 1,
    imageUrl: createImageUrl('photo-1565958011703-44f9829ba187'),
  },
  {
    categorySlug: 'dessert',
    name: 'Брауни',
    description: 'Плотный шоколадный десерт с какао',
    servingLabel: '120 г',
    priceRub: 260,
    sortOrder: 2,
    imageUrl: createImageUrl('photo-1563729784474-d77dbb933a9e'),
  },
  {
    categorySlug: 'dessert',
    name: 'Круассан с миндалём',
    description: 'Слоёный круассан с нежной миндальной начинкой',
    servingLabel: '100 г',
    priceRub: 230,
    sortOrder: 3,
    imageUrl: createImageUrl('photo-1555507036-ab1f4038808a'),
  },
  {
    categorySlug: 'dessert',
    name: 'Морковный торт',
    description: 'Пряный бисквит со сливочным кремом',
    servingLabel: '160 г',
    priceRub: 320,
    sortOrder: 4,
    imageUrl: createImageUrl('photo-1621303837174-89787a7d4729'),
  },
  {
    categorySlug: 'dessert',
    name: 'Печенье с шоколадом',
    description: 'Мягкое печенье с кусочками тёмного шоколада',
    servingLabel: '80 г',
    priceRub: 150,
    sortOrder: 5,
    imageUrl: createImageUrl('photo-1499636136210-6f4ee915583e'),
  },
  {
    categorySlug: 'cold',
    name: 'Айс латте',
    description: 'Эспрессо, молоко и кубики льда',
    servingLabel: '400 мл',
    badgeText: 'Популярное',
    priceRub: 320,
    sortOrder: 0,
    imageUrl: createImageUrl('photo-1461023058943-07fcbe16d735'),
  },
  {
    categorySlug: 'cold',
    name: 'Колд брю',
    description: 'Кофе холодного заваривания со льдом',
    servingLabel: '350 мл',
    priceRub: 300,
    sortOrder: 1,
    imageUrl: createImageUrl('photo-1551024709-8f23befc6f87'),
  },
  {
    categorySlug: 'cold',
    name: 'Айс какао',
    description: 'Шоколадный напиток на охлаждённом молоке',
    servingLabel: '350 мл',
    priceRub: 290,
    sortOrder: 2,
    imageUrl: createImageUrl('photo-1513558161293-cdaf765ed2fd'),
  },
  {
    categorySlug: 'cold',
    name: 'Лимонад малина-мята',
    description: 'Освежающий лимонад с малиной и свежей мятой',
    servingLabel: '400 мл',
    priceRub: 270,
    sortOrder: 3,
    imageUrl: createImageUrl('photo-1556679343-c7306c1976bc'),
  },
  {
    categorySlug: 'cold',
    name: 'Айс ти персик',
    description: 'Холодный чёрный чай с сочным персиком',
    servingLabel: '400 мл',
    priceRub: 260,
    sortOrder: 4,
    imageUrl: createImageUrl('photo-1497534446932-c925b458314e'),
  },
  {
    categorySlug: 'cold',
    name: 'Классический милкшейк',
    description: 'Густой молочный коктейль с ванильным мороженым',
    servingLabel: '350 мл',
    priceRub: 310,
    sortOrder: 5,
    imageUrl: createImageUrl('photo-1572490122747-3968b75cc699'),
  },
] as const;

async function main() {
  const categoryIds = new Map<string, number>();

  for (const category of CATEGORIES) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
      },
      create: category,
    });

    categoryIds.set(category.slug, savedCategory.id);
  }

  for (const product of PRODUCTS) {
    const categoryId = categoryIds.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Category "${product.categorySlug}" was not seeded`);
    }

    const { categorySlug: _, ...productData } = product;
    const existingProduct = await prisma.product.findFirst({
      where: {
        categoryId,
        name: product.name,
      },
    });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
      continue;
    }

    await prisma.product.create({
      data: {
        ...productData,
        categoryId,
      },
    });
  }
}

main()
  .then(() => {
    console.info('Catalog seed completed');
  })
  .catch((error: unknown) => {
    console.error('Catalog seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
