function isMobileDevice() {
    const ua = navigator.userAgent || '';
    const platformData = navigator.userAgentData;
    const uaLower = ua.toLowerCase();
    let log = [];

    const addLog = (message) => {
        log.push(message);
    };

    addLog(`User Agent: ${ua}`);
    addLog(`Platform Data available: ${!!platformData}`);

    let uaChMobile = null;
    if (platformData && typeof platformData.mobile === 'boolean') {
        uaChMobile = platformData.mobile;
        if (uaChMobile === true) {
            return true;
        }
    } else {
        addLog('UA-CH mobile: Not available or not boolean.');
    }

    const mobileKeywordsRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB10|IEMobile|Opera Mini|Mobi|Mobile|Tablet|Silk|Fennec|Kindle/i;
    if (mobileKeywordsRegex.test(ua)) {
        if (/Windows NT/i.test(ua) && /Touch/i.test(ua)) {
        } else if (/Macintosh/i.test(ua) && /Mobile/i.test(ua)) {
        } else {
            return true;
        }
    } else {
        addLog('UA string did not match strong mobile keywords.');
    }

    let hasTouch = false;
    try {
        if ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0) {
            hasTouch = true;
        } else if ('msMaxTouchPoints' in navigator && navigator.msMaxTouchPoints > 0) {
            hasTouch = true;
        } else if ('ontouchstart' in window) {
            hasTouch = true;
        }
    } catch (e) { }
    addLog(`Touch support detected (maxTouchPoints/ontouchstart): ${hasTouch}`);

    let isPrimaryInputCoarse = false;
    try {
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
            isPrimaryInputCoarse = true;
        }
    } catch (e) { }
    addLog(`Primary input is coarse (pointer: coarse): ${isPrimaryInputCoarse}`);

    let isLikelyStandardDesktop = false;
    const platformString = (platformData?.platform || '').toLowerCase();
    addLog(`UA-CH platform string: ${platformString}`);

    if (platformString === 'windows' || platformString === 'macos') {
        isLikelyStandardDesktop = true;
    } else if (/windows nt/i.test(ua)) {
        isLikelyStandardDesktop = true;
    } else if (/macintosh/i.test(uaLower) && !/ip(hone|ad|od)/i.test(uaLower)) {
        if (!hasTouch || !isPrimaryInputCoarse) {
            isLikelyStandardDesktop = true;
        }
    } else if (/linux/i.test(uaLower) && /x86_64/i.test(uaLower) && !/cros/i.test(uaLower) && !/android/i.test(uaLower)) {
        isLikelyStandardDesktop = true;
    } else if (platformString === 'linux' && !/cros/i.test(uaLower) && !/android/i.test(uaLower)) {
        if (!hasTouch || !isPrimaryInputCoarse) {
            isLikelyStandardDesktop = true;
        }
    }
    addLog(`Combined Platform Check: isLikelyStandardDesktop = ${isLikelyStandardDesktop}`);

    if (hasTouch && isPrimaryInputCoarse) {
        if (!isLikelyStandardDesktop) {
            return true;
        } else {
            return false;
        }
    }

    if (uaChMobile === false) {
        return false;
    }

    return false;
}
export default isMobileDevice