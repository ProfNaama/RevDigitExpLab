
var fillReviewsCountHandler = function(newItem, value){
    var reviewsElement = newItem.children().find(".reviews-count");
    reviewsElement.text(parseInt(value));
}

var textElementHandler = function(jqueryLocator){
    return function(newItem, value){
        var reviewsElement = newItem.children().find(jqueryLocator);
        reviewsElement.text(value);
    }
}

var reviewerAvatarHandler = function(newItem, value){
    var reviewsElement = newItem.children().find(".reviewerAvatar");
    reviewsElement.attr("src", "../static/graphics/"+value);
};

var EliteBadgeHandler = function (newItem, value) {
    var reviewsElement = newItem.children().find(".EliteBadge");
    if (value == "1") {
        reviewsElement[0].style.display = "inline"
    }
}

// for each csv column, there should be a handler function for that type of data. (key should be the same as the csv header, handler should be written)
const csvHandlersMethods = {
    reviewerName:textElementHandler(".reviewerName"),
    reviweStars:fillStarsHandler,
    reviewerCount:textElementHandler(".reviewerCount"),
    reviewerAvatar:reviewerAvatarHandler,
    reviewerLocation:textElementHandler(".reviewerLocation"),
    EliteBadge:EliteBadgeHandler,
    restaurantStars:textElementHandler(".restaurantStars"),
    restaurantReviewText:textElementHandler(".restaurantReviewText")
};

const occupySummaryData = function(restaurantElementsData, restaurantInfo){
    let starsSummary = new Array(0, 0, 0, 0, 0, 0);
    let starsClassNames = new Array(".zero_stars", ".one_stars", ".two_stars", ".three_stars", ".four_stars", ".five_stars");
    restaurantElementsData.forEach(element => {
        if (parseFloat(element["reviweStars"]) >= 4.5){
            starsSummary[5]+= 1;
        } else if (parseFloat(element["reviweStars"]) >= 3.5){
            starsSummary[4]+= 1;
        } else if (parseFloat(element["reviweStars"]) >= 2.5){
            starsSummary[3]+= 1;
        } else if (parseFloat(element["reviweStars"]) >= 1.5){
            starsSummary[2]+= 1;
        } else if (parseFloat(element["reviweStars"]) >= 0.5){
            starsSummary[1]+= 1;
        } else {
            starsSummary[0]+= 1;
        }
    });
    starsSummary.forEach((currentStarCount, i) => {
        let currentStarsClassName = starsClassNames[i];
        let element = $(".overall_Star_rating").children().find(currentStarsClassName);
        if (element.length > 0){
            element[0].style.width = (currentStarCount / restaurantElementsData.length) * 100 + "%";
        }
    });

    $(".restaurantName").text(restaurantInfo["restaurantName"]);
    $(".restaurantDescription").text(restaurantInfo["restaurantDescription"] + restaurantInfo["restaurantLocation"]);
    $(".restaurantImage").attr("src", "../static/graphics/restaurants/" + restaurantInfo["restaurantImage"]);
}

const occupyItems = function(loadedElementTemplate, elementsJsonData, restaurantDataJson){
    let urlParams = (new URL(window.location)).searchParams;
    let restaurantName = urlParams.get("res");
    let restaurantElementsJson = elementsJsonData.filter(e => e["restaurantName"] === restaurantName);
    let restaurantInfo = restaurantDataJson.filter(e => e["restaurantName"] === restaurantName)[0];
    occupySummaryData(restaurantElementsJson, restaurantInfo);

    for(var didx=0; didx < restaurantElementsJson.length; didx++){
        var newItem = loadedElementTemplate.clone(true);
        $(newItem).attr("id", "item_review_id_" + didx);
        var elementDataJson = restaurantElementsJson[didx];

        Object.keys(elementDataJson).forEach(columnKey => {
            if (columnKey in csvHandlersMethods){
                csvHandlersMethods[columnKey](newItem, elementDataJson[columnKey]);
            }
        });

        $(newItem).appendTo('#reviewsContainer');
    }
}


var global_data = {};
const toggleCheckbox = function(element) {
    var currentElementId = $(element).parent().parent().attr("id");
    global_data["key_" + currentElementId] = element.checked;
};

const submitSurvey = function() {
    // those two params must be found in the url query string, as passed on from qualtrics
    // SID is the experiment ID
    // UID is the user ID
    const QUALTRICS_EXPERIMENT_KEY = "SID";
    const QUALTRICS_USER_KEY = "UID";
    
    let urlParams = (new URL(window.location)).searchParams;
    var experiemntID = urlParams.get(QUALTRICS_EXPERIMENT_KEY);
    var userID = urlParams.get(QUALTRICS_USER_KEY);
    var restaurantName = urlParams.get("res");
    
    if (!(experiemntID && userID)){
        alert("some query params are missing...");
        return;
    }
    var submitUrl = "http://fppvu.qualtrics.com/SE/?";
    urlParams.forEach((v, k)=>{
        submitUrl += ("&" + k + "=" + v);
    });
    Object.keys(global_data).forEach(k => {
        submitUrl += ("&" + k + "=" + global_data[k]);
    });
    alert(submitUrl);
    window.location.href = submitUrl;
};


const loadData = function(){
    var defArr = [];
    defArr.push($.get('singleReviewTemplate.html'));
    defArr.push($.get('../static/data/reviews_data.csv'));
    defArr.push($.get('../static/data/restaurant_info.csv'));
    $.when.apply($,defArr).done(function(response1, response2, response3){
        const reviewTemplate = "<div>" + response1[2].responseText +"</div>";
        const reviewsCsvData = response2[2].responseText;
        const restaurantCsvData = response3[2].responseText;

        var reviewsDataJson = convertCsvToJson(reviewsCsvData);
        var restaurantDataJson = convertCsvToJson(restaurantCsvData);
        occupyItems($(reviewTemplate), reviewsDataJson,restaurantDataJson);
    });
};

$(document).ready(function(){
    loadData();
});
