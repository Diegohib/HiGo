export type StaffRole = 'cochero' | 'transportista' | 'comerciante';

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  // Flujo cliente (checkout)
  Register: undefined;
  // Flujo personal operativo
  Login: undefined;
  VerifyEmail: undefined;
  RoleSelection: undefined;
  StaffRegister:      { role: StaffRole };
  SolicitudPendiente: { solicitudId?: string } | undefined;
  // Dashboard cochero
  CocheroDashboard: undefined;
  // Dashboard transportista
  TransportistaDashboard: undefined;
  // Admin: aviso para usar el panel web
  AdminDashboard:       undefined;
  // Dashboard comerciante
  ComercianteDashboard: undefined;
  // Asistente de preguntas frecuentes + chat de soporte general
  Assistant: undefined;
  Chat: undefined;
  // Chat puntual entre el cliente y el cochero/transportista de un pedido
  OrderChat: { orderId: string };
};

export type HomeStackParamList = {
  Home: undefined;
  Catalog: {
    categoryId?: string;
    categoryName?: string;
    categoryEmoji?: string;
    categoryColor?: string;
    initialSearch?: string;
  };
  Product: { productId: string };
  Carrito: undefined;
  Checkout: {
    pickedAddress?: string;
    pickedLat?: number;
    pickedLng?: number;
  } | undefined;
  MapPicker: { returnTo?: 'Checkout' | 'AddressSetup' } | undefined;
  AddressSetup: {
    pickedAddress?: string;
    pickedLat?: number;
    pickedLng?: number;
  } | undefined;
  OrderTracking: { orderId: string };
};

export type TabParamList = {
  Inicio: undefined;
  Lista: undefined;
  Cuenta: undefined;
};
