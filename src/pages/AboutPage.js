import React from 'react';
import { Link } from 'react-router-dom';
import { escrowPolicySteps } from '../data/escrow';

const AboutPage = ({ loc }) => {
    const en = loc === 'en';

    const L = en ? {
        title: 'About Subasti',
        subtitle: "Costa Rica's marketplace for buying, selling and auctioning with confidence.",
        browse: 'Browse items',
        sell: 'Start selling',

        storyHeading: 'Our story',
        storyText: 'Subasti started from a simple idea: buying and selling between people in Costa Rica should feel safe. Whether you pay in colones or dollars, ship across the country or meet for a local pickup, the money stays protected until the item arrives as described.',

        howHeading: 'How it works',
        buyersHeading: 'For buyers',
        buyers: [
            { t: 'Find it', d: 'Browse or search, then buy at a fixed price or bid in an auction.' },
            { t: 'Pay securely', d: 'Pay by card or SINPE Móvil. Subasti holds your payment; the seller does not get it yet.' },
            { t: 'Receive and confirm', d: 'When the item arrives, confirm it. You have 48 hours to release the funds or file a claim.' },
        ],
        sellersHeading: 'For sellers',
        sellers: [
            { t: 'List it', d: 'Add photos and details, set a price or start an auction, and choose which payment methods you accept.' },
            { t: 'Ship within 48 hours', d: 'Once the buyer has paid, send the item (or get it ready for pickup) within 48 hours.' },
            { t: 'Get paid', d: 'When the buyer releases the funds, or the protection window ends, we pay you to your bank account (IBAN) or SINPE Móvil.' },
        ],

        escrowHeading: 'Secure escrow, step by step',
        escrowIntro: 'Every purchase on Subasti follows the same protected path:',

        waysHeading: 'Three ways to buy and sell',
        ways: [
            { t: 'Fixed price', d: 'See the price, add to cart and check out. Quick and simple for everyday items.' },
            { t: 'Auctions', d: 'Bids must beat the current bid by a minimum amount, and sellers can set an optional reserve price. A bid in the final minute extends the auction by 2 minutes, so nobody wins by sniping. Some auctions also offer Buy Now.' },
            { t: 'Pickup or shipping', d: 'Sellers choose shipping, local pickup or both. You can message the seller before you buy.' },
        ],

        payHeading: 'Payments in colones or dollars',
        payText: 'Listings are priced in colones (₡) or dollars ($). Pay by card or SINPE Móvil, depending on what the seller accepts. Sellers choose their accepted payment methods for every listing, and receive their earnings by bank transfer (IBAN) or SINPE Móvil.',

        trustHeading: 'Built for trust',
        trust: [
            'Accounts are created with a Costa Rican cédula number, which is checked when you sign up.',
            'Payments are held in escrow until delivery is confirmed or the 48-hour protection window ends.',
            "If an item isn't as described, you can file a claim and our team reviews it. Approved claims are refunded to you.",
            'Sellers cannot bid on or buy their own items, and public profiles show a profile name, not your full name.',
            'Message buyers and sellers inside Subasti, with email notifications when someone writes to you.',
        ],

        helpHeading: 'Questions?',
        helpText: "We're happy to help.",
        help: 'Help Center',
        faq: 'FAQ',
        contact: 'Contact us',
    } : {
        title: 'Sobre Subasti',
        subtitle: 'El mercado de Costa Rica para comprar, vender y subastar con confianza.',
        browse: 'Explorar artículos',
        sell: 'Empezar a vender',

        storyHeading: 'Nuestra historia',
        storyText: 'Subasti nació de una idea sencilla: comprar y vender entre personas en Costa Rica debe sentirse seguro. Ya sea que pagues en colones o dólares, envíes a cualquier parte del país o te reúnas para una recogida local, el dinero queda protegido hasta que el artículo llega tal como se describió.',

        howHeading: 'Cómo funciona',
        buyersHeading: 'Para compradores',
        buyers: [
            { t: 'Encuéntralo', d: 'Explora o busca, y compra a precio fijo o puja en una subasta.' },
            { t: 'Paga de forma segura', d: 'Paga con tarjeta o SINPE Móvil. Subasti retiene tu pago; el vendedor aún no lo recibe.' },
            { t: 'Recibe y confirma', d: 'Cuando llegue el artículo, confírmalo. Tienes 48 horas para liberar los fondos o presentar un reclamo.' },
        ],
        sellersHeading: 'Para vendedores',
        sellers: [
            { t: 'Publícalo', d: 'Agrega fotos y detalles, define un precio o inicia una subasta, y elige los métodos de pago que aceptas.' },
            { t: 'Envía en 48 horas', d: 'Una vez que el comprador pague, envía el artículo (o prepáralo para recogida) dentro de 48 horas.' },
            { t: 'Recibe tu pago', d: 'Cuando el comprador libere los fondos, o termine la ventana de protección, te pagamos a tu cuenta bancaria (IBAN) o SINPE Móvil.' },
        ],

        escrowHeading: 'Depósito en garantía, paso a paso',
        escrowIntro: 'Cada compra en Subasti sigue el mismo camino protegido:',

        waysHeading: 'Tres formas de comprar y vender',
        ways: [
            { t: 'Precio fijo', d: 'Ves el precio, agregas al carrito y pagas. Rápido y sencillo para artículos de todos los días.' },
            { t: 'Subastas', d: 'Las pujas deben superar la puja actual por un monto mínimo, y los vendedores pueden fijar un precio de reserva opcional. Una puja en el último minuto extiende la subasta 2 minutos, así nadie gana pujando al último segundo. Algunas subastas también ofrecen Compra Inmediata.' },
            { t: 'Recogida o envío', d: 'Los vendedores eligen envío, recogida local o ambos. Puedes escribirle al vendedor antes de comprar.' },
        ],

        payHeading: 'Pagos en colones o dólares',
        payText: 'Los artículos se publican en colones (₡) o dólares ($). Paga con tarjeta o SINPE Móvil, según lo que acepte el vendedor. Los vendedores eligen los métodos de pago de cada publicación y reciben sus ganancias por transferencia bancaria (IBAN) o SINPE Móvil.',

        trustHeading: 'Hecho para la confianza',
        trust: [
            'Las cuentas se crean con un número de cédula costarricense, que se verifica al registrarte.',
            'Los pagos se retienen en depósito hasta confirmar la entrega o terminar la ventana de protección de 48 horas.',
            'Si un artículo no es como se describió, puedes presentar un reclamo y nuestro equipo lo revisa. Los reclamos aprobados se reembolsan.',
            'Los vendedores no pueden pujar ni comprar sus propios artículos, y los perfiles públicos muestran un nombre de perfil, no tu nombre completo.',
            'Escribe con compradores y vendedores dentro de Subasti, con avisos por correo cuando alguien te escribe.',
        ],

        helpHeading: '¿Preguntas?',
        helpText: 'Con gusto te ayudamos.',
        help: 'Centro de Ayuda',
        faq: 'Preguntas Frecuentes',
        contact: 'Contáctanos',
    };

    const steps = escrowPolicySteps(loc);

    return (
        <div className="about-page">
            <section className="about-hero">
                <h1>{L.title}</h1>
                <p>{L.subtitle}</p>
                <div className="about-hero-actions">
                    <Link to="/" className="about-btn about-btn--gold">{L.browse}</Link>
                    <Link to="/sell" className="about-btn about-btn--light">{L.sell}</Link>
                </div>
            </section>

            <section className="about-card about-story">
                <h2>{L.storyHeading}</h2>
                <p>{L.storyText}</p>
            </section>

            <section>
                <h2 className="about-heading">{L.howHeading}</h2>
                <div className="about-two-col">
                    {[{ h: L.buyersHeading, list: L.buyers }, { h: L.sellersHeading, list: L.sellers }].map(col => (
                        <div key={col.h} className="about-card">
                            <h3>{col.h}</h3>
                            <ol className="about-steps">
                                {col.list.map((s, i) => (
                                    <li key={s.t}>
                                        <span className="about-step-num">{i + 1}</span>
                                        <div>
                                            <strong>{s.t}</strong>
                                            <p>{s.d}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ))}
                </div>
            </section>

            <section className="about-card about-escrow">
                <h2>{L.escrowHeading}</h2>
                <p className="about-lead">{L.escrowIntro}</p>
                <ol className="about-steps">
                    {steps.map((s, i) => (
                        <li key={s.title}>
                            <span className="about-step-num about-step-num--gold">{i + 1}</span>
                            <div>
                                <strong>{s.title}</strong>
                                <p>{s.text}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section>
                <h2 className="about-heading">{L.waysHeading}</h2>
                <div className="about-three-col">
                    {L.ways.map(w => (
                        <div key={w.t} className="about-card">
                            <h3>{w.t}</h3>
                            <p>{w.d}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="about-card">
                <h2>{L.payHeading}</h2>
                <p>{L.payText}</p>
            </section>

            <section className="about-card">
                <h2>{L.trustHeading}</h2>
                <ul className="about-checks">
                    {L.trust.map(t => <li key={t}>{t}</li>)}
                </ul>
            </section>

            <section className="about-help">
                <div>
                    <h2>{L.helpHeading}</h2>
                    <p>{L.helpText}</p>
                </div>
                <div className="about-hero-actions">
                    <Link to="/help" className="about-btn about-btn--light">{L.help}</Link>
                    <Link to="/faq" className="about-btn about-btn--light">{L.faq}</Link>
                    <Link to="/contact" className="about-btn about-btn--gold">{L.contact}</Link>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
