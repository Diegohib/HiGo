export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  RoleSelection: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Catalog: {
    categoryId: string;
    categoryName: string;
    categoryEmoji: string;
    categoryColor: string;
  };
  Product: { productId: string };
};

export type TabParamList = {
  Inicio: undefined;
  Catalogo: undefined;
  Lista: undefined;
  Cuenta: undefined;
};
