export type Presentation = {
  label:     string;
  price:     number;
  weightLbs: number; // peso en libras de UNA unidad de esta presentación
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  subcategory: string;
  emoji: string;
  emojiColor: string;
  image: string;
  description: string;
  presentations: Presentation[];
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

// ─── Categorías ───────────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = [
  { id: 'tuberculos', name: 'Tubérculos', emoji: '🥔', color: '#8B6914' },
  { id: 'frutas',     name: 'Frutas',     emoji: '🍎', color: '#2D7A3A' },
  { id: 'verduras',   name: 'Verduras',   emoji: '🥦', color: '#388E3C' },
  { id: 'abarrotes',  name: 'Abarrotes',  emoji: '📦', color: '#3D1F8B' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=300&h=300&fit=crop&auto=format&q=80`;

// ─── Productos ────────────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [

  // ── Tubérculos ──────────────────────────────────────────────────────────────
  {
    id: 'tb1',
    name: 'Papa Chola',
    categoryId: 'tuberculos',
    subcategory: 'Tubérculos',
    emoji: '🥔',
    emojiColor: '#C4943A',
    image: img('1518977676601-b53f82aba655'),
    description: 'Papa chola de primera calidad cosechada en los Andes. Ideal para sopas, secos y locros.',
    presentations: [
      { label: 'Libra',   price:  0.50, weightLbs:   1 },
      { label: 'Arroba',  price:  9.00, weightLbs:  25 },
      { label: 'Quintal', price: 34.00, weightLbs: 100 },
    ],
  },
  {
    id: 'tb2',
    name: 'Papa Nabo',
    categoryId: 'tuberculos',
    subcategory: 'Tubérculos',
    emoji: '🥔',
    emojiColor: '#B8860B',
    image: img('1512621816951-d210bec9163c'),
    description: 'Papa nabo fresca de la sierra ecuatoriana. Sabor suave, perfecta para purés y sopas.',
    presentations: [
      { label: 'Libra',   price:  0.40, weightLbs:   1 },
      { label: 'Arroba',  price:  7.00, weightLbs:  25 },
      { label: 'Quintal', price: 26.00, weightLbs: 100 },
    ],
  },
  {
    id: 'tb3',
    name: 'Yuca',
    categoryId: 'tuberculos',
    subcategory: 'Tubérculos',
    emoji: '🌿',
    emojiColor: '#6B8E23',
    image: img('1499026893-b3f1ebec1eed'),
    description: 'Yuca blanca fresca del oriente ecuatoriano. Base de sopas, seco de pollo y chicha.',
    presentations: [
      { label: 'Libra',   price:  0.60, weightLbs:   1 },
      { label: 'Arroba',  price: 11.00, weightLbs:  25 },
      { label: 'Quintal', price: 40.00, weightLbs: 100 },
    ],
  },
  {
    id: 'tb4',
    name: 'Zanahoria',
    categoryId: 'tuberculos',
    subcategory: 'Tubérculos',
    emoji: '🥕',
    emojiColor: '#E67E22',
    image: img('1447175008436-054170c2e979'),
    description: 'Zanahoria amarilla dulce y fresca. Ideal para jugos, sopas y guarniciones.',
    presentations: [
      { label: 'Libra',   price:  0.45, weightLbs:   1 },
      { label: 'Arroba',  price:  8.00, weightLbs:  25 },
      { label: 'Quintal', price: 30.00, weightLbs: 100 },
    ],
  },
  {
    id: 'tb5',
    name: 'Remolacha',
    categoryId: 'tuberculos',
    subcategory: 'Tubérculos',
    emoji: '🫐',
    emojiColor: '#8B003A',
    image: img('1593105544559-ecb03bf76f82'),
    description: 'Remolacha roja fresca, alta en hierro y antioxidantes. Perfecta para jugos y ensaladas.',
    presentations: [
      { label: 'Libra',   price:  0.40, weightLbs:   1 },
      { label: 'Arroba',  price:  7.00, weightLbs:  25 },
      { label: 'Quintal', price: 26.00, weightLbs: 100 },
    ],
  },

  // ── Frutas ──────────────────────────────────────────────────────────────────
  {
    id: 'fr1',
    name: 'Naranja',
    categoryId: 'frutas',
    subcategory: 'Frutas',
    emoji: '🍊',
    emojiColor: '#E67E22',
    image: img('1547514701-42782101795e'),
    description: 'Naranja valenciana jugosa del subtrópico ecuatoriano. Alta en vitamina C, ideal para jugos.',
    presentations: [
      { label: 'Dólar', price:  1.00, weightLbs:  3 },  // ~3 lbs por dólar
      { label: 'Caja',  price: 14.00, weightLbs: 40 },
    ],
  },
  {
    id: 'fr2',
    name: 'Banano',
    categoryId: 'frutas',
    subcategory: 'Frutas',
    emoji: '🍌',
    emojiColor: '#F1C40F',
    image: img('1571771894821-ce9b6c11b08e'),
    description: 'Guineo amarillo de la costa ecuatoriana. Natural, dulce y maduro, listo para consumo.',
    presentations: [
      { label: 'Dólar', price:  0.80, weightLbs:  3 },
      { label: 'Caja',  price: 10.00, weightLbs: 50 },
    ],
  },
  {
    id: 'fr3',
    name: 'Tomate de Árbol',
    categoryId: 'frutas',
    subcategory: 'Frutas',
    emoji: '🍅',
    emojiColor: '#C0392B',
    image: img('1546470427-e26264be0b07'),
    description: 'Tomate de árbol rojo de la sierra. Ideal para jugos naturales, ají y ensaladas de frutas.',
    presentations: [
      { label: 'Dólar', price:  1.20, weightLbs:  2 },
      { label: 'Caja',  price: 18.00, weightLbs: 20 },
    ],
  },
  {
    id: 'fr4',
    name: 'Mango',
    categoryId: 'frutas',
    subcategory: 'Frutas',
    emoji: '🥭',
    emojiColor: '#F39C12',
    image: img('1591073113125-e46713c829ed'),
    description: 'Mango Tommy Atkins de la costa ecuatoriana. Dulce, carnoso y sin fibra. Perfecto para jugos.',
    presentations: [
      { label: 'Dólar', price:  1.50, weightLbs:  2 },
      { label: 'Caja',  price: 20.00, weightLbs: 35 },
    ],
  },
  {
    id: 'fr5',
    name: 'Mora',
    categoryId: 'frutas',
    subcategory: 'Frutas',
    emoji: '🫐',
    emojiColor: '#5D3A8E',
    image: img('1596591868231-05e808f753e2'),
    description: 'Mora de castilla fresca de Tungurahua. Acidulce, perfecta para jugos, batidos y mermeladas.',
    presentations: [
      { label: 'Dólar', price:  1.00, weightLbs:  1.5 },
      { label: 'Caja',  price: 15.00, weightLbs: 15   },
    ],
  },

  // ── Verduras ────────────────────────────────────────────────────────────────
  {
    id: 'vd1',
    name: 'Tomate Riñón',
    categoryId: 'verduras',
    subcategory: 'Verduras',
    emoji: '🍅',
    emojiColor: '#C0392B',
    image: img('1558818371-f3316e783f52'),
    description: 'Tomate riñón fresco de primera, cultivado en Ambato. Base de salsas, ensaladas y guisos.',
    presentations: [
      { label: 'Libra',   price:  0.80, weightLbs:   1 },
      { label: 'Arroba',  price: 14.00, weightLbs:  25 },
      { label: 'Quintal', price: 52.00, weightLbs: 100 },
    ],
  },
  {
    id: 'vd2',
    name: 'Cebolla Paiteña',
    categoryId: 'verduras',
    subcategory: 'Verduras',
    emoji: '🧅',
    emojiColor: '#8B3A8B',
    image: img('1618512496248-a07e9dd6f252'),
    description: 'Cebolla paiteña morada de Pimampiro, intensa y aromática. Esencial en curtidos y salsas.',
    presentations: [
      { label: 'Libra',   price:  0.60, weightLbs:   1 },
      { label: 'Arroba',  price: 10.00, weightLbs:  25 },
      { label: 'Quintal', price: 38.00, weightLbs: 100 },
    ],
  },
  {
    id: 'vd3',
    name: 'Pimiento',
    categoryId: 'verduras',
    subcategory: 'Verduras',
    emoji: '🫑',
    emojiColor: '#27AE60',
    image: img('1563565375-f3fdfdbefa83'),
    description: 'Pimiento verde y rojo fresco. Perfecto para salteados, rellenos y ensaladas.',
    presentations: [
      { label: 'Libra',   price:  0.70, weightLbs:   1 },
      { label: 'Arroba',  price: 12.00, weightLbs:  25 },
      { label: 'Quintal', price: 46.00, weightLbs: 100 },
    ],
  },
  {
    id: 'vd4',
    name: 'Lechuga',
    categoryId: 'verduras',
    subcategory: 'Verduras',
    emoji: '🥬',
    emojiColor: '#2ECC71',
    image: img('1622206151226-18ca2c9ab4a1'),
    description: 'Lechuga crespa fresca y crujiente. Perfecta para ensaladas, wraps y hamburguesas.',
    presentations: [
      { label: 'Unidad', price: 0.50, weightLbs: 0.5 },
      { label: 'Docena', price: 5.00, weightLbs: 6   },
    ],
  },
  {
    id: 'vd5',
    name: 'Brócoli',
    categoryId: 'verduras',
    subcategory: 'Verduras',
    emoji: '🥦',
    emojiColor: '#388E3C',
    image: img('1459411621453-7b03977f4bfc'),
    description: 'Brócoli verde fresco cosechado en la sierra. Rico en vitaminas, perfecto al vapor o salteado.',
    presentations: [
      { label: 'Unidad', price: 0.60, weightLbs: 1  },
      { label: 'Docena', price: 6.00, weightLbs: 12 },
    ],
  },

  // ── Abarrotes ────────────────────────────────────────────────────────────────
  {
    id: 'ab1',
    name: 'Arroz Extra',
    categoryId: 'abarrotes',
    subcategory: 'Arroz',
    emoji: '🍚',
    emojiColor: '#C4943A',
    image: img('1536304929831-ee1ca9d44906'),
    description: 'Arroz blanco extra de grano largo de la Costa ecuatoriana. Rendidor y sin impurezas.',
    presentations: [
      { label: 'Libra',   price:  0.45, weightLbs:   1 },
      { label: 'Arroba',  price:  8.00, weightLbs:  25 },
      { label: 'Quintal', price: 30.00, weightLbs: 100 },
    ],
  },
  {
    id: 'ab2',
    name: 'Azúcar Blanca',
    categoryId: 'abarrotes',
    subcategory: 'Azúcar',
    emoji: '🍬',
    emojiColor: '#F5CBA7',
    image: img('1558618666-fcd25c85cd64'),
    description: 'Azúcar blanca refinada de caña ecuatoriana. Uso doméstico e industrial, sin grumos.',
    presentations: [
      { label: 'Libra',   price:  0.44, weightLbs:   1 },
      { label: 'Arroba',  price:  8.00, weightLbs:  25 },
      { label: 'Quintal', price: 30.00, weightLbs: 100 },
    ],
  },
  {
    id: 'ab3',
    name: 'Huevos de Campo',
    categoryId: 'abarrotes',
    subcategory: 'Huevos',
    emoji: '🥚',
    emojiColor: '#F57F17',
    image: img('1587486913049-53fc88980cfc'),
    description: 'Huevos frescos de gallina campera criada en granja. Yema dorada, sabor superior.',
    presentations: [
      { label: 'Unidad',     price: 0.15, weightLbs: 0.12 },
      { label: 'Cubeta 15u', price: 2.00, weightLbs: 1.8  },
      { label: 'Cubeta 30u', price: 3.80, weightLbs: 3.6  },
    ],
  },
];
