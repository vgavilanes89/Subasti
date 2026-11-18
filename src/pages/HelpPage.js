import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import HelpAnswer from '../components/HelpAnswer';
import { HELP_TOPICS, allArticles, answerText } from '../data/helpContent';
import { normalizeSearch } from '../lib/search';

const ArticleItem = ({ article, loc, open, onToggle, topicLabel }) => (
    <div id={`help-${article.id}`} className={`help-item ${open ? 'help-item--open' : ''}`}>
        <button type="button" className="help-item-q" aria-expanded={open} onClick={onToggle}>
            <span>
                {topicLabel && <span className="help-item-topic">{topicLabel}</span>}
                {article.q[loc]}
            </span>
            <span className="help-item-sign" aria-hidden>{open ? '−' : '+'}</span>
        </button>
        {open && <HelpAnswer article={article} loc={loc} />}
    </div>
);

const HelpPage = ({ loc }) => {
    const location = useLocation();
    const [query, setQuery] = useState('');
    const [topic, setTopic] = useState('all');
    const [openIds, setOpenIds] = useState(() => new Set());

    const L = loc === 'en' ? {
        title: 'Help Center',
        subtitle: 'Guides for buying, selling and getting the most out of Subasti.',
        searchLabel: 'Search the Help Center',
        searchPlaceholder: 'Search, e.g. "SINPE", "claim", "payout"…',
        browse: 'Browse by topic',
        all: 'All topics',
        articles: (n) => `${n} ${n === 1 ? 'article' : 'articles'}`,
        results: (n, q) => `${n} ${n === 1 ? 'result' : 'results'} for "${q}"`,
        clear: 'Clear search',
        noResults: 'We could not find anything for that. Try another word, or browse the topics.',
        stillHelp: 'Still need help?',
        stillHelpText: 'Check the FAQ or send us a message and we will reply within 1 business day.',
        faq: 'FAQ',
        contact: 'Contact us',
    } : {
        title: 'Centro de Ayuda',
        subtitle: 'Guías para comprar, vender y aprovechar al máximo Subasti.',
        searchLabel: 'Buscar en el Centro de Ayuda',
        searchPlaceholder: 'Busca, ej. "SINPE", "reclamo", "pago"…',
        browse: 'Explorar por tema',
        all: 'Todos los temas',
        articles: (n) => `${n} ${n === 1 ? 'artículo' : 'artículos'}`,
        results: (n, q) => `${n} ${n === 1 ? 'resultado' : 'resultados'} para "${q}"`,
        clear: 'Borrar búsqueda',
        noResults: 'No encontramos nada con eso. Prueba otra palabra, o explora los temas.',
        stillHelp: '¿Aún necesitas ayuda?',
        stillHelpText: 'Revisa las preguntas frecuentes o envíanos un mensaje y te respondemos en un máximo de 1 día hábil.',
        faq: 'Preguntas Frecuentes',
        contact: 'Contáctanos',
    };

    const topicTitle = useMemo(() => Object.fromEntries(HELP_TOPICS.map(t => [t.id, t.title[loc]])), [loc]);

    // Search: every word typed must appear in the question, answer, keywords or
    // topic name (accent- and case-insensitive).
    const results = useMemo(() => {
        const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return null;
        const scored = [];
        allArticles().forEach((article) => {
            const question = normalizeSearch(article.q[loc]);
            const hay = normalizeSearch([article.q[loc], answerText(article, loc), article.kw ? article.kw[loc] : '', topicTitle[article.topicId]].join(' '));
            if (!tokens.every(token => hay.includes(token))) return;
            // Words in the question matter most, then in the keywords, then anywhere in the answer.
            const score = tokens.filter(t => question.includes(t)).length * 2
                + tokens.filter(t => normalizeSearch(article.kw ? article.kw[loc] : '').includes(t)).length;
            scored.push({ article, score });
        });
        return scored.sort((x, y) => y.score - x.score).map(x => x.article);
    }, [query, loc, topicTitle]);

    // A couple of matches are opened for you; many stay collapsed.
    useEffect(() => {
        if (results) setOpenIds(new Set(results.length <= 3 ? results.map(a => a.id) : []));
    }, [results]);

    // /help#sell-payout opens and scrolls to that article (other pages link here).
    useEffect(() => {
        const id = location.hash.replace('#help-', '').replace('#', '');
        if (!id || !allArticles().some(a => a.id === id)) return;
        setOpenIds(prev => new Set(prev).add(id));
        setTimeout(() => document.getElementById(`help-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }, [location.hash]);

    const toggle = (id) => setOpenIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const visibleTopics = HELP_TOPICS.filter(t => topic === 'all' || t.id === topic);

    return (
        <div className="about-page">
            <section className="about-hero about-hero--compact">
                <h1>{L.title}</h1>
                <p>{L.subtitle}</p>
                <div className="help-search">
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={L.searchPlaceholder}
                        aria-label={L.searchLabel}
                        className="help-search-input"
                    />
                </div>
            </section>

            {results ? (
                <section className="about-card">
                    <div className="help-results-head">
                        <h2>{L.results(results.length, query.trim())}</h2>
                        <button type="button" className="buyer-order-link-btn" onClick={() => setQuery('')}>{L.clear}</button>
                    </div>
                    {results.length === 0 ? (
                        <p>{L.noResults}</p>
                    ) : (
                        <div className="help-list-wrap">
                            {results.map(article => (
                                <ArticleItem key={article.id} article={article} loc={loc} open={openIds.has(article.id)} onToggle={() => toggle(article.id)} topicLabel={topicTitle[article.topicId]} />
                            ))}
                        </div>
                    )}
                </section>
            ) : (
                <>
                    <section>
                        <h2 className="about-heading">{L.browse}</h2>
                        <div className="help-topics">
                            <button type="button" className={`help-topic ${topic === 'all' ? 'help-topic--active' : ''}`} onClick={() => setTopic('all')}>
                                <strong>{L.all}</strong>
                                <span>{L.articles(allArticles().length)}</span>
                            </button>
                            {HELP_TOPICS.map(t => (
                                <button key={t.id} type="button" className={`help-topic ${topic === t.id ? 'help-topic--active' : ''}`} onClick={() => setTopic(topic === t.id ? 'all' : t.id)}>
                                    <strong>{t.title[loc]}</strong>
                                    <span>{t.blurb[loc]}</span>
                                    <em>{L.articles(t.articles.length)}</em>
                                </button>
                            ))}
                        </div>
                    </section>

                    {visibleTopics.map(t => (
                        <section key={t.id} className="about-card" id={`topic-${t.id}`}>
                            <h2>{t.title[loc]}</h2>
                            <div className="help-list-wrap">
                                {t.articles.map(article => (
                                    <ArticleItem key={article.id} article={article} loc={loc} open={openIds.has(article.id)} onToggle={() => toggle(article.id)} />
                                ))}
                            </div>
                        </section>
                    ))}
                </>
            )}

            <section className="about-help">
                <div>
                    <h2>{L.stillHelp}</h2>
                    <p>{L.stillHelpText}</p>
                </div>
                <div className="about-hero-actions">
                    <Link to="/faq" className="about-btn about-btn--light">{L.faq}</Link>
                    <Link to="/contact" className="about-btn about-btn--gold">{L.contact}</Link>
                </div>
            </section>
        </div>
    );
};

export default HelpPage;
