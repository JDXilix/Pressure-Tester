// Copy these helpers into the CURRENT export script; this is not a replacement
// for that script. Prefer reading GVL.HMI_ShearTimeText directly where supported.
function formatShearPressure(value) {
    if (value === null || value === undefined || value === '') return '';
    var n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : '';
}
function formatShearTime(value) {
    if (value === null || value === undefined || value === '') return '';
    var seconds;
    if (typeof value === 'number') {
        // Numeric PLC TIME values are milliseconds.
        seconds = value / 1000;
    } else {
        var text = String(value).trim();
        if (/^\d+:\d{2}$/.test(text)) return text;
        var match = /^P(?:(\d+(?:\.\d+)?)D)?T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/i.exec(text);
        if (!match || !match.slice(1).some(function (x) { return x !== undefined; })) return '';
        seconds = Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600 + Number(match[3] || 0) * 60 + Number(match[4] || 0);
    }
    if (!Number.isFinite(seconds) || seconds < 0) return '';
    var total = Math.floor(seconds);
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}
