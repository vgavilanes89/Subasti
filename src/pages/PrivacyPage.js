import React from 'react';
import { Link } from 'react-router-dom';
import { StaticPage, StaticSection } from '../components/StaticPage';

// Privacy policy. It describes what the code actually collects and which outside
// services receive it — update it whenever that changes (a new provider, a new
// kind of data, new browser storage).
//
// Each section: { h: heading, p: [paragraphs], list: [[label, text]], after: [paragraphs], contact }
const CONTENT = {
    en: {
        title: 'Privacy Policy',
        subtitle: 'Last updated: November 2026. What Subasti collects, why, who receives it, and your choices.',
        contactLink: 'Contact page',
        sections: [
            {
                h: 'Information we collect',
                p: ['Information you give us:'],
                list: [
                    ['Account', 'cédula number, the name registered to it, profile name, email, phone, province and city, password, and optionally a profile photo and return policy.'],
                    ['Listings', 'titles, descriptions, details, prices and photos you publish.'],
                    ['Buying and selling', 'orders, bids, offers, claims and their reasons, reviews you write, delivery addresses, tracking information, and the SINPE Móvil number you say you paid from.'],
                    ['Saved details', 'delivery addresses and SINPE Móvil numbers you choose to save. For saved cards we keep only a reference to your record at our payment processor.'],
                    ['Seller payouts', "the account holder's name and the bank account (IBAN) or SINPE Móvil number where you want to be paid."],
                    ['Messages', 'messages with other users and with Subasti, and anything you send through the Contact form.'],
                ],
                after: ['Information collected as you use the site: your searches, the items you view, favorites, when you log in, notifications sent to you, and technical information such as your IP address and browser type.'],
            },
            {
                h: 'How we use it',
                list: [
                    ['Run the marketplace', 'accounts, listings, auctions, orders, shipping, messages and payouts.'],
                    ['Protect payments', 'hold money in escrow, verify SINPE Móvil transfers and decide claims.'],
                    ['Keep people safe', 'verify identity at sign-up, block bots and repeated attempts, and investigate fraud or abuse.'],
                    ['Keep you informed', 'emails, notifications and, where enabled, text messages about your account, bids and orders.'],
                    ['Improve Subasti', 'understand which items and searches are popular and fix problems.'],
                ],
            },
            {
                h: 'What other people can see',
                list: [
                    ['Everyone', 'your profile name, profile photo, province and city, return policy, listings, the reviews you receive as a seller, and the reviews you write (shown with your profile name and the item\'s title). Your cédula, full name, email and phone are not shown on your public profile.'],
                    ['The other side of a sale', 'a seller sees the buyer\'s profile name and, for shipped orders, the delivery name and address. Buyers and sellers see the messages they exchange.'],
                    ['Subasti staff', 'account, listing, order, payment and payout information, as needed to operate the site, verify payments, resolve claims and give support.'],
                ],
                after: ['A seller\'s reserve price is visible only to that seller and Subasti staff.'],
            },
            {
                h: 'Services that receive your information',
                p: ['We use these providers to run Subasti. Each receives what it needs for its task, and some process data outside Costa Rica.'],
                list: [
                    ['Vercel', 'hosts the website and stores uploaded photos.'],
                    ['Neon', 'hosts our database.'],
                    ['Stripe', 'processes card payments and stores saved cards. You type your card number into Stripe\'s own form; it never reaches our servers.'],
                    ['Verifik', 'receives your cédula number at sign-up and returns the name registered to it.'],
                    ['Cloudflare', 'checks that you are not a bot on the sign-up page, using information about your browser and connection.'],
                    ['Resend', 'delivers our emails, including messages sent through the Contact form.'],
                    ['Twilio', 'delivers text messages, where we have enabled them.'],
                    ['Content delivery networks (Cloudflare cdnjs and Tailwind)', 'serve files the pages need, and so receive your IP address and browser type.'],
                ],
                after: ['We do not sell your personal data, and we do not use advertising or third-party analytics trackers. We may disclose information to authorities when the law requires it.'],
            },
            {
                h: 'Cookies and browser storage',
                list: [
                    ['Login cookie', 'keeps you signed in. It ends after 3 hours without activity.'],
                    ['Browser storage', 'remembers your cart (emptied when you sign out yourself), your last activity (for that automatic sign-out) and that you closed the escrow notice.'],
                    ['Providers', 'Stripe and Cloudflare may set their own cookies or similar storage to prevent fraud and bots.'],
                ],
            },
            {
                h: 'How long we keep it',
                p: ['We keep account information and activity while your account is open. Records of orders, payments, payouts and claims may be kept after an account is closed, as needed to resolve disputes and meet legal obligations. The counters we use to limit repeated attempts store a scrambled form of the IP address and are removed after a few days.'],
            },
            {
                h: 'Security',
                p: ['The site is served over an encrypted connection. Passwords are stored in a scrambled form that cannot be read back, card numbers never reach our servers, and we limit repeated attempts to sign in or look up an ID. No online service can guarantee absolute security.'],
            },
            {
                h: 'Your rights',
                p: ['Under Costa Rica\'s Law No. 8968 on the protection of personal data, you can ask to see the information we hold about you, correct it, or have it deleted, and you can withdraw your consent. Some records may need to be kept as described above.'],
                after: ['You can edit your profile name, phone, photo, return policy, saved addresses and payment methods in your account. For anything else, including closing your account, write to us. If you are not satisfied with our answer, you can complain to PRODHAB, the Costa Rican data protection agency.'],
                contact: 'To make a request, use our',
            },
            {
                h: 'Age',
                p: ['Subasti is for people 18 and older.'],
            },
            {
                h: 'Changes to this policy',
                p: ['If we change how we handle your information we will update this page and the date at the top.'],
            },
        ],
    },
    es: {
        title: 'Política de Privacidad',
        subtitle: 'Última actualización: noviembre 2026. Qué recopila Subasti, para qué, quién lo recibe y sus opciones.',
        contactLink: 'página de Contacto',
        sections: [
            {
                h: 'Información que recopilamos',
                p: ['Información que usted nos da:'],
                list: [
                    ['Cuenta', 'número de cédula, el nombre registrado a esa cédula, nombre de perfil, correo, teléfono, provincia y cantón, contraseña y, si lo desea, foto de perfil y política de devoluciones.'],
                    ['Publicaciones', 'títulos, descripciones, detalles, precios y fotos que usted publica.'],
                    ['Compras y ventas', 'pedidos, pujas, ofertas, reclamos y sus motivos, reseñas que escriba, direcciones de entrega, información de rastreo y el número de SINPE Móvil desde el que indica haber pagado.'],
                    ['Datos guardados', 'direcciones de entrega y números de SINPE Móvil que decida guardar. De las tarjetas guardadas solo conservamos una referencia a su registro en nuestro procesador de pagos.'],
                    ['Pagos a vendedores', 'nombre del titular y la cuenta bancaria (IBAN) o número de SINPE Móvil donde desea recibir su dinero.'],
                    ['Mensajes', 'mensajes con otros usuarios y con Subasti, y lo que envíe por el formulario de Contacto.'],
                ],
                after: ['Información que se recopila al usar el sitio: sus búsquedas, los artículos que ve, favoritos, cuándo inicia sesión, las notificaciones que se le envían y datos técnicos como su dirección IP y tipo de navegador.'],
            },
            {
                h: 'Para qué la usamos',
                list: [
                    ['Operar el mercado', 'cuentas, publicaciones, subastas, pedidos, envíos, mensajes y pagos a vendedores.'],
                    ['Proteger los pagos', 'retener el dinero en depósito, verificar transferencias por SINPE Móvil y resolver reclamos.'],
                    ['Cuidar a las personas', 'verificar la identidad al registrarse, bloquear robots e intentos repetidos, e investigar fraude o abuso.'],
                    ['Mantenerle informado', 'correos, notificaciones y, cuando estén activos, mensajes de texto sobre su cuenta, pujas y pedidos.'],
                    ['Mejorar Subasti', 'entender qué artículos y búsquedas son populares y corregir problemas.'],
                ],
            },
            {
                h: 'Qué pueden ver otras personas',
                list: [
                    ['Todo el público', 'su nombre de perfil, foto, provincia y cantón, política de devoluciones, publicaciones, las reseñas que reciba como vendedor y las que escriba (con su nombre de perfil y el título del artículo). Su cédula, nombre completo, correo y teléfono no se muestran en su perfil público.'],
                    ['La otra parte de una venta', 'el vendedor ve el nombre de perfil del comprador y, en pedidos con envío, el nombre y la dirección de entrega. Comprador y vendedor ven los mensajes que se envían.'],
                    ['Personal de Subasti', 'información de cuentas, publicaciones, pedidos, pagos y cuentas de cobro, en lo necesario para operar el sitio, verificar pagos, resolver reclamos y dar soporte.'],
                ],
                after: ['El precio de reserva de un vendedor solo lo ven ese vendedor y el personal de Subasti.'],
            },
            {
                h: 'Servicios que reciben su información',
                p: ['Usamos estos proveedores para operar Subasti. Cada uno recibe lo que necesita para su tarea, y algunos tratan datos fuera de Costa Rica.'],
                list: [
                    ['Vercel', 'aloja el sitio web y almacena las fotos subidas.'],
                    ['Neon', 'aloja nuestra base de datos.'],
                    ['Stripe', 'procesa los pagos con tarjeta y almacena las tarjetas guardadas. Usted escribe el número en el formulario propio de Stripe; nunca llega a nuestros servidores.'],
                    ['Verifik', 'recibe su número de cédula al registrarse y devuelve el nombre registrado a esa cédula.'],
                    ['Cloudflare', 'comprueba que usted no es un robot en la página de registro, usando información de su navegador y conexión.'],
                    ['Resend', 'entrega nuestros correos, incluidos los mensajes del formulario de Contacto.'],
                    ['Twilio', 'entrega mensajes de texto, cuando los tengamos activos.'],
                    ['Redes de distribución de contenido (Cloudflare cdnjs y Tailwind)', 'sirven archivos que las páginas necesitan, por lo que reciben su dirección IP y tipo de navegador.'],
                ],
                after: ['No vendemos sus datos personales ni usamos rastreadores de publicidad o de analítica de terceros. Podemos entregar información a las autoridades cuando la ley lo exija.'],
            },
            {
                h: 'Cookies y almacenamiento del navegador',
                list: [
                    ['Cookie de sesión', 'mantiene su sesión iniciada. Termina tras 3 horas sin actividad.'],
                    ['Almacenamiento del navegador', 'recuerda su carrito (se vacía cuando usted cierra sesión), su última actividad (para ese cierre automático) y que cerró el aviso del depósito en garantía.'],
                    ['Proveedores', 'Stripe y Cloudflare pueden usar sus propias cookies o almacenamiento similar para prevenir fraude y robots.'],
                ],
            },
            {
                h: 'Cuánto tiempo la conservamos',
                p: ['Conservamos la información de la cuenta y la actividad mientras su cuenta esté abierta. Los registros de pedidos, pagos, pagos a vendedores y reclamos pueden conservarse después de cerrar una cuenta, en lo necesario para resolver disputas y cumplir obligaciones legales. Los contadores que limitan intentos repetidos guardan una forma cifrada de la dirección IP y se eliminan después de unos días.'],
            },
            {
                h: 'Seguridad',
                p: ['El sitio se sirve por una conexión cifrada. Las contraseñas se guardan de forma que no pueden leerse, los números de tarjeta nunca llegan a nuestros servidores y limitamos los intentos repetidos de iniciar sesión o consultar una cédula. Ningún servicio en línea puede garantizar seguridad absoluta.'],
            },
            {
                h: 'Sus derechos',
                p: ['Según la Ley N.º 8968 de protección de la persona frente al tratamiento de sus datos personales, puede pedir ver la información que tenemos sobre usted, corregirla o eliminarla, y retirar su consentimiento. Algunos registros pueden tener que conservarse como se describe arriba.'],
                after: ['Puede editar en su cuenta el nombre de perfil, teléfono, foto, política de devoluciones, direcciones y métodos de pago guardados. Para lo demás, incluido cerrar su cuenta, escríbanos. Si no queda conforme con la respuesta, puede acudir a la PRODHAB, la agencia costarricense de protección de datos.'],
                contact: 'Para hacer una solicitud, use nuestra',
            },
            {
                h: 'Edad',
                p: ['Subasti es para personas de 18 años o más.'],
            },
            {
                h: 'Cambios a esta política',
                p: ['Si cambiamos la forma en que tratamos su información, actualizaremos esta página y la fecha indicada arriba.'],
            },
        ],
    },
};

const PrivacyPage = ({ loc }) => {
    const L = CONTENT[loc === 'en' ? 'en' : 'es'];

    return (
        <StaticPage title={L.title} subtitle={L.subtitle}>
            {L.sections.map(section => (
                <StaticSection key={section.h} heading={section.h}>
                    {(section.p || []).map(text => <p key={text}>{text}</p>)}
                    {section.list && (
                        <ul className="list-disc pl-5 space-y-2">
                            {section.list.map(([label, text]) => (
                                <li key={label}><strong className="text-gray-800">{label}:</strong> {text}</li>
                            ))}
                        </ul>
                    )}
                    {(section.after || []).map(text => <p key={text}>{text}</p>)}
                    {section.contact && (
                        <p>{section.contact} <Link to="/contact" className="text-purple-600 font-semibold hover:underline">{L.contactLink}</Link>.</p>
                    )}
                </StaticSection>
            ))}
        </StaticPage>
    );
};

export default PrivacyPage;
