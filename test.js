const lowerText = "hello website\u00A0  feedback tool world";
const kw = "website feedback";

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getRegex(kw) {
    let source = escapeRegExp(kw.trim());
    source = source.replace(/(?:\\s| )+/g, '\\s+');
    return new RegExp(source, 'g');
}

const regex = getRegex(kw);
let count = 0;
let match;
while ((match = regex.exec(lowerText)) !== null) {
    count++;
    console.log("Match:", match[0], "Index:", match.index, "Length:", match[0].length);
}
console.log("Count:", count);
