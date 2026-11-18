import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HelpAnswer from '../components/HelpAnswer';
import { FAQ_ARTICLE_IDS, getArticle } from '../data/helpContent';

// The FAQ is a short list of the most-asked questions, drawn from the same
// content as the Help Center (src/data/helpContent.js) so the two never
// disagree. The Help Center has the full set, with search.
const FaqPage = ({ loc }) => {
    const [openId, setOpenId] = useState(FAQ_ARTICLE_IDS[0]);
    const faqs = FAQ_ARTICLE_IDS.map(getArticle).filter(Boolean);

    const L = loc === 'en' ? {
        title: 'Frequently Asked Questions',
        subtitle: 'Quick answers to the most common questions about Subasti.',
        more: 'Looking for something else?',
        moreText: 'The Help Center has guides on every topic, with search.',
        help: 'Open the Help Center',
        contact: 'Contact us',
    } : {
        title: 'Preguntas Frecuentes',
        subtitle: 'Respuestas rápidas a las preguntas más comunes sobre Subasti.',
        more: '¿Buscas algo más?',
        moreText: 'El Centro de Ayuda tiene guías de cada tema, con búsqueda.',
        help: 'Abrir el Centro de Ayuda',
        contact: 'Contáctanos',
    };

    return (
        <div className="about-page">
            <section className="about-hero about-hero--compact">
                <h1>{L.title}</h1>
                <p>{L.subtitle}</p>
            </section>

            <section className="about-card">
                <div className="help-list-wrap">
                    {faqs.map(article => {
                        const open = openId === article.id;
                        return (
                            <div key={article.id} className={`help-item ${open ? 'help-item--open' : ''}`}>
                                <button type="button" className="help-item-q" aria-expanded={open} onClick={() => setOpenId(open ? null : article.id)}>
                                    <span>{article.q[loc]}</span>
                                    <span className="help-item-sign" aria-hidden>{open ? '−' : '+'}</span>
                                </button>
                                {open && <HelpAnswer article={article} loc={loc} />}
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="about-help">
                <div>
                    <h2>{L.more}</h2>
                    <p>{L.moreText}</p>
                </div>
                <div className="about-hero-actions">
                    <Link to="/help" className="about-btn about-btn--light">{L.help}</Link>
                    <Link to="/contact" className="about-btn about-btn--gold">{L.contact}</Link>
                </div>
            </section>
        </div>
    );
};

export default FaqPage;
