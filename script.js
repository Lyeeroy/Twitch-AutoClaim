// ==UserScript==
// @name         AutoClaim
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  automatically claim twitch bonus points
// @author       hlk
// @include      https://www.twitch.tv/*
// @include      https://twitch.tv/*
// @grant        none
// inspired by https://github.com/ran-su/Netflix-marathon
// ==/UserScript==

(function() {
    'use strict';

    const balanceStringSelector = '[data-test-selector="copo-balance-string"]';
    const claimableBonusIconSelector = '.claimable-bonus__icon';
    let newBalanceLabel;
    let currentUrl = window.location.href;
    const storageKeyPrefix = 'autoClaimPoints_';

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getStoredPoints(url) {
        return parseInt(localStorage.getItem(storageKeyPrefix + url)) || 0;
    }

    function storePoints(url, points) {
        localStorage.setItem(storageKeyPrefix + url, points);
    }

    async function find() {
        const bonusIcon = document.querySelector(claimableBonusIconSelector);
        if (bonusIcon) {
            bonusIcon.click();
            const totalClaimedPoints = getStoredPoints(currentUrl) + 50;
            storePoints(currentUrl, totalClaimedPoints);
            updateBalance(totalClaimedPoints);
            await sleep(5 * 60 * 1000);
        }
    }

    function updateBalance(totalClaimedPoints) {
        const balanceElement = document.querySelector(balanceStringSelector);
        if (balanceElement) {
            if (newBalanceLabel) {
                newBalanceLabel.remove();
            }
            newBalanceLabel = document.createElement('span');
            newBalanceLabel.style.marginLeft = '10px';
            newBalanceLabel.onclick = () => {
                const erasePoints = confirm('Are you sure you want to reset the tracker on this stream?');
                if (erasePoints) {
                    storePoints(currentUrl, 0);
                    updateBalance(0);
                }
            };
            balanceElement.parentNode.appendChild(newBalanceLabel);
            const newBalanceText = `+${totalClaimedPoints}`;
            newBalanceLabel.textContent = newBalanceText;
        }
    }

    async function waitForPageLoad() {
        while (document.readyState !== 'complete') {
            await sleep(1000);
        }
    }

    async function ensureBalanceLabel() {
        let retries = 10;
        while (retries > 0) {
            const balanceElement = document.querySelector(balanceStringSelector);
            if (balanceElement) {
                const totalClaimedPoints = getStoredPoints(currentUrl);
                updateBalance(totalClaimedPoints);
                return;
            }
            await sleep(1000);
            retries--;
        }
        console.error('Failed to find the balance element: "' + balanceStringSelector + '" after multiple retries.');
    }

    function onUrlChange(callback) {
        let oldHref = document.location.href;
        const body = document.querySelector('body');
        const observer = new MutationObserver(mutations => {
            mutations.forEach(() => {
                if (oldHref !== document.location.href) {
                    oldHref = document.location.href;
                    callback();
                }
            });
        });
        observer.observe(body, { childList: true, subtree: true });
    }

    async function init() {
        await waitForPageLoad();
        await ensureBalanceLabel();
        window.setInterval(find, 5000);
    }

    onUrlChange(async () => {
        currentUrl = window.location.href;
        await waitForPageLoad();
        await ensureBalanceLabel();
    });

    init();
})();
