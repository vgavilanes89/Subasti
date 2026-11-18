// Help Center content — the single source for the Help Center AND the FAQ, so
// the two can never contradict each other. Every string is { en, es }.
//
// An answer is a list of blocks:
//   a plain {en,es}            -> a paragraph
//   { list: [{en,es}, ...] }   -> bullets
//   { steps: [{en,es}, ...] }  -> numbered steps
//   { escrow: true }           -> the shared escrow steps (src/data/escrow.js)
// `links` are shown under the answer. `kw` are extra search words.
import { escrowPolicySteps } from './escrow';

const T = (en, es) => ({ en, es });

export const HELP_TOPICS = [
    {
        id: 'buying',
        title: T('Buying', 'Comprar'),
        blurb: T('Finding, paying for and receiving items', 'Encontrar, pagar y recibir artículos'),
        articles: [
            {
                id: 'buy-find',
                q: T('How do I find and buy something?', '¿Cómo encuentro y compro algo?'),
                a: [
                    T('Browse the home page or search by keyword and category. Open a listing to see the photos, details, seller and return policy.',
                      'Explora la página principal o busca por palabra clave y categoría. Abre una publicación para ver fotos, detalles, vendedor y política de devoluciones.'),
                    { list: [
                        T('Fixed price: add it to your cart and check out.', 'Precio fijo: agrégalo al carrito y paga.'),
                        T('Auction: place a bid, or use Buy Now if the seller offers it.', 'Subasta: haz una puja, o usa Compra Inmediata si el vendedor la ofrece.'),
                    ] },
                ],
                links: [{ to: '/', label: T('Browse items', 'Explorar artículos') }, { to: '/cart', label: T('My cart', 'Mi carrito') }],
                kw: T('search cart checkout buy now', 'buscar carrito comprar'),
            },
            {
                id: 'buy-pay',
                q: T('What payment methods can I use?', '¿Qué métodos de pago puedo usar?'),
                a: [
                    T('Card and SINPE Móvil. Each seller chooses which of the two they accept for each listing, and checkout only offers the methods every item in your cart accepts. If your items have no method in common, buy them in separate orders.',
                      'Tarjeta y SINPE Móvil. Cada vendedor elige cuáles acepta en cada publicación, y el pago solo ofrece los métodos que aceptan todos los artículos de tu carrito. Si no tienen ninguno en común, cómpralos en pedidos separados.'),
                    T('Your money is held by Subasti in escrow until you receive the item.', 'Tu dinero queda retenido por Subasti en depósito hasta que recibas el artículo.'),
                ],
                links: [{ to: '/profile?tab=wallet', label: T('Saved payment methods', 'Métodos de pago guardados') }],
                kw: T('card sinpe movil credit debit accepted', 'tarjeta sinpe movil credito debito aceptan'),
            },
            {
                id: 'buy-saved',
                q: T('Can I save my address and payment methods?', '¿Puedo guardar mi dirección y mis métodos de pago?'),
                a: [
                    T('Yes. Go to Profile → Addresses & Payments:', 'Sí. Ve a Perfil → Direcciones y Pagos:'),
                    { list: [
                        T('Addresses: save up to 10 and pick a default, which is selected automatically at checkout.', 'Direcciones: guarda hasta 10 y elige una predeterminada, que se selecciona sola al pagar.'),
                        T('Cards: saved securely by Stripe. Subasti never sees or stores your card number. Remove a card any time.', 'Tarjetas: las guarda Stripe de forma segura. Subasti nunca ve ni almacena tu número de tarjeta. Elimínala cuando quieras.'),
                        T('SINPE Móvil numbers: the number you pay from, filled in for you at checkout.', 'Números de SINPE Móvil: el número desde el que pagas, que se completa solo al pagar.'),
                    ] },
                ],
                links: [{ to: '/profile?tab=wallet', label: T('Addresses & Payments', 'Direcciones y Pagos') }],
                kw: T('saved address card wallet default', 'direccion guardada tarjeta predeterminada'),
            },
            {
                id: 'buy-shipping',
                q: T('Shipping or pickup?', '¿Envío o recogida?'),
                a: [
                    T('Sellers choose shipping, local pickup or both for each listing. Shipping costs are shown at checkout. For pickup, message the seller after buying to arrange it.',
                      'Los vendedores eligen envío, recogida local o ambos en cada publicación. Los costos de envío se muestran al pagar. Para recogida, escríbele al vendedor después de comprar para coordinarla.'),
                ],
                links: [{ to: '/profile?tab=messages', label: T('My messages', 'Mis mensajes') }],
                kw: T('delivery local pickup', 'entrega recoger'),
            },
            {
                id: 'buy-received',
                q: T('I received my item. What do I do now?', 'Recibí mi artículo. ¿Qué hago ahora?'),
                a: [
                    T('Go to Profile → Buying and mark the order as received. You then have 48 hours to release the funds to the seller if you are happy, or file a claim if the item was not as described.',
                      'Ve a Perfil → Compras y marca el pedido como recibido. Luego tienes 48 horas para liberar los fondos al vendedor si estás conforme, o presentar un reclamo si el artículo no era como se describió.'),
                ],
                links: [{ to: '/profile?tab=buying', label: T('My purchases', 'Mis compras') }],
                kw: T('confirm receipt release funds', 'confirmar recibido liberar fondos'),
            },
            {
                id: 'buy-contact',
                q: T('How do I contact a seller?', '¿Cómo contacto a un vendedor?'),
                a: [
                    T('Open the item page and use Message seller. All your conversations are in Profile → Messages, where you can open or collapse each one. You also get an email when someone writes to you.',
                      'Abre la página del artículo y usa Mensaje al vendedor. Todas tus conversaciones están en Perfil → Mensajes, donde puedes abrir o cerrar cada una. También recibes un correo cuando alguien te escribe.'),
                    T('For problems with Subasti itself, use the Contact page.', 'Para problemas con Subasti, usa la página de Contacto.'),
                ],
                links: [{ to: '/profile?tab=messages', label: T('My messages', 'Mis mensajes') }, { to: '/contact', label: T('Contact us', 'Contáctanos') }],
                kw: T('message chat seller', 'mensaje chat vendedor'),
            },
        ],
    },
    {
        id: 'auctions',
        title: T('Auctions', 'Subastas'),
        blurb: T('Bidding, reserve prices and winning', 'Pujas, precio de reserva y ganar'),
        articles: [
            {
                id: 'auc-how',
                q: T('How do auctions work?', '¿Cómo funcionan las subastas?'),
                a: [
                    { list: [
                        T('Each bid must beat the current bid by a minimum amount, about 5% (never less than ₡10 or $0.05). The minimum is shown on the item page.', 'Cada puja debe superar la actual por un monto mínimo, cerca del 5% (nunca menos de ₡10 o $0,05). El mínimo se muestra en la página del artículo.'),
                        T('When the timer ends, the highest bid wins, as long as the reserve price (if the seller set one) was reached.', 'Cuando termina el tiempo, gana la puja más alta, siempre que se alcance el precio de reserva (si el vendedor puso uno).'),
                        T('A bid in the last minute extends the auction by 2 minutes, so nobody wins by bidding at the very last second.', 'Una puja en el último minuto extiende la subasta 2 minutos, así nadie gana pujando al último segundo.'),
                        T('You cannot bid on your own listing.', 'No puedes pujar en tu propia publicación.'),
                    ] },
                ],
                kw: T('bid minimum increment anti snipe', 'pujar minimo incremento'),
            },
            {
                id: 'auc-reserve',
                q: T('What are a reserve price and Buy Now?', '¿Qué son el precio de reserva y la Compra Inmediata?'),
                a: [
                    { list: [
                        T('Reserve price: the lowest price the seller will accept. If bidding ends below it, there is no sale.', 'Precio de reserva: el precio más bajo que el vendedor acepta. Si las pujas terminan por debajo, no hay venta.'),
                        T('Buy Now: some auctions let you skip the bidding and buy right away at a fixed price. Buying it ends the auction.', 'Compra Inmediata: algunas subastas te dejan comprar de inmediato a un precio fijo, sin pujar. Al comprarlo, la subasta termina.'),
                    ] },
                ],
                kw: T('reserve buy now', 'reserva compra inmediata'),
            },
            {
                id: 'auc-track',
                q: T('How do I follow my bids?', '¿Cómo sigo mis pujas?'),
                a: [
                    T('Profile → Buying → My Bids lists every auction you bid on, with your status: You\'re winning, Outbid, You won or Not won. Active auctions show a countdown.',
                      'Perfil → Compras → Mis Pujas muestra todas las subastas en las que pujaste, con tu estado: Vas ganando, Te superaron, Ganaste o No ganada. Las subastas activas muestran una cuenta regresiva.'),
                    T('You are notified (bell icon and email) when someone outbids you, and again when an auction ends and you did not win.',
                      'Recibes un aviso (campana y correo) cuando alguien te supera, y otro cuando una subasta termina y no la ganaste.'),
                ],
                links: [{ to: '/profile?tab=buying', label: T('My bids', 'Mis pujas') }],
                kw: T('outbid notification winning lost', 'superaron notificacion ganando perdida'),
            },
            {
                id: 'auc-won',
                q: T('I won an auction. What happens next?', 'Gané una subasta. ¿Qué pasa ahora?'),
                a: [
                    T('Your order appears in Profile → Buying under "Payment required". Pay within 48 hours, by card or SINPE Móvil if the seller accepts it. Your payment is then held in escrow like any other purchase.',
                      'Tu pedido aparece en Perfil → Compras en "Pago requerido". Paga dentro de 48 horas, con tarjeta o SINPE Móvil si el vendedor lo acepta. Tu pago queda en depósito como cualquier otra compra.'),
                    T('If you do not pay, the seller can cancel the order.', 'Si no pagas, el vendedor puede cancelar el pedido.'),
                ],
                links: [{ to: '/profile?tab=buying', label: T('My purchases', 'Mis compras') }],
                kw: T('pay won winner', 'pagar ganador ganada'),
            },
        ],
    },
    {
        id: 'selling',
        title: T('Selling', 'Vender'),
        blurb: T('Listing, shipping and getting paid', 'Publicar, enviar y recibir tu pago'),
        articles: [
            {
                id: 'sell-list',
                q: T('How do I list an item?', '¿Cómo publico un artículo?'),
                a: [
                    T('Log in and click Sell. You will add:', 'Inicia sesión y haz clic en Vender. Agregarás:'),
                    { list: [
                        T('Up to 5 photos, a title and a description, plus details for the category.', 'Hasta 5 fotos, un título y una descripción, además de detalles de la categoría.'),
                        T('A price in colones or dollars, as a fixed price or an auction (starting bid, optional reserve, optional Buy Now, duration).', 'Un precio en colones o dólares, a precio fijo o como subasta (puja inicial, reserva opcional, Compra Inmediata opcional, duración).'),
                        T('Shipping, local pickup or both.', 'Envío, recogida local o ambos.'),
                        T('Which payment methods you accept (at least one).', 'Qué métodos de pago aceptas (al menos uno).'),
                    ] },
                    T('Buyers see the return policy you set in your profile.', 'Los compradores ven la política de devoluciones que definas en tu perfil.'),
                ],
                links: [{ to: '/sell', label: T('Start selling', 'Empezar a vender') }],
                kw: T('create listing photos price', 'crear publicacion fotos precio'),
            },
            {
                id: 'sell-sale',
                q: T('Someone bought my item. What do I do?', 'Alguien compró mi artículo. ¿Qué hago?'),
                a: [
                    { steps: [
                        T('Wait for the "Funds secured" notice. For card payments this is immediate; for SINPE Móvil it comes after Subasti verifies the transfer. Do not ship before that.', 'Espera el aviso de "Fondos asegurados". Con tarjeta es inmediato; con SINPE Móvil llega después de que Subasti verifica la transferencia. No envíes antes.'),
                        T('Ship the item, or get it ready for pickup, within 48 hours.', 'Envía el artículo, o prepáralo para recogida, dentro de 48 horas.'),
                        T('In Profile → Selling, mark it as shipped (with tracking and the expected delivery time) or ready for pickup.', 'En Perfil → Ventas, márcalo como enviado (con rastreo y plazo de entrega) o listo para recoger.'),
                    ] },
                ],
                links: [{ to: '/profile?tab=selling', label: T('My sales', 'Mis ventas') }],
                kw: T('ship shipping tracking order sold', 'enviar rastreo pedido vendido'),
            },
            {
                id: 'sell-cancel',
                q: T('A buyer has not paid. Can I cancel?', 'Un comprador no ha pagado. ¿Puedo cancelar?'),
                a: [
                    T('Yes. You can cancel any order that has not been paid, at any time, from Profile → Selling. The buyer is notified and, for regular listings, the item goes back into stock. You are never required to ship before payment is secured.',
                      'Sí. Puedes cancelar cualquier pedido que no se haya pagado, en cualquier momento, desde Perfil → Ventas. El comprador recibe un aviso y, en publicaciones normales, el artículo vuelve al inventario. Nunca tienes que enviar antes de que el pago esté asegurado.'),
                ],
                links: [{ to: '/profile?tab=selling', label: T('My sales', 'Mis ventas') }],
                kw: T('unpaid cancel order not paid', 'sin pagar cancelar pedido'),
            },
            {
                id: 'sell-payout',
                q: T('How and when do I get paid?', '¿Cómo y cuándo recibo mi pago?'),
                a: [
                    { steps: [
                        T('Add your payout account in Profile → Selling: a bank account (IBAN) or a SINPE Móvil number. Without it, Subasti cannot pay you.', 'Agrega tu cuenta para recibir pagos en Perfil → Ventas: una cuenta bancaria (IBAN) o un número de SINPE Móvil. Sin ella, Subasti no puede pagarte.'),
                        T('The money is released to you when the buyer releases the funds, when the 48-hour review window ends with no claim, or earlier if you and the buyer settle it. Subasti handles the release.', 'El dinero se libera a tu favor cuando el comprador libera los fondos, cuando termina la ventana de revisión de 48 horas sin reclamo, o antes si tú y el comprador lo resuelven. Subasti se encarga de la liberación.'),
                        T('Subasti then pays the released amount to your payout account.', 'Luego Subasti paga el monto liberado a tu cuenta.'),
                    ] },
                ],
                links: [{ to: '/profile?tab=selling', label: T('Add my payout account', 'Agregar mi cuenta de pagos') }],
                kw: T('payout iban sinpe earnings money', 'pago iban sinpe ganancias dinero'),
            },
            {
                id: 'sell-methods',
                q: T('Which payment methods can I accept?', '¿Qué métodos de pago puedo aceptar?'),
                a: [
                    T('You choose, for every listing, card, SINPE Móvil or both (at least one). Buyers only see the methods you accept for that item.',
                      'Tú eliges, en cada publicación, tarjeta, SINPE Móvil o ambos (al menos uno). Los compradores solo ven los métodos que aceptas para ese artículo.'),
                ],
                kw: T('accept card sinpe listing', 'aceptar tarjeta sinpe publicacion'),
            },
            {
                id: 'sell-own',
                q: T('Can I buy or bid on my own item?', '¿Puedo comprar o pujar en mi propio artículo?'),
                a: [T('No. Sellers cannot buy or bid on their own listings.', 'No. Los vendedores no pueden comprar ni pujar en sus propias publicaciones.')],
                kw: T('own item', 'propio articulo'),
            },
        ],
    },
    {
        id: 'payments',
        title: T('Payments', 'Pagos'),
        blurb: T('Card, SINPE Móvil and currencies', 'Tarjeta, SINPE Móvil y monedas'),
        articles: [
            {
                id: 'pay-sinpe',
                q: T('How do I pay with SINPE Móvil?', '¿Cómo pago con SINPE Móvil?'),
                a: [
                    { steps: [
                        T('At checkout choose SINPE Móvil, enter the number you will pay from, and place the order.', 'Al pagar elige SINPE Móvil, escribe el número desde el que pagarás y haz el pedido.'),
                        T('You will see Subasti\'s SINPE Móvil number, the exact amount and a payment reference such as SUB-7K3Q9X.', 'Verás el número de SINPE Móvil de Subasti, el monto exacto y una referencia de pago como SUB-7K3Q9X.'),
                        T('In SINPE Móvil, send that amount to that number and write the reference in the transfer description.', 'En SINPE Móvil, envía ese monto a ese número y escribe la referencia en la descripción de la transferencia.'),
                        T('Press "I\'ve made the transfer". Subasti checks that the money arrived.', 'Presiona "Ya hice la transferencia". Subasti verifica que el dinero llegó.'),
                    ] },
                    T('Your order is not paid until Subasti confirms the transfer. Once confirmed, your payment is held in escrow and the seller is told to ship. If we cannot find your transfer, we notify you so you can fix it. You can come back to the payment details any time from Profile → Buying.',
                      'Tu pedido no se considera pagado hasta que Subasti confirme la transferencia. Al confirmarla, tu pago queda en depósito y se le avisa al vendedor que envíe. Si no encontramos tu transferencia, te avisamos para que lo corrijas. Puedes volver a los datos del pago cuando quieras desde Perfil → Compras.'),
                ],
                links: [{ to: '/profile?tab=buying', label: T('My purchases', 'Mis compras') }],
                kw: T('sinpe movil transfer reference verify', 'sinpe movil transferencia referencia verificar'),
            },
            {
                id: 'pay-card',
                q: T('Is paying by card safe?', '¿Es seguro pagar con tarjeta?'),
                a: [
                    T('Card payments are processed by Stripe. Your card number goes straight to Stripe and is never seen or stored by Subasti. You can save a card for next time, and remove it whenever you like, in Profile → Addresses & Payments.',
                      'Los pagos con tarjeta los procesa Stripe. El número de tu tarjeta va directo a Stripe y Subasti nunca lo ve ni lo almacena. Puedes guardar una tarjeta para la próxima vez y eliminarla cuando quieras en Perfil → Direcciones y Pagos.'),
                ],
                links: [{ to: '/profile?tab=wallet', label: T('Addresses & Payments', 'Direcciones y Pagos') }],
                kw: T('stripe credit debit secure', 'stripe credito debito seguro'),
            },
            {
                id: 'pay-currency',
                q: T('Colones or dollars?', '¿Colones o dólares?'),
                a: [
                    T('Each listing is priced in colones (₡) or dollars ($) by the seller, and checkout shows totals in that currency. A card payment covers one currency per order, so if your cart mixes both, buy them separately.',
                      'Cada publicación tiene precio en colones (₡) o dólares ($) según el vendedor, y el pago muestra los totales en esa moneda. Un pago con tarjeta cubre una moneda por pedido, así que si tu carrito mezcla ambas, cómpralas por separado.'),
                ],
                kw: T('crc usd currency colones dollars', 'colones dolares moneda'),
            },
            {
                id: 'pay-missing',
                q: T('My payment is not showing as received', 'Mi pago no aparece como recibido'),
                a: [
                    { list: [
                        T('Card: the payment shows up right away. If you were charged but see no order, contact us with the time and amount.', 'Tarjeta: el pago aparece de inmediato. Si te cobraron pero no ves el pedido, contáctanos con la hora y el monto.'),
                        T('SINPE Móvil: Subasti verifies each transfer by hand, so it is not instant. Make sure you pressed "I\'ve made the transfer" and used the right amount and reference. If it still is not confirmed, contact us and include your reference.', 'SINPE Móvil: Subasti verifica cada transferencia manualmente, así que no es instantáneo. Asegúrate de haber presionado "Ya hice la transferencia" y de usar el monto y la referencia correctos. Si aún no se confirma, contáctanos e incluye tu referencia.'),
                    ] },
                ],
                links: [{ to: '/contact', label: T('Contact us', 'Contáctanos') }],
                kw: T('payment pending not confirmed verifying', 'pago pendiente no confirmado verificando'),
            },
        ],
    },
    {
        id: 'escrow',
        title: T('Escrow & claims', 'Depósito y reclamos'),
        blurb: T('How your money is protected', 'Cómo se protege tu dinero'),
        articles: [
            {
                id: 'esc-how',
                q: T('How does secure escrow work?', '¿Cómo funciona el depósito en garantía?'),
                a: [{ escrow: true }],
                kw: T('escrow protection held funds', 'deposito garantia proteccion fondos retenidos'),
            },
            {
                id: 'esc-claim',
                q: T('The item is not as described. How do I file a claim?', 'El artículo no es como se describió. ¿Cómo presento un reclamo?'),
                a: [
                    { steps: [
                        T('Message the seller first; many problems are solved that way.', 'Escríbele primero al vendedor; muchos problemas se resuelven así.'),
                        T('Within 48 hours of receiving the item, go to Profile → Buying and choose "File a claim" on that order, then explain what is wrong.', 'Dentro de 48 horas de recibir el artículo, ve a Perfil → Compras y elige "Presentar reclamo" en ese pedido, y explica qué está mal.'),
                        T('Subasti reviews the claim. If it is approved, the money is refunded to you; if not, it is released to the seller.', 'Subasti revisa el reclamo. Si se aprueba, el dinero se te reembolsa; si no, se libera al vendedor.'),
                    ] },
                    T('Once you release the funds, or the 48 hours pass without a claim, the sale is final.', 'Una vez que liberas los fondos, o pasan las 48 horas sin reclamo, la venta es definitiva.'),
                ],
                links: [{ to: '/profile?tab=buying', label: T('My purchases', 'Mis compras') }],
                kw: T('claim refund problem not as described fraud dispute', 'reclamo reembolso problema fraude disputa'),
            },
            {
                id: 'esc-return',
                q: T('What is the return policy?', '¿Cuál es la política de devoluciones?'),
                a: [
                    T('Each seller sets their own return policy, shown on their item pages under "Return Policy". If a seller has not set one, none is shown. Always check it before you buy, and message the seller if you are unsure.',
                      'Cada vendedor define su propia política de devoluciones, que se muestra en sus artículos bajo "Política de Devoluciones". Si un vendedor no la ha definido, no se muestra ninguna. Revísala siempre antes de comprar y escríbele al vendedor si tienes dudas.'),
                ],
                kw: T('return refund policy', 'devolucion politica'),
            },
            {
                id: 'esc-release',
                q: T('When does the seller get the money?', '¿Cuándo recibe el dinero el vendedor?'),
                a: [
                    T('When you release the funds after receiving the item, when the 48-hour review window ends with no claim, or earlier if you and the seller agree the sale is settled. Subasti handles every release and then pays the seller.',
                      'Cuando liberas los fondos tras recibir el artículo, cuando termina la ventana de revisión de 48 horas sin reclamo, o antes si tú y el vendedor acuerdan que la venta está resuelta. Subasti se encarga de cada liberación y luego le paga al vendedor.'),
                ],
                kw: T('release funds seller paid', 'liberar fondos vendedor pago'),
            },
        ],
    },
    {
        id: 'account',
        title: T('Account & security', 'Cuenta y seguridad'),
        blurb: T('Sign-in, profile and notifications', 'Acceso, perfil y notificaciones'),
        articles: [
            {
                id: 'acc-cedula',
                q: T('Why do you ask for my cédula?', '¿Por qué piden mi cédula?'),
                a: [
                    T('Accounts are created with a Costa Rican cédula number, which is looked up when you sign up. This keeps buyers and sellers real people. Your cédula and full name are never shown on your public profile; others only see your profile name.',
                      'Las cuentas se crean con un número de cédula costarricense, que se consulta al registrarte. Así los compradores y vendedores son personas reales. Tu cédula y nombre completo nunca se muestran en tu perfil público; los demás solo ven tu nombre de perfil.'),
                    T('If the lookup is unavailable when you sign up, try again a little later or contact us.', 'Si la consulta no está disponible al registrarte, inténtalo de nuevo más tarde o contáctanos.'),
                ],
                links: [{ to: '/signup', label: T('Sign up', 'Registrarse') }],
                kw: T('signup register id verification', 'registro identificacion verificacion'),
            },
            {
                id: 'acc-password',
                q: T('I forgot my password', 'Olvidé mi contraseña'),
                a: [
                    T('On the log-in page choose "Forgot your password?" and enter your email. We send a link that works for 1 hour and only once. Opening it lets you choose a new password.',
                      'En la página de inicio de sesión elige "¿Olvidaste tu contraseña?" e ingresa tu correo. Te enviamos un enlace que funciona por 1 hora y una sola vez. Al abrirlo puedes elegir una nueva contraseña.'),
                ],
                links: [{ to: '/forgot-password', label: T('Reset my password', 'Restablecer mi contraseña') }],
                kw: T('reset password login', 'restablecer contrasena iniciar sesion'),
            },
            {
                id: 'acc-logout',
                q: T('Why was I signed out?', '¿Por qué se cerró mi sesión?'),
                a: [
                    T('For your security, you are signed out after 3 hours of inactivity. Just log in again; your cart, favorites and orders are kept.',
                      'Por tu seguridad, tu sesión se cierra tras 3 horas de inactividad. Solo inicia sesión de nuevo; tu carrito, favoritos y pedidos se conservan.'),
                ],
                kw: T('session timeout logout inactive', 'sesion inactividad cerrar'),
            },
            {
                id: 'acc-profile',
                q: T('How do I change my profile name, phone or photo?', '¿Cómo cambio mi nombre de perfil, teléfono o foto?'),
                a: [
                    T('Go to Profile → Overview. Use Edit to change your profile name (letters and numbers only), phone and return policy, and the photo button to add or remove a profile picture.',
                      'Ve a Perfil → Resumen. Usa Editar para cambiar tu nombre de perfil (solo letras y números), teléfono y política de devoluciones, y el botón de foto para agregar o quitar tu imagen de perfil.'),
                ],
                links: [{ to: '/profile', label: T('My profile', 'Mi perfil') }],
                kw: T('avatar picture edit username', 'avatar foto editar usuario'),
            },
            {
                id: 'acc-notify',
                q: T('How do notifications work?', '¿Cómo funcionan las notificaciones?'),
                a: [
                    T('The bell icon shows what needs your attention: outbid and ended auctions, payments, shipping updates and new messages. Important ones also arrive by email. See them all in Profile → Messages.',
                      'La campana muestra lo que necesita tu atención: subastas superadas o terminadas, pagos, envíos y mensajes nuevos. Las importantes también llegan por correo. Verlas todas en Perfil → Mensajes.'),
                ],
                links: [{ to: '/profile?tab=messages', label: T('My messages', 'Mis mensajes') }],
                kw: T('bell email alerts', 'campana correo alertas'),
            },
            {
                id: 'acc-language',
                q: T('Can I change the language?', '¿Puedo cambiar el idioma?'),
                a: [T('Yes. Use the EN / ES button at the top of any page to switch between English and Spanish.', 'Sí. Usa el botón EN / ES en la parte superior de cualquier página para cambiar entre inglés y español.')],
                kw: T('english spanish idioma', 'ingles espanol idioma'),
            },
        ],
    },
];

// Articles the FAQ page shows, in order.
export const FAQ_ARTICLE_IDS = ['esc-how', 'buy-pay', 'pay-sinpe', 'pay-currency', 'auc-how', 'sell-sale', 'sell-cancel', 'esc-claim', 'buy-contact'];

export const allArticles = () => HELP_TOPICS.flatMap(topic => topic.articles.map(article => ({ ...article, topicId: topic.id })));

export const getArticle = (id) => allArticles().find(a => a.id === id) || null;

// Plain text of an answer, for searching.
export const answerText = (article, loc) => article.a.map((block) => {
    if (block.escrow) return escrowPolicySteps(loc).map(s => `${s.title} ${s.text}`).join(' ');
    if (block.list || block.steps) return (block.list || block.steps).map(item => item[loc]).join(' ');
    return block[loc];
}).join(' ');
