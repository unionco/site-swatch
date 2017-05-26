const toArray = arr => Array.prototype.slice.call(arr);

function getStyleSheets() {
    return window.top.document.styleSheets;
}

function getCssRules() {
    return toArray(getStyleSheets()).reduce((rules, sheet) =>
        toArray(sheet.cssRules || [{cssText: ''}])
            .map(rule => rule.cssText || '')
            .concat(rules)
    , []);
}

function getColors() {
    return getCssRules().reduce((colors, rule) => {
        const newColors = (rule.match(/#(?:[a-fA-F0-9]{3}){1,2}|rgba?\((?:\s*\d{1,3}\.?\d*\s*,?){3,4}\)/g) || []);
        newColors.forEach(color => colors.includes(color) || colors.push(color));
        return colors;
    }, []);
}

chrome.runtime.onMessage.addListener((request, s, sendMessage) => {
    if (request.message === 'getColors') {
        sendMessage({ colors: getColors() });
    }
});
