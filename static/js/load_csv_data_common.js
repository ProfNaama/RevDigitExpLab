
// based on: https://www.geeksforgeeks.org/how-to-convert-csv-to-json-file-and-vice-versa-in-javascript/
// added some escaping for " (\") as well as for ' (\') as well as for \ (\\)
const escapeReplacement = "__RESERVED_ESCAPE_PLACEHOLDER_CHAR__";
const commaReplacement = "__RESERVED_COMMA_PLACEHOLDER_CHAR__";
const quoteReplacement = "__RESERVED_QUOTE_PLACEHOLDER_CHAR__";

const convertCsvToJson = function (csv) {
    const CSVToJSON = csv => {
        csv = csv.replaceAll('\r', '');
        const lines = csv.split('\n');
        const keys = lines[0].split(',');
        return lines.slice(1).map(line => {
            line = line.replaceAll("\\\\", escapeReplacement).replaceAll("\\,", commaReplacement).replaceAll("\\\"", quoteReplacement).replaceAll("\"", "");
            let tokens = line.split(',');
            if (tokens.length == keys.length){
                return tokens.reduce((acc, cur, i) => {
                    const toAdd = {};
                    toAdd[keys[i]] = cur.replaceAll(escapeReplacement, "\\").replaceAll(commaReplacement, ",").replaceAll(quoteReplacement, "\"");
                    return { ...acc, ...toAdd };
                }, {});
            }
        });
    };
    let allJson = CSVToJSON(csv);
    return allJson.filter(e => e);
}

const JsonArrayToCsv = function (jsonArray) {
    let allColumns = new Set();
    jsonArray.forEach(jsonObject => {
        Object.keys(jsonObject).forEach(k => allColumns.add(k));
    });

    let csvData = {};
    allColumns.forEach(c => csvData[c] = []);
    jsonArray.forEach(jsonObject => {
        Object.keys(csvData).forEach(k => {
            if (k in jsonObject) {
                csvData[k].push(jsonObject[k]);
            } else {
                csvData[k].push(null);
            }
        });
    })
    return csvData;
}

const convertCsvToJsonTranspose = function (csv) {
    let jsonData = convertCsvToJson(csv);
    return JsonArrayToCsv(jsonData);
}

var clearStars = function (newItem) {
    var starsArray = newItem.children().find(".fa")
    for (let i = 0; i < starsArray.length; i++) {

        var currentItem = $(starsArray.get(i));
        currentItem.removeClass("fa-star-half-o");
        currentItem.removeClass("checked");
        currentItem.removeClass("fa-star");
        currentItem.addClass("fa-star-o");
    }
};

var fillStarsHandler = function (newItem, value) {
    var ratingFloat = parseFloat(value)
    if (Number.isNaN(ratingFloat)) {
        return;
    }

    // initialize with all stars empty (fa-star-o)
    clearStars(newItem);

    var starsArray = newItem.children().find(".fa")
    for (let i = 0; (i < ratingFloat && i < starsArray.length); i++) {
        var currentItem = $(starsArray.get(i));

        // if current star idx is full, paint a full star (fa-star), otherwise, paint a semi-star (fa-star-half-o)
        // if equal or more than 0.5, color with yello (checked)
        var isCurrentStarFull = (ratingFloat - i) >= 1;

        if (isCurrentStarFull) {
            currentItem.removeClass("fa-star-o");
            currentItem.addClass("fa-star");
        } else {
            currentItem.removeClass("fa-star-o");
            currentItem.addClass("fa-star-half-o");
        }
        $(starsArray.get(i)).addClass("checked");
    }
};

const addPairToQuestionairData = function(k,v){
    let sessionData = decodeSessionParams();
    sessionData[k] = v;
    encodeSessionParams(sessionData);
}

const clearAllPairStartingWithKey = function(removePrefix){
    let sessionData = decodeSessionParams();
    let filteredSessionData = {};
    Object.keys(sessionData).filter(k => {return !k.startsWith(removePrefix)}).forEach(k => filteredSessionData[k]=sessionData[k]);
    encodeSessionParams(filteredSessionData);
}

const QUESTIONAIRE_DATA_KEY = "__QQ__=";
const INTERNAL_SEPARATOR = "__SEP__";
const INTERNAL_EQUAL = "__EQ__";

const encodeSessionParams = function (sessionData) {
    let decodedArray = []
    Object.keys(sessionData).forEach(k => {
        decodedArray.push(k + INTERNAL_EQUAL + sessionData[k]);
    });
    let decodedDataString = decodedArray.join(INTERNAL_SEPARATOR);
    sessionStorage.setItem(QUESTIONAIRE_DATA_KEY, decodedDataString);
}

const decodeSessionParams = function () {
    let sessionData = {};
    let encodedDataString = sessionStorage.getItem(QUESTIONAIRE_DATA_KEY);
    if (encodedDataString){
        encodedDataString.split(INTERNAL_SEPARATOR).forEach(kv => {
            let keyvalue = kv.split(INTERNAL_EQUAL);
            sessionData[keyvalue[0]] = keyvalue[1];
        });
    }
    return sessionData;ß
}


const TREATMENT_GROUP_PARAM = "IDRAND"
const getRandomTreatmentGroup = function(restaurantElementsJson){
    let treatmentGroupCache = sessionStorage.getItem(TREATMENT_GROUP_PARAM);
    if (treatmentGroupCache){
        return parseInt(treatmentGroupCache);
    }
    
    let treatmentGroups = new Set();
    restaurantElementsJson.forEach(element => {
        treatmentGroups.add(parseInt(element["treatmentGroup"]));
    });
        
    let elementIdx = null;
    let urlParams = (new URL(window.location)).searchParams;
    let treatmentGroupSearchParam = urlParams.get(TREATMENT_GROUP_PARAM);
    
    if (treatmentGroupSearchParam){
        elementIdx = (parseInt(treatmentGroupSearchParam) % treatmentGroups.size);
    } else {
        elementIdx = Math.floor(Math.random() * treatmentGroups.size);
    }
    let treatmentGroupID = Array.from(treatmentGroups)[elementIdx];
    sessionStorage.setItem(TREATMENT_GROUP_PARAM, treatmentGroupID);
    return treatmentGroupID;
}

const submitSurvey = function() {
    // the query parameter "UID" must be found in the url query string, as passed on from the feeding platform
    // UID is the user ID
    const UNIQUE_USER_KEY = "UID";
    
    let urlParams = (new URL(window.location)).searchParams;
    var userID = urlParams.get(UNIQUE_USER_KEY);
    
    if (!userID){
        alert("GET query parameter is missing: " + UNIQUE_USER_KEY);
        return;
    }    
    
    // treatmentGroup id should already be in session storage after page load.
    let treatmentGroupCache = getRandomTreatmentGroup(null);
    if (!treatmentGroupCache){
        alert("problem... no treatment group found... please refresh the page or open another tab and try again...");
        return;
    }

    let submitUrlBase = $("#FinishedBTN").attr("destination");
    if (submitUrlBase.search("\\?") == -1){
        submitUrlBase += "?";
    }
    else {
        submitUrlBase += "&";
    }
    let submitUrl = submitUrlBase + "treatment_group_id" + "="+ treatmentGroupCache;
    urlParams.forEach((v, k)=>{
        submitUrl += ("&" + k + "=" + v);
    });
    let sessionData = decodeSessionParams();
    Object.keys(sessionData).forEach(k => {
        submitUrl += ("&" + k + "=" + sessionData[k]);
    });
    window.location.href = submitUrl;
};
