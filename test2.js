const lowerText = "website feedback tool, site feedback tool. and some russian вебсайт сайт";
function getKeywordRegex(kw) {
    let source = String(kw).toLowerCase().trim();
    source = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    source = source.replace(/(?:\\ |\s)+/g, '\\s+');
    source = `(?<![\\p{L}\\d_])${source}(?![\\p{L}\\d_])`;
    return new RegExp(source, 'gu');
}

const rgx1 = getKeywordRegex("site feedback tool");
console.log("Found site feedback:", lowerText.match(rgx1));

const rgx2 = getKeywordRegex("сайт");
console.log("Found сайт:", lowerText.match(rgx2));
