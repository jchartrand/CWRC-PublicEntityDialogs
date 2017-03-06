// from https://davidwalsh.name/add-rules-stylesheets

var sheet = (function() {
    var style = document.createElement("style");
    // WebKit hack
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    return style.sheet;
})();

function addCSSRule(sheet, selector, rules, index) {
    if("insertRule" in sheet) {
        sheet.insertRule(`${selector} { ${rules} }`, index);
    }
    else if("addRule" in sheet) {
        sheet.addRule(selector, rules, index);
    }
}

addCSSRule(sheet, ".typeahead, .tt-query, .tt-hint", "border: 2px solid #CCCCCC;border-radius: 8px; font-size: 22px; height: 30px; line-height: 30px; outline: medium none; padding: 8px 12px; width: 396px;");
addCSSRule(sheet, ".typeahead", "background-color: #FFFFFF;");
addCSSRule(sheet, ".typeahead:focus", "border: 2px solid #0097CF;");
addCSSRule(sheet, ".tt-query", "box-shadow: 0 1px 1px rgba(0, 0, 0, 0.075) inset;");
addCSSRule(sheet, ".tt-hint", "color: #999999;");
addCSSRule(sheet, ".tt-menu", "background-color: #FFFFFF; border: 1px solid rgba(0, 0, 0, 0.2); border-radius: 8px; box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2); margin-top: 12px; padding: 8px 0; width: 422px;"); 
addCSSRule(sheet, ".tt-suggestion", "font-size: 15px;padding: 3px 20px;");
addCSSRule(sheet, ".tt-suggestion:hover", "cursor: pointer; background-color: #0097CF; color: #FFFFFF;"); 
addCSSRule(sheet, ".tt-suggestion p ", "margin: 0;");
    
/*

The same stylesheet rules as above, as they'd appear in a standard css stylesheet declaration:

.typeahead, .tt-query, .tt-hint {
    border: 2px solid #CCCCCC;
    border-radius: 8px;
    font-size: 22px;  Set input font size 
    height: 30px;
    line-height: 30px;
    outline: medium none;
    padding: 8px 12px;
    width: 396px;
}
.typeahead {
    background-color: #FFFFFF;
}
.typeahead:focus {
    border: 2px solid #0097CF;
}
.tt-query {
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.075) inset;
}
.tt-hint {
    color: #999999;
}
.tt-menu {
    background-color: #FFFFFF;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
    margin-top: 12px;
    padding: 8px 0;
    width: 422px;
    
    to autosroll the lookaheadh dropdown menu:
    max-height: 150px;
    overflow-y: auto;

}
.tt-suggestion {
    font-size: 15px;   Set suggestion dropdown font size 
    padding: 3px 20px;
}
.tt-suggestion:hover {
    cursor: pointer;
    background-color: #0097CF;
    color: #FFFFFF;
}
.tt-suggestion p {
    margin: 0;
}
*/