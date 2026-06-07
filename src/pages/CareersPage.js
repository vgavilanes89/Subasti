import React from 'react';
import { Link } from 'react-router-dom';
import { StaticPage, StaticSection } from '../components/StaticPage';

const CareersPage = ({ loc }) => {
    const L = loc === 'en' ? {
        title: 'Careers at Subasti',
        subtitle: 'Help us build the marketplace Costa Rica deserves.',
        culture: 'Our Culture',
        cultureText: 'We are a small, fast-moving team focused on product quality and customer trust. We value clear communication, ownership, and respect for local commerce traditions.',
        openings: 'Open Positions',
        noOpenings: 'We do not have public openings right now, but we are always interested in meeting talented people.',
        roles: 'Roles we often hire for',
        role1: 'Full-stack / React developers',
        role2: 'Customer support (Spanish & English)',
        role3: 'Operations & seller success',
        apply: 'Send your CV and a short note to',
        contact: 'Contact us',
    } : {
        title: 'Carreras en Subasti',
        subtitle: 'Ayúdanos a construir el mercado que Costa Rica merece.',
        culture: 'Nuestra Cultura',
        cultureText: 'Somos un equipo pequeño y ágil, enfocados en la calidad del producto y la confianza del cliente. Valoramos la comunicación clara, la responsabilidad y el respeto por las tradiciones comerciales locales.',
        openings: 'Vacantes Abiertas',
        noOpenings: 'No tenemos vacantes públicas en este momento, pero siempre nos interesa conocer personas talentosas.',
        roles: 'Perfiles que solemos buscar',
        role1: 'Desarrolladores full-stack / React',
        role2: 'Soporte al cliente (español e inglés)',
        role3: 'Operaciones y éxito del vendedor',
        apply: 'Envíe su CV y una breve nota a',
        contact: 'Contáctenos',
    };

    return (
        <StaticPage title={L.title} subtitle={L.subtitle}>
            <StaticSection heading={L.culture}><p>{L.cultureText}</p></StaticSection>
            <StaticSection heading={L.openings}>
                <p>{L.noOpenings}</p>
                <p className="font-semibold text-gray-800 mt-4">{L.roles}</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>{L.role1}</li>
                    <li>{L.role2}</li>
                    <li>{L.role3}</li>
                </ul>
                <p className="mt-4">
                    {L.apply}{' '}
                    <a href="mailto:careers@subasti.com" className="text-purple-600 font-semibold hover:underline">careers@subasti.com</a>
                    {' '}{loc === 'en' ? 'or' : 'o'}{' '}
                    <Link to="/contact" className="text-purple-600 font-semibold hover:underline">{L.contact}</Link>.
                </p>
            </StaticSection>
        </StaticPage>
    );
};

export default CareersPage;
