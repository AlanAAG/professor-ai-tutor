
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
    const processed = content.replace(regex, '$1\n\n$2\n$3');
    // console.log("Output:", JSON.stringify(processed));

    if (processed.includes("=C2+D2 | \n\n| Subtraction")) {
        console.log("FAIL: Split the table incorrectly.");
    } else {
        console.log("PASS: Did not split the table.");
    }

    if (processed.includes("Here is a table:\n\n| Formula Type")) {
        console.log("PASS: Inserted newline before table.");
    } else {
        console.log("FAIL: Did not insert newline before table.");
    }

    // Check loose table
    const loose = "Text\nHeader | Header\n---|---";
    const processedLoose = loose.replace(regex, '$1\n\n$2\n$3');
    if (processedLoose.includes("Text\n\nHeader")) {
        console.log("PASS: Handled loose table.");
    } else {
        console.log("FAIL: Did not handle loose table.");
    }
};

// Safe regex with dashes at start of character class
// Group 2: ([ \t]*\|?.*\|.*)
// Group 3: ([ \t]*\|?[- \t:|]*-[ \t:|]*\|?)
const safeRegex = /([^\n])\n([ \t]*\|?.*\|.*)\n([ \t]*\|?[- \t:|]*-[ \t:|]*\|?)/g;

console.log("\nTesting safe regex:");
testRegex(safeRegex);
