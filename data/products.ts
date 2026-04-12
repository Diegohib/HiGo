export type Presentation = {
  label: string;
  price: number;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  subcategory: string;
  emoji: string;
  emojiColor: string;
  description: string;
  presentations: Presentation[];
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

export const CATEGORIES: Category[] = [
  { id: 'tuberculos', name: 'Tubérculos', emoji: '🥔', color: '#8B6914' },
  { id: 'frutas',     name: 'Frutas',     emoji: '🍎', color: '#2D7A3A' },
  { id: 'verduras',   name: 'Verduras',   emoji: '🥦', color: '#388E3C' },
  { id: 'abarrotes',  name: 'Abarrotes',  emoji: '📦', color: '#3D1F8B' },
];

export const PRODUCTS: Product[] = [
  // ── Tubérculos ──
  {
    id: 'tb1',
    name: 'Papa Chola',
    categoryId: 'tuberculos',
    subcategory: 'Tubérculos',
    emoji: '🥔',
    emojiColor: '#8B6914',
    description: 'Papa chola de primera calidad cosechada en los Andes ecuatorianos. Ideal para sopas, secos y locros.',
    presentations: [
      { label: 'Dólar',   price: 1.00 },
      { label: 'Kilo',    price: 0.50 },
      { label: 'Arroba',  price: 5.00 },
      { label: 'Quintal', price: 18.00 },
    ],
  },
  {
    id: 'tb2',
    name: 'Papa Súper Chola',
    categoryId: 'tuberculos',
    subcategory: 'Tubérculos',
    emoji: '🥔',
    emojiColor: '#A07820',
    description: 'Variedad selecta de papa chola con mayor tamaño y sabor. Perfecta para hornear y freír.',
    presentations: [
      { label: 'Dólar',   price: 1.00 },
      { label: 'Kilo',    price: 0.60 },
      { label: 'Arroba',  price: 6.00 },
      { label: 'Quintal', price: 22.00 },
    ],
  },
  {
    id: 'tb3',
    name: 'Camote',
    categoryId: 'tuberculos',
    subcategory: 'Tubérculos',
    emoji: '🍠',
    emojiColor: '#C0622A',
    description: 'Camote dulce de pulpa naranja, rico en vitamina A. Ideal para coladas, tortillas y guisos.',
    presentations: [
      { label: 'Dólar',   price: 1.00 },
      { label: 'Kilo',    price: 0.80 },
      { label: 'Arroba',  price: 7.00 },
      { label: 'Quintal', price: 25.00 },
    ],
  },
  {
    id: 'tb4',
    name: 'Yuca',
    categoryId: 'tuberculos',
    subcategory: 'Tubérculos',
    emoji: '🌿',
    emojiColor: '#6B8E23',
    description: 'Yuca blanca fresca del oriente ecuatoriano. Base de sopas, seco de pollo y chicha.',
    presentations: [
      { label: 'Dólar',   price: 1.00 },
      { label: 'Kilo',    price: 0.70 },
      { label: 'Arroba',  price: 6.00 },
      { label: 'Quintal', price: 22.00 },
    ],
  },

  // ── Frutas ──
  {
    id: 'fr1',
    name: 'Tomate de Árbol',
    categoryId: 'frutas',
    subcategory: 'Frutas',
    emoji: '🍅',
    emojiColor: '#C0392B',
    description: 'Tomate de árbol rojo de la sierra, ideal para jugos naturales, ají y ensaladas de frutas.',
    presentations: [
      { label: 'Dólar', price: 1.00 },
      { label: 'Kilo',  price: 1.20 },
      { label: 'Caja',  price: 18.00 },
    ],
  },
  {
    id: 'fr2',
    name: 'Naranja Valencia',
    categoryId: 'frutas',
    subcategory: 'Frutas',
    emoji: '🍊',
    emojiColor: '#E67E22',
    description: 'Naranja valencia jugosa del subtróico ecuatoriano. Alta en vitamina C, perfecta para jugos.',
    presentations: [
      { label: 'Dólar', price: 1.00 },
      { label: 'Kilo',  price: 0.80 },
      { label: 'Caja',  price: 12.00 },
    ],
  },
  {
    id: 'fr3',
    name: 'Plátano Guineo',
    categoryId: 'frutas',
    subcategory: 'Frutas',
    emoji: '🍌',
    emojiColor: '#F1C40F',
    description: 'Guineo amarillo de la costa ecuatoriana. Natural, dulce y maduro, listo para consumo.',
    presentations: [
      { label: 'Dólar', price: 1.00 },
      { label: 'Kilo',  price: 0.60 },
      { label: 'Caja',  price: 10.00 },
    ],
  },
  {
    id: 'fr4',
    name: 'Manzana Red Delicious',
    categoryId: 'frutas',
    subcategory: 'Frutas',
    emoji: '🍎',
    emojiColor: '#C0392B',
    description: 'Manzana importada Red Delicious de sabor dulce y textura crujiente. Ideal para consumo directo.',
    presentations: [
      { label: 'Dólar', price: 1.00 },
      { label: 'Kilo',  price: 1.50 },
      { label: 'Caja',  price: 22.00 },
    ],
  },

  // ── Verduras ──
  {
    id: 'vd1',
    name: 'Tomate Riñón',
    categoryId: 'verduras',
    subcategory: 'Verduras',
    emoji: '🍅',
    emojiColor: '#C0392B',
    description: 'Tomate riñón fresco de primera, cultivado en Ambato. Base de salsas, ensaladas y guisos.',
    presentations: [
      { label: 'Dólar',   price: 1.00 },
      { label: 'Kilo',    price: 0.80 },
      { label: 'Arroba',  price: 7.00 },
      { label: 'Quintal', price: 26.00 },
    ],
  },
  {
    id: 'vd2',
    name: 'Cebolla Paiteña',
    categoryId: 'verduras',
    subcategory: 'Verduras',
    emoji: '🧅',
    emojiColor: '#8B3A8B',
    description: 'Cebolla paiteña morada de Pimampiro, intensa y aromática. Esencial en curtidos y salsas.',
    presentations: [
      { label: 'Dólar',   price: 1.00 },
      { label: 'Kilo',    price: 0.60 },
      { label: 'Arroba',  price: 5.50 },
      { label: 'Quintal', price: 20.00 },
    ],
  },
  {
    id: 'vd3',
    name: 'Zanahoria',
    categoryId: 'verduras',
    subcategory: 'Verduras',
    emoji: '🥕',
    emojiColor: '#E67E22',
    description: 'Zanahoria amarilla dulce, fresca y de tamaño mediano. Ideal para jugos, sopas y guarniciones.',
    presentations: [
      { label: 'Dólar',   price: 1.00 },
      { label: 'Kilo',    price: 0.40 },
      { label: 'Arroba',  price: 3.50 },
      { label: 'Quintal', price: 13.00 },
    ],
  },
  {
    id: 'vd4',
    name: 'Pimiento Rojo',
    categoryId: 'verduras',
    subcategory: 'Verduras',
    emoji: '🫑',
    emojiColor: '#C0392B',
    description: 'Pimiento rojo maduro de sabor dulce. Perfecto para salteados, rellenos y ensaladas.',
    presentations: [
      { label: 'Dólar',   price: 1.00 },
      { label: 'Kilo',    price: 1.00 },
      { label: 'Arroba',  price: 9.00 },
      { label: 'Quintal', price: 34.00 },
    ],
  },

  // ── Abarrotes ──
  {
    id: 'ab1',
    name: 'Huevos de Campo',
    categoryId: 'abarrotes',
    subcategory: 'Huevos',
    emoji: '🥚',
    emojiColor: '#F57F17',
    description: 'Huevos frescos de gallina campera criada en granja. Yema dorada, sabor superior.',
    presentations: [
      { label: 'Unidad',  price: 0.18 },
      { label: 'Cubeta',  price: 5.00 },
    ],
  },
  {
    id: 'ab2',
    name: 'Arroz Extra',
    categoryId: 'abarrotes',
    subcategory: 'Arroz',
    emoji: '🍚',
    emojiColor: '#C4943A',
    description: 'Arroz blanco extra de grano largo, de la Costa ecuatoriana. Rendidor y sin impurezas.',
    presentations: [
      { label: 'Libra',   price: 0.45 },
      { label: 'Arroba',  price: 7.00 },
      { label: 'Quintal', price: 52.00 },
    ],
  },
  {
    id: 'ab3',
    name: 'Azúcar Blanca',
    categoryId: 'abarrotes',
    subcategory: 'Azúcar',
    emoji: '🍬',
    emojiColor: '#C4623A',
    description: 'Azúcar blanca refinada de caña ecuatoriana. Uso doméstico e industrial, sin grumos.',
    presentations: [
      { label: 'Libra',   price: 0.50 },
      { label: 'Arroba',  price: 7.50 },
      { label: 'Quintal', price: 56.00 },
    ],
  },
];
