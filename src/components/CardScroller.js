import React, { useRef, useEffect, useState } from 'react';

// Lays out children in a horizontally scrollable area, plus a scroll bar
// pinned to the bottom of the window while the area is on screen (a normal
// bar would sit below the whole list, out of sight on a long page). The two
// scroll positions are kept in sync. The bar only shows when there's
// something to scroll to.
const CardScroller = ({ children }) => {
    const mainRef = useRef(null);
    const barRef = useRef(null);
    const innerRef = useRef(null);
    const wrapRef = useRef(null);
    const [overflowing, setOverflowing] = useState(false);

    useEffect(() => {
        const main = mainRef.current;
        const bar = barRef.current;
        const inner = innerRef.current;
        const wrap = wrapRef.current;
        if (!main || !bar || !inner || !wrap) return undefined;

        const measure = () => {
            // Sized so the bar and the cards reach the end at the same position
            // (the bar is a few pixels narrower than the scrolling area). Uses
            // the wrapper's width because the bar itself can be hidden here.
            inner.style.width = `${main.scrollWidth - main.clientWidth + wrap.clientWidth}px`;
            setOverflowing(main.scrollWidth > main.clientWidth + 1);
        };
        // Assigning an equal value is a no-op, so the two handlers can't ping-pong.
        const fromMain = () => { if (bar.scrollLeft !== main.scrollLeft) bar.scrollLeft = main.scrollLeft; };
        const fromBar = () => { if (main.scrollLeft !== bar.scrollLeft) main.scrollLeft = bar.scrollLeft; };

        measure();
        main.addEventListener('scroll', fromMain, { passive: true });
        bar.addEventListener('scroll', fromBar, { passive: true });
        const observer = new ResizeObserver(measure);
        observer.observe(main);
        if (main.firstElementChild) observer.observe(main.firstElementChild);
        window.addEventListener('resize', measure);

        return () => {
            main.removeEventListener('scroll', fromMain);
            bar.removeEventListener('scroll', fromBar);
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, []);

    return (
        <div ref={wrapRef}>
            <div ref={mainRef} className="home-card-scroll">{children}</div>
            <div ref={barRef} className="home-card-bar" style={{ display: overflowing ? 'block' : 'none' }} aria-hidden="true">
                <div ref={innerRef} />
            </div>
        </div>
    );
};

export default CardScroller;
