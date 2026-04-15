export type StaffRole = 'cochero' | 'transportista' | 'comerciante';

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  // Flujo cliente (checkout)
  Register: undefined;
  // Flujo personal operativo
  Login: undefined;
  RoleSelection: undefined;
  StaffRegister: { role: StaffRole };
};

export type HomeStackParamList = {
  Home: undefined;
  Catalog: {
    categoryId?: string;
    categoryName?: string;
    categoryEmoji?: string;
    categoryColor?: string;
  };
  Product: { productId: string };
  Carrito: undefined;
};

export type CatalogStackParamList = {
  Catalog: {
    categoryId?: string;
    categoryName?: string;
    categoryEmoji?: string;
    categoryColor?: string;
  };
  Product: { productId: string };
  Carrito: undefined;
};

export type TabParamList = {
  Inicio: undefined;
  Catalogo: undefined;
  Lista: undefined;
  Cuenta: undefined;
};
