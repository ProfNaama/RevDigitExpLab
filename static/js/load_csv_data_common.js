
// based on: https://www.geeksforgeeks.org/how-to-convert-csv-to-json-file-and-vice-versa-in-javascript/
// added some escaping for " (\") as well as for ' (\') as well as for \ (\\)
const escapeReplacement = "__RESERVED_ESCAPE_PLACEHOLDER_CHAR__";
const commaReplacement = "__RESERVED_COMMA_PLACEHOLDER_CHAR__";
const quoteReplacement = "__RESERVED_QUOTE_PLACEHOLDER_CHAR__";

const convertCsvToJson = function(csv){
    const CSVToJSON = csv => {
        csv = csv.replaceAll('\r', '');
        const lines = csv.split('\n');
        const keys = lines[0].split(',');
        return lines.slice(1).map(line => {
            line = line.replaceAll("\\\\", escapeReplacement).replaceAll("\\,", commaReplacement).replaceAll("\\\"", quoteReplacement).replaceAll("\"", "");
            return line.split(',').reduce((acc, cur, i) => {
                const toAdd = {};
                toAdd[keys[i]] = cur.replaceAll(escapeReplacement, "\\").replaceAll(commaReplacement, ",").replaceAll(quoteReplacement, "\"");
                return { ...acc, ...toAdd };
            }, {});
        });
    };
    return CSVToJSON(csv);
}

// a variation that returns a csv transpose (key per column)
const convertCsvToJsonTranspose = function(csv){
    const CSVToJSONTranspose = csv => {
        csv = csv.replaceAll('\r', '');
        const lines = csv.split('\n');
        const keys = lines[0].split(',');
        let csvTranspose = {};
        keys.forEach(k => {
            csvTranspose[k] = [];
        });
        lines.slice(1).forEach(line => {
            line = line.replaceAll("\\\\", escapeReplacement).replaceAll("\\,", commaReplacement).replaceAll("\\\"", quoteReplacement).replaceAll("\"", "");
            line.split(',').reduce((acc, cur, i) => {
                csvTranspose[keys[i]].push(cur.replaceAll(escapeReplacement, "\\").replaceAll(commaReplacement, ",").replaceAll(quoteReplacement, "\""));
                return null;
            }, null);
        });
        return csvTranspose;
    };
    return CSVToJSONTranspose(csv);
}

var clearStars = function(newItem) {
    var starsArray = newItem.children().find(".fa")
    for (let i=0; i < starsArray.length; i++){
        
        var currentItem = $(starsArray.get(i));
        currentItem.removeClass( "fa-star-half-o");
        currentItem.removeClass( "checked");
        currentItem.removeClass( "fa-star");
        currentItem.addClass( "fa-star-o");
    }
};

var fillStarsHandler = function(newItem, value) {
    var ratingFloat = parseFloat(value)
    if (Number.isNaN(ratingFloat)) {
        return;
    }
 
    // initialize with all stars empty (fa-star-o)
    clearStars(newItem);
 
    var starsArray = newItem.children().find(".fa")
    for (let i=0; (i<ratingFloat && i < starsArray.length); i++){
        var currentItem = $(starsArray.get(i));
        
        // if current star idx is full, paint a full star (fa-star), otherwise, paint a semi-star (fa-star-half-o)
        // if equal or more than 0.5, color with yello (checked)
        var isCurrentStarFull = (ratingFloat - i) >= 1;
        
        if (isCurrentStarFull){
            currentItem.removeClass("fa-star-o");
            currentItem.addClass("fa-star");
        } else {
            currentItem.removeClass("fa-star-o");
            currentItem.addClass( "fa-star-half-o");
        }
        $(starsArray.get(i)).addClass( "checked" );
    }
};

const filterRestaurantCsvTransposeByName = function(restaurantsDataTranspose, restaurantName){
    let filteredCsvData = {};
    Object.keys(restaurantsDataTranspose).forEach(k=>{filteredCsvData[k] = []});
    for(var idx=0; idx < restaurantsDataTranspose["restaurantName"].length; idx++){
        if (restaurantsDataTranspose["restaurantName"][idx] === restaurantName){
            Object.keys(restaurantsDataTranspose).forEach(k => {
                filteredCsvData[k].push(restaurantsDataTranspose[k][idx]);
            });
        }
    }
    return filteredCsvData;
}


