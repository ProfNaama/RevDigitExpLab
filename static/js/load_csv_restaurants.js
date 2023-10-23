
// based on: https://www.geeksforgeeks.org/how-to-convert-csv-to-json-file-and-vice-versa-in-javascript/
// added some escaping for " (\") as well as for ' (\') as well as for \ (\\)
const convertCsvToJsonTranspose = function(csv){
    const escapeReplacement = "__RESERVED_ESCAPE_PLACEHOLDER_CHAR__";
    const commaReplacement = "__RESERVED_COMMA_PLACEHOLDER_CHAR__";
    const quoteReplacement = "__RESERVED_QUOTE_PLACEHOLDER_CHAR__";

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

const restaurantStarsHandler = function(newRestaurantItem, rewtaurantTransposeDataColoumn){
    let reviewStarsHtml = newRestaurantItem.children().find(".restaurantReviewsCount");
    reviewStarsHtml.text(rewtaurantTransposeDataColoumn.length);
    let sum = 0;
    rewtaurantTransposeDataColoumn.forEach(rating => {
        sum += parseFloat(rating);
    });
    fillStarsHandler(newRestaurantItem, (sum / rewtaurantTransposeDataColoumn.length));
}

const csvTransposeHandlersMethods = {
    reviweStars:restaurantStarsHandler
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

const occupyRestaurantItems = function(loadedRestaurantElementTemplate, restaurantsDataTranspose){
    let restaurantsSet = new Set(restaurantsDataTranspose["restaurantName"]);
    
    restaurantsSet.forEach(rName => {
        var newRestaurantItem = loadedRestaurantElementTemplate.clone(true);
        newRestaurantItem.children().find(".restaurantName").text(rName);
        let filteredCsvTransposeData = filterRestaurantCsvTransposeByName(restaurantsDataTranspose, rName);
        Object.keys(restaurantsDataTranspose).forEach(k => {
            if (k in csvTransposeHandlersMethods){
                csvTransposeHandlersMethods[k](newRestaurantItem, filteredCsvTransposeData[k]);
            }
        });
        $(newRestaurantItem).appendTo('#reviewsContainer');
    });
}

const onRestaurantChosen = function(restaurantNode){
    let restaurantName = $(restaurantNode).parent().children().find(".restaurantName")[0].innerText;
    let urlHost = (new URL(window.location)).host;
    let urlParams = (new URL(window.location)).searchParams;
    let restaurantUrl = urlHost + "/views/ReviewsPage.html" + "?" + "res=" + restaurantName;

    Object.keys(urlParams).forEach(k => {
        restaurantUrl += ("&" + k + "=" + urlParams[k]);
    });
    alert(window.location.protocol + "//" + restaurantUrl);
    window.location.href = window.location.protocol + "//" + restaurantUrl;
}

var loadRestaurantsData = function(){
    var defArr = [];
    defArr.push($.get('singleRestaurantTemplate.html'));
    defArr.push($.get('../static/data/reviews_data.csv'));
    $.when.apply($,defArr).done(function(response1, response2){
        const restautantTemplate = "<div>" + response1[2].responseText +"</div>";
        const csvData = response2[2].responseText;

        var dataJsonTranspose = convertCsvToJsonTranspose(csvData);
        occupyRestaurantItems($(restautantTemplate), dataJsonTranspose);
    });
};

const submitSurvey = function(){
    // those two params must be found in the url query string, as passed on from qualtrics
    // SID is the experiment ID
    // UID is the user ID
    const QUALTRICS_EXPERIMENT_KEY = "SID";
    const QUALTRICS_USER_KEY = "UID";
    
    let urlParams = (new URL(window.location)).searchParams;
    var experiemntID = urlParams.get(QUALTRICS_EXPERIMENT_KEY);
    var userID = urlParams.get(QUALTRICS_USER_KEY);
    
    if (!(experiemntID && userID)){
        alert("some query params are missing...");
        return;
    }
    var submitUrl = "http://fppvu.qualtrics.com/SE/?" + QUALTRICS_EXPERIMENT_KEY + "=" + experiemntID + "&" + QUALTRICS_USER_KEY + "=" + userID;
    Object.keys(global_data).forEach(k => {
        submitUrl += ("&" + k + "=" + global_data[k]);
    });
    alert(submitUrl);
    window.location.href = submitUrl;
};

$(document).ready(function(){
    loadRestaurantsData();
  });

