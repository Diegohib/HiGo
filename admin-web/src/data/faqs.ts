// Preguntas frecuentes de arranque ("seed"), copiado del proyecto móvil
// (data/faqs.ts). Los ids son estables (fq1, fq2, ...) para que reimportar
// actualice los mismos documentos en Firestore en vez de duplicarlos.

import { Faq } from '../types';

export const FAQS: Faq[] = [
  {
    id: 'fq1',
    question: '¿Cómo funciona HiGo?',
    answer:
      'HiGo es el mercado mayorista de la ciudad, directo desde tu celular: eliges tus productos por categoría, los agregas al carrito, confirmas tu pedido con tu dirección de entrega y un cochero o transportista te lo lleva a domicilio.',
    keywords: ['como funciona', 'que es higo', 'para que sirve', 'que es esto', 'de que trata'],
  },
  {
    id: 'fq2',
    question: '¿Cómo hago un pedido?',
    answer:
      'Desde Inicio elige una categoría o busca el producto que necesitas, toca el botón + para agregarlo al carrito, y cuando termines ve a tu carrito y presiona "Confirmar pedido". Ahí eliges tu dirección de entrega.',
    keywords: ['hacer un pedido', 'hago un pedido', 'como compro', 'como pido', 'agregar al carrito', 'comprar'],
  },
  {
    id: 'fq3',
    question: '¿Necesito crear una cuenta para comprar?',
    answer:
      'Puedes navegar el catálogo sin cuenta, pero para confirmar un pedido sí necesitas una cuenta gratis — te la pedimos justo antes de confirmar y solo toma un minuto.',
    keywords: ['necesito cuenta', 'sin cuenta', 'cuenta gratis', 'invitado', 'registrarme para comprar'],
  },
  {
    id: 'fq4',
    question: '¿Cuál es el pedido mínimo?',
    answer:
      'El pedido mínimo es de $15. Si tu carrito no llega a ese monto, el botón de confirmar te va a pedir que agregues más productos.',
    keywords: ['pedido minimo', 'monto minimo', 'minimo de compra', 'cuanto es el minimo'],
  },
  {
    id: 'fq5',
    question: '¿Cuáles son los horarios de entrega?',
    answer: 'Entregamos en dos franjas: de 10:00 a 12:00 y de 14:00 a 16:00.',
    keywords: ['horario', 'horarios de entrega', 'a que hora entregan', 'cuando llega'],
  },
  {
    id: 'fq6',
    question: '¿Cómo pago mi pedido?',
    answer: 'El pago es en efectivo, directo con el cochero o transportista al momento de recibir tu pedido.',
    keywords: ['como pago', 'metodos de pago', 'forma de pago', 'efectivo', 'pagar'],
  },
  {
    id: 'fq7',
    question: '¿Cómo sigo mi pedido?',
    answer:
      'Desde la confirmación del pedido, o desde tu historial en la cuenta, puedes abrir el seguimiento y ver el estado en tiempo real hasta que llegue a tu puerta.',
    keywords: ['seguir mi pedido', 'donde esta mi pedido', 'rastrear', 'estado del pedido', 'tracking'],
  },
  {
    id: 'fq8',
    question: '¿Cómo cambio mi dirección de entrega?',
    answer:
      'Ve a Cuenta y edita tu dirección, o marca el pin correcto en el mapa la próxima vez que hagas checkout — se guarda para tus próximos pedidos.',
    keywords: ['cambiar direccion', 'editar direccion', 'mi direccion', 'donde entregan'],
  },
  {
    id: 'fq9',
    question: '¿Cómo edito mi perfil o mi foto?',
    answer:
      'En la pestaña Cuenta puedes tocar tu foto para cambiarla, y editar tu nombre, apodo, teléfono y otros datos desde ahí mismo.',
    keywords: ['editar perfil', 'cambiar foto', 'mis datos', 'editar cuenta', 'cambiar nombre'],
  },
  {
    id: 'fq10',
    question: '¿Tengo que verificar mi correo?',
    answer: 'Sí. Al crear tu cuenta te enviamos un correo de verificación — confírmalo para poder usar HiGo sin restricciones.',
    keywords: ['verificar correo', 'confirmar email', 'correo de verificacion', 'verificar cuenta'],
  },
  {
    id: 'fq11',
    question: '¿Cómo trabajo como cochero, transportista o comerciante?',
    answer:
      'Desde la pantalla de acceso operativo elige tu rol (Cochero, Transportista o Comerciante) y completa el registro con tus datos y documentos. Un administrador revisa tu solicitud en menos de 24 horas.',
    keywords: ['trabajar en higo', 'trabajo como cochero', 'trabajo como transportista', 'trabajo como comerciante', 'ser cochero', 'ser transportista', 'ser comerciante', 'quiero trabajar', 'personal operativo'],
  },
  {
    id: 'fq12',
    question: '¿Cuánto tarda en aprobarse mi solicitud de personal?',
    answer:
      'Las solicitudes de personal operativo (cochero, transportista o comerciante) se revisan en menos de 24 horas. Te vamos a notificar apenas quede aprobada o si falta algún dato.',
    keywords: ['cuanto tarda mi solicitud', 'aprobar solicitud', 'revision de solicitud', 'cuando me aprueban'],
  },
  {
    id: 'fq13',
    question: '¿Qué hago si mi solicitud de personal fue rechazada?',
    answer:
      'Vas a ver el motivo del rechazo en la app. Puedes corregir lo que falte (por ejemplo una foto ilegible o un dato incompleto) y volver a enviar tu solicitud.',
    keywords: ['solicitud rechazada', 'por que me rechazaron', 'corregir solicitud'],
  },
  {
    id: 'fq14',
    question: '¿Cómo hablo con un administrador?',
    answer:
      'Toca "Hablar con un administrador" acá mismo en el asistente, o desde el seguimiento de tu pedido — te abre un chat directo para lo que necesites.',
    keywords: ['hablar con administrador', 'contactar soporte', 'hablar con alguien', 'atencion al cliente', 'soporte'],
  },
  {
    id: 'fq15',
    question: 'Olvidé mi contraseña, ¿qué hago?',
    answer:
      'Por ahora no hay una opción de recuperación automática en la app — escríbenos por "Hablar con un administrador" y te ayudamos a recuperar el acceso a tu cuenta.',
    keywords: ['olvide mi contraseña', 'recuperar contraseña', 'no puedo entrar', 'contraseña olvidada'],
  },
  {
    id: 'fq16',
    question: '¿Qué productos puedo comprar?',
    answer:
      'Encuentras el catálogo organizado por categorías como tubérculos, frutas, verduras, arroz, azúcar y huevos — cada una con sus productos y presentaciones.',
    keywords: ['que venden', 'categorias de productos', 'que productos hay', 'que puedo comprar'],
  },
  {
    id: 'fq17',
    question: '¿Cómo creo mi cuenta?',
    answer:
      'Desde la pestaña Cuenta vas a ver un botón para crear tu cuenta (o te lo pedimos al confirmar tu primer pedido). Solo completa nombre, correo, teléfono y contraseña, y confirma el correo de verificación que te enviamos.',
    keywords: ['crear cuenta', 'como me registro', 'abrir cuenta', 'hacer una cuenta', 'registrarme', 'nueva cuenta'],
  },
];
