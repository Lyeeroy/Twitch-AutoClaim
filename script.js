// ==UserScript==
// @name         AutoClaim
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  automatically claim twitch bonus points
// @author       hlk
// @match        https://www.twitch.tv/*
// @match        https://twitch.tv/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const selector = '[data-test-selector="copo-balance-string"]';
    let label, url = window.location.href;

    // Exact same storage logic so your previous points load correctly
    const getPts = () => parseInt(localStorage.getItem('autoClaimPoints_' + url)) || 0;
    const setPts = (pts) => localStorage.setItem('autoClaimPoints_' + url, pts);
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    async function find() {
        const icon = document.querySelector('.claimable-bonus__icon');
        if (icon) {
            icon.click();
            const total = getPts() + 50;
            setPts(total);
            updateBalance(total);
            await sleep(300000); // 5-minute sleep logic retained
        }
    }

    function updateBalance(pts) {
        const bal = document.querySelector(selector);
        if (bal) {
            if (!label) {
                label = document.createElement('span');
                // Flex alignment fixes combined into one short line
                label.style.cssText = 'margin-left:10px; display:inline-flex; align-self:center; cursor:pointer;';
                label.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation(); // Prevents twitch menu from opening
                    if (confirm('Are you sure you want to reset the tracker on this stream?')) {
                        setPts(0); updateBalance(0);
                    }
                };
            }
            bal.parentNode.appendChild(label);
            label.textContent = '+' + pts;
        }
    }

    // Combines page load wait and balance checking into one shorter function
    async function initStream() {
        while (document.readyState !== 'complete') await sleep(1000);
        for (let i = 0; i < 10; i++) {
            if (document.querySelector(selector)) { updateBalance(getPts()); return; }
            await sleep(1000);
        }
    }

    // Original URL observer logic
    new MutationObserver(() => {
        if (url !== document.location.href) {
            url = document.location.href;
            if (label) label.remove(); // Clear old label when switching streams
            label = null;
            initStream();
        }
    }).observe(document.body, { childList: true, subtree: true });

    initStream().then(() => setInterval(find, 5000));
})();
