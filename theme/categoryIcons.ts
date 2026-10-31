import { MaterialCommunityIcons } from '@expo/vector-icons';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// MaterialCommunityIcons (a diferencia de Ionicons) sí trae íconos literales
// de comida — más originales y reconocibles que un emoji o un ícono
// genérico. `default` cubre cualquier categoría nueva que un admin agregue
// después y todavía no tenga ícono asignado acá.
const CATEGORY_ICONS: Record<string, MCIName> = {
  tuberculos: 'carrot',
  frutas:     'fruit-grapes',
  verduras:   'sprout',
  abarrotes:  'rice',
  default:    'food-variant',
};

export function getCategoryIcon(categoryId: string): MCIName {
  return CATEGORY_ICONS[categoryId] ?? CATEGORY_ICONS.default;
}
