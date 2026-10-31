export type UserRole = 'cliente' | 'cochero' | 'transportista' | 'comerciante' | 'admin';
export type UserStatus = 'approved' | 'pending' | 'rejected';

export interface AppUser {
  uid: string;
  role: UserRole;
  status: UserStatus;
  name: string;
  phone: string;
  email?: string;
}

export type Presentation = {
  label: string;
  price: number;
  weightLbs: number;
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
  // Puesto del Mercado Mayorista que vende este producto. Nombre y número se
  // copian acá para que la app no tenga que leer el perfil del comerciante.
  comercianteUid?:  string;
  comercianteName?: string;
  stallNumber?:     string;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  image: string;
};

export interface Faq {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

export type SolicitudStatus = 'pendiente' | 'aprobada' | 'rechazada';
export type SolicitudRole = 'cochero' | 'transportista' | 'comerciante';

export interface Solicitud {
  id: string;
  uid: string;
  name: string;
  phone: string;
  email?: string;
  role: SolicitudRole;
  requestedAt: Date;
  avatar: string;
  documents: string[];
  photoUris?: Record<string, string>;
  extraData: Record<string, string>;
  status: SolicitudStatus;
  rejectionReason?: string;
}

export type CartItem = {
  productId: string;
  presentationIndex: number;
  presentationLabel: string;
  presentationPrice: number;
  quantity: number;
};

export type OrderStatus = 'recibido' | 'en_mercado' | 'consolidado' | 'en_camino' | 'entregado';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  recibido: 'Recibido',
  en_mercado: 'En el mercado',
  consolidado: 'Consolidado',
  en_camino: 'En camino',
  entregado: 'Entregado',
};

export interface Order {
  id: string;
  uid: string;
  address: string;
  estimatedTime: string;
  status: OrderStatus;
  // 'cochero' = ruta programada (cochero recoge + transportista lleva);
  // 'transportista' = solo pedidos viejos: entrega directa sin cochero.
  operatorRole: 'cochero' | 'transportista';
  // 'directa' = lo antes posible (mismo recorrido, con prioridad).
  deliveryType?: 'programada' | 'directa';
  operatorName: string;
  operatorPhone: string;
  operatorUid?: string;
  transportistaName?: string;
  transportistaPhone?: string;
  transportistaUid?: string;
  // Desglose del total (pedidos viejos no lo traen): productos para los
  // comerciantes, 7 % de gestión (de ahí sale el cochero) y envío completo
  // para el transportista.
  subtotal?: number;
  managementFee?: number;
  shippingCost?: number;
  vehicle?: 'moto' | 'taxi' | 'camioneta';
  // Pago (pedidos viejos no lo traen). Transferencia: 'por_verificar' hasta
  // que el admin confirma o rechaza; released recién en true al confirmar.
  paymentMethod?: 'transferencia' | 'efectivo';
  paymentStatus?: 'por_verificar' | 'verificado' | 'rechazado' | 'contra_entrega' | 'cobrado';
  receiptUrl?: string;
  paymentRef?: string;
  released?: boolean;
  total: number;
  items: CartItem[];
  createdAt: number;
}

export const PAYMENT_STATUS_LABEL: Record<NonNullable<Order['paymentStatus']>, string> = {
  por_verificar: 'Pago por verificar',
  verificado: 'Pago confirmado',
  rechazado: 'Pago rechazado',
  contra_entrega: 'Efectivo al entregar',
  cobrado: 'Efectivo cobrado',
};

// Datos de la cuenta de HiGo para transferencias (documento config/payment).
export interface BankDetails {
  bankName: string;
  accountType: string;
  accountNumber: string;
  holderName: string;
  holderId: string;
}

export interface ChatThread {
  uid: string;
  clientName: string;
  lastMessageAt: number;
  lastMessageText: string;
  lastMessageSenderRole: 'cliente' | 'admin';
  unreadByAdmin: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'cliente' | 'admin';
  text: string;
  createdAt: number;
}

export const REJECTION_REASONS = [
  'Foto ilegible',
  'Cédula no coincide',
  'Matrícula vencida',
  'Información incompleta',
  'Cédula duplicada',
  'Cupo lleno por zona',
] as const;

export type RejectionReason = typeof REJECTION_REASONS[number];
