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
  // Dashboard cochero
  CocheroDashboard: undefined;
  // Dashboard transportista
  TransportistaDashboard: undefined;
  // Dashboard admin
  AdminDashboard:       undefined;
  AdminSolicitudes:     undefined;
  AdminFinanzas:        undefined;
  // Dashboard comerciante
  ComercianteDashboard: undefined;
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
  Checkout: {
    pickedAddress?: string;
    pickedLat?: number;
    pickedLng?: number;
  } | undefined;
  MapPicker: undefined;
  OrderTracking: {
    orderId: string;
    address: string;
    estimatedTime: string;
    currentStatus: 'recibido' | 'en_mercado' | 'consolidado' | 'en_camino' | 'entregado';
    operatorName: string;
    operatorPhone: string;
    operatorRole: 'cochero' | 'transportista';
    deliveryLat?: number;
    deliveryLng?: number;
  };
};

export type CatalogStackParamList = {
  Categories: undefined;
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
