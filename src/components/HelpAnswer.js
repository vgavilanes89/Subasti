import React from 'react';
import { Link } from 'react-router-dom';
import { escrowPolicySteps } from '../data/escrow';

// Renders one help article's answer (paragraphs, bullet lists, numbered steps,
// the shared escrow steps) and its helpful links. Used by the Help Center and
// the FAQ so both read the same.
const HelpAnswer = ({ article, loc }) => (
    <div className="help-answer">
        {article.a.map((block, i) => {
            if (block.escrow) {
                return (
                    <ol key={i} className="about-steps">
                        {escrowPolicySteps(loc).map((s, n) => (
                            <li key={s.title}>
                                <span className="about-step-num about-step-num--gold">{n + 1}</span>
                                <div><strong>{s.title}</strong><p>{s.text}</p></div>
                            </li>
                        ))}
                    </ol>
                );
            }
            if (block.steps) {
                return (
                    <ol key={i} className="about-steps">
                        {block.steps.map((s, n) => (
                            <li key={n}>
                                <span className="about-step-num">{n + 1}</span>
                                <div><p>{s[loc]}</p></div>
                            </li>
                        ))}
                    </ol>
                );
            }
            if (block.list) {
                return <ul key={i} className="help-list">{block.list.map((s, n) => <li key={n}>{s[loc]}</li>)}</ul>;
            }
            return <p key={i}>{block[loc]}</p>;
        })}
        {article.links && article.links.length > 0 && (
            <div className="help-links">
                {article.links.map(link => (
                    <Link key={link.to} to={link.to} className="help-link">{link.label[loc]} →</Link>
                ))}
            </div>
        )}
    </div>
);

export default HelpAnswer;
