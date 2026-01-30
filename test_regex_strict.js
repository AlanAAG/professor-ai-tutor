
const testRegex = (regex) => {
    const content = `Here is a table:
| Formula Type | Syntax | Purpose | Example |
|---|---|---|
| Addition | =A1+B1 | Sum two cells | =C2+D2 |
| Subtraction | =A1-B1 | Subtract values | =E5-F5 |

And another one without outer pipes:
Header 1 | Header 2
---|---
Cell 1 | Cell 2
`;

    console.log("--- Testing Regex ---");
    // console.log("Input:", JSON.stringify(content));

    const processed = content.replace(regex, '$1\n\n$2\n$3');
    console.log("Output:", JSON.stringify(processed));

    // Check if it split the table (bad)
    if (processed.includes("=C2+D2 | \n\n| Subtraction")) {
        console.log("FAIL: Split the table incorrectly.");
    } else {
        console.log("PASS: Did not split the table.");
    }

    // Check if it separated the header (good)
    if (processed.includes("Here is a table:\n\n| Formula Type")) {
        console.log("PASS: Inserted newline before table.");
    } else {
        console.log("FAIL: Did not insert newline before table.");
    }

    // Check loose table
    const loose = "Text\nHeader | Header\n---|---";
    const processedLoose = loose.replace(regex, '$1\n\n$2\n$3');
    // console.log("Loose Output:", JSON.stringify(processedLoose));
    if (processedLoose.includes("Text\n\nHeader")) {
        console.log("PASS: Handled loose table.");
    } else {
        console.log("FAIL: Did not handle loose table.");
    }
};

// Current faulty regex
// const currentRegex = /([^\n])\n(\s*\|?.*\|.*)\n(\s*\|?[\s-:|]+\|?)/g;
// testRegex(currentRegex);

// Proposed strict regex
// Exclude \n from the separator group, and require at least one dash
// Group 3: (\s*\|?[ \t:|]*-[ \t:|]*\|?)
// Note: \s includes \n. replace \s with [ \t].
// Group 2: (\s*\|?.*\|.*) -> .* does not match \n usually.
const strictRegex = /([^\n])\n([ \t]*\|?.*\|.*)\n([ \t]*\|?[ \t:|]*-[ \t:|]*\|?)/g;

console.log("\nTesting strict regex:");
testRegex(strictRegex);
