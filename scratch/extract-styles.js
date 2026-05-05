const fs = require('fs');
const crypto = require('crypto');

function extractInlineStyles(filePath, cssFile) {
    let content = fs.readFileSync(filePath, 'utf8');
    let cssAppends = "";
    const styleMap = new Map();

    // Regex to match style="..." and carefully extract
    // It's safer to use regex for this specific HTML structure since it's simple
    // Find all style="..."
    const styleRegex = /style="([^"]+)"/g;
    let match;
    let newContent = content;

    while ((match = styleRegex.exec(content)) !== null) {
        let styleVal = match[1].trim();
        if (!styleVal) continue;
        
        let hash = crypto.createHash('md5').update(styleVal).digest('hex').substring(0, 8);
        let className = `inline-util-${hash}`;

        if (!styleMap.has(styleVal)) {
            styleMap.set(styleVal, className);
            cssAppends += `\n.${className} { ${styleVal} }\n`;
        } else {
            className = styleMap.get(styleVal);
        }

        // Replace style="styleVal" with class="className", wait, the element might already have a class="" attribute
        // Let's replace the whole tag logic carefully. We can just replace style="styleVal" with nothing,
        // and insert the class name inside the existing class="..."
    }

    if (cssAppends.length > 0) {
        fs.appendFileSync(cssFile, cssAppends);
        console.log(`Appended ${styleMap.size} styles to ${cssFile}`);
    }

    // Replace in content
    for (let [styleVal, className] of styleMap.entries()) {
        const exactStyleStr = `style="${styleVal}"`;
        // Find tags having this style
        const tagParts = newContent.split(exactStyleStr);
        let updatedContent = tagParts[0];
        
        for (let i = 1; i < tagParts.length; i++) {
            let before = updatedContent;
            let after = tagParts[i];
            
            // Look backwards for class="
            // If exists in the same tag opening, append to it. Else, add class="..."
            let lastOpeningBracket = before.lastIndexOf('<');
            let lastClosingBracket = before.lastIndexOf('>');
            if (lastOpeningBracket > lastClosingBracket) {
                // We are inside a tag opening
                let classAttrMatch = before.match(/class="([^"]*)"[^>]*$/);
                if (classAttrMatch) {
                    // Update existing class
                    let oldClassVal = classAttrMatch[1];
                    let newClassVal = oldClassVal + " " + className;
                    let toReplace = `class="${oldClassVal}"`;
                    // only replace the last occurrence in `before`
                    let idx = before.lastIndexOf(toReplace);
                    if (idx !== -1) {
                        before = before.substring(0, idx) + `class="${newClassVal}"` + before.substring(idx + toReplace.length);
                        updatedContent = before + after;
                    } else {
                        updatedContent = before + ` class="${className}"` + after; // fallback
                    }
                } else {
                    // add class attr
                    updatedContent = before + `class="${className}" ` + after;
                }
            } else {
                updatedContent = before + exactStyleStr + after; // fallback if regex is weird
            }
        }
        newContent = updatedContent;
    }
    
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
}

extractInlineStyles('index', 'css/main.css?v=6.0');
extractInlineStyles('dist/index', 'css/main.css?v=6.0');
