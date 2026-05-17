// ==UserScript==
// @name         AutoClaim
// @namespace    http://tampermonkey.net/
// @version      0.6.1
// @description  automatically claim twitch bonus points
// @author       hlk
// @match        https://www.twitch.tv/*
// @match        https://twitch.tv/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let s = '[data-test-selector="copo-balance-string"]',
        l,
        u = location.href,
        G = () => +localStorage['autoClaimPoints_' + u] || 0,
        S = v => localStorage['autoClaimPoints_' + u] = v,
        A = () => {
            let a = [], t = 0, c = 0;
            for (let i = 0; i < localStorage.length; i++) {
                let k = localStorage.key(i);
                if (k && k.startsWith('autoClaimPoints_')) {
                    let p = +localStorage[k];
                    a.push({ r: k.slice(16), p });
                    t += p;
                    c++;
                }
            }
            return { stats: a, total: t, count: c };
        },
        showM = () => {
            let { stats: a, total: t, count: c } = A();
            // Sort by points descending
            a.sort((x, y) => y.p - x.p);

            let p = G();
            let o = document.createElement('div');
            o.style = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999999;display:flex;align-items:center;justify-content:center';

            let m = document.createElement('div');
            m.style = 'background:#fff;color:#111;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;width:440px;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.12);overflow:hidden';

            m.innerHTML = `
            <div style="padding:24px 28px 20px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <div style="font-size:15px;font-weight:600;letter-spacing:-.2px">AutoClaim</div>
                    <div id="closeX" style="font-size:24px;font-weight:400;cursor:pointer;line-height:1;transform:rotate(90deg);user-select:none;">×</div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;width:100%;margin-bottom:20px;">
                    <div style="background:#f4f4f5;padding:12px 8px;border-radius:8px;text-align:center;">
                        <div style="font-size:10px;color:#666;font-weight:700;">CURRENT STREAM</div>
                        <div style="font-size:22px;font-weight:600;margin-top:4px;">${p}</div>
                    </div>
                    <div style="background:#f4f4f5;padding:12px 8px;border-radius:8px;text-align:center;">
                        <div style="font-size:10px;color:#666;font-weight:700;">TOTAL ACROSS ALL</div>
                        <div style="font-size:22px;font-weight:600;margin-top:4px;">${t}</div>
                    </div>
                    <div style="background:#f4f4f5;padding:12px 8px;border-radius:8px;text-align:center;">
                        <div style="font-size:10px;color:#666;font-weight:700;">STREAMS</div>
                        <div style="font-size:22px;font-weight:600;margin-top:4px;">${c}</div>
                    </div>
                </div>

                <div style="margin-bottom:8px;font-size:12px;font-weight:600;color:#555">Breakdown</div>
                <div style="max-height:180px;overflow:auto;font-size:13px;line-height:1.5;padding:0 12px;">
                    ${a.map(x => {
                        let name = x.r.split('/').pop();
                        return `<div class="stream-row" data-url="${x.r}" data-name="${name}" style="display:flex;justify-content:space-between;padding:6px 4px;border-top:1px solid #eee;cursor:pointer;border-radius:4px;transition:background .15s" onmouseenter="this.style.backgroundColor='#f4f4f5'" onmouseleave="this.style.backgroundColor='transparent'">
                            <span>${name}</span>
                            <span style="font-variant-numeric:tabular-nums">${x.p}</span>
                        </div>`;
                    }).join('') || '<div style="color:#888">No data yet</div>'}
                </div>
            </div>
            <div style="border-top:1px solid #eee;padding:12px 28px;display:flex;gap:12px;background:#fafafa">
                <button id="rb" style="flex:1;padding:8px 16px;border:1px solid #333;border-radius:6px;background:#000;color:#fff;font-size:13px;cursor:pointer;text-align:center">Reset current stream</button>
                <button id="ra" style="flex:1;padding:8px 0;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:13px;cursor:pointer;text-align:center">Reset All</button>
            </div>`;

            o.appendChild(m);
            document.body.appendChild(o);

            // Close modal when clicking the X
            m.querySelector('#closeX').onclick = () => o.remove();

            // Also close when clicking backdrop
            o.onclick = e => { if (e.target === o) o.remove() };

            m.querySelector('#rb').onclick = () => {
                if (confirm('Reset points for this stream?')) {
                    localStorage.removeItem('autoClaimPoints_' + u);
                    U(0);
                    o.remove();
                    showM();
                }
            };

            m.querySelector('#ra').onclick = () => {
                if (confirm('Reset ALL streams points? This cannot be undone.')) {
                    for (let i = 0; i < localStorage.length; i++) {
                        let k = localStorage.key(i);
                        if (k && k.startsWith('autoClaimPoints_')) {
                            localStorage.removeItem(k);
                        }
                    }
                    U(0);
                    o.remove();
                    showM();
                }
            };

            m.querySelectorAll('.stream-row').forEach(row => {
                row.onclick = () => {
                    let name = row.getAttribute('data-name');
                    let url = row.getAttribute('data-url');

                    if (confirm(`Reset points for ${name} stream?`)) {
                        localStorage.removeItem('autoClaimPoints_' + url);

                        if (url === u) {
                            U(0);
                        }

                        o.remove();
                        showM();
                    }
                };
            });
        },
        F = async () => {
            let i = document.querySelector('.claimable-bonus__icon');
            if (i) {
                i.click();
                let n = G() + 50;
                S(n);
                U(n);
                await new Promise(r => setTimeout(r, 3e5));
            }
        },
        U = v => {
            let b = document.querySelector(s);
            if (b) {
                if (!l) {
                    l = document.createElement('span');
                    l.style = 'margin-left:10px;display:inline-flex;align-self:center;cursor:pointer;color:#a970ff;font-weight:600';
                    l.onclick = e => { e.preventDefault(); e.stopPropagation(); showM(); };
                }
                b.parentNode.appendChild(l);
                l.textContent = '+' + v;
            }
        },
        I = async () => {
            while (document.readyState !== 'complete') await new Promise(r => setTimeout(r, 1e3));
            for (let i = 0; i < 10; i++) {
                if (document.querySelector(s)) {
                    U(G());
                    return;
                }
                await new Promise(r => setTimeout(r, 1e3));
            }
        };

    new MutationObserver(() => {
        if (u !== location.href) {
            u = location.href;
            if (l) l.remove();
            l = null;
            I();
        }
    }).observe(document.body, { childList: true, subtree: true });

    I().then(() => setInterval(F, 5e3));
})();
