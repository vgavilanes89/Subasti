import React from 'react';
import { StaticPage, StaticSection } from '../components/StaticPage';

const PrivacyPage = ({ loc }) => {
    const L = loc === 'en' ? {
        title: 'Privacy Policy',
        subtitle: 'Last updated: June 2026. How Subasti collects and uses your information.',
        collect: 'Information We Collect',
        collectText: 'We collect account details (name, email, phone, cédula for verification), listing content, transaction data, and technical logs such as IP address and browser type when you use the site.',
        use: 'How We Use It',
        useText: 'We use your data to operate the marketplace, process orders, prevent fraud, improve the service, and communicate with you about your account or support requests.',
        share: 'Sharing',
        shareText: 'We do not sell your personal data. We may share information with payment processors, shipping partners, or authorities when required by law.',
        security: 'Security',
        securityText: 'We apply reasonable technical and organizational measures to protect your data. No online service can guarantee absolute security.',
        rights: 'Your Rights',
        rightsText: 'You may request access, correction, or deletion of your personal data by contacting us. You can update much of your profile information directly in your account settings.',
        contact: 'Contact',
        contactText: 'Privacy questions:',
    } : {
        title: 'Política de Privacidad',
        subtitle: 'Última actualización: junio 2026. Cómo Subasti recopila y usa su información.',
        collect: 'Información que Recopilamos',
        collectText: 'Recopilamos datos de cuenta (nombre, correo, teléfono, cédula para verificación), contenido de publicaciones, datos de transacciones y registros técnicos como dirección IP y tipo de navegador al usar el sitio.',
        use: 'Cómo la Usamos',
        useText: 'Usamos sus datos para operar el mercado, procesar pedidos, prevenir fraude, mejorar el servicio y comunicarnos sobre su cuenta o solicitudes de soporte.',
        share: 'Compartir Información',
        shareText: 'No vendemos sus datos personales. Podemos compartir información con procesadores de pago, socios de envío o autoridades cuando la ley lo exija.',
        security: 'Seguridad',
        securityText: 'Aplicamos medidas técnicas y organizativas razonables para proteger sus datos. Ningún servicio en línea puede garantizar seguridad absoluta.',
        rights: 'Sus Derechos',
        rightsText: 'Puede solicitar acceso, corrección o eliminación de sus datos personales contactándonos. Puede actualizar gran parte de su perfil directamente en la configuración de cuenta.',
        contact: 'Contacto',
        contactText: 'Preguntas sobre privacidad:',
    };

    return (
        <StaticPage title={L.title} subtitle={L.subtitle}>
            <StaticSection heading={L.collect}><p>{L.collectText}</p></StaticSection>
            <StaticSection heading={L.use}><p>{L.useText}</p></StaticSection>
            <StaticSection heading={L.share}><p>{L.shareText}</p></StaticSection>
            <StaticSection heading={L.security}><p>{L.securityText}</p></StaticSection>
            <StaticSection heading={L.rights}><p>{L.rightsText}</p></StaticSection>
            <StaticSection heading={L.contact}>
                <p>
                    {L.contactText}{' '}
                    <a href="mailto:privacy@subasti.com" className="text-purple-600 font-semibold hover:underline">privacy@subasti.com</a>
                </p>
            </StaticSection>
        </StaticPage>
    );
};

export default PrivacyPage;
