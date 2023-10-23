
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

const occupyItems = function(loadedElementTemplate, elementsData){
    for(var didx=0; didx < elementsData.length; didx++){
        var newItem = loadedElementTemplate.clone(true);
        $(newItem).attr("id", "item_review_id_" + didx);
        var elementDataJson = elementsData[didx];

        Object.keys(elementDataJson)
        .forEach(columnKey => {
            if (columnKey in csvHandlersMethods){
                csvHandlersMethods[columnKey](newItem, elementDataJson[columnKey]);
            }
        });

        $(newItem).appendTo('#reviewsContainer');
    }
}


var global_data = {};
const toggleCheckbox = function(element) {
    alert(element);
    var currentElementId = $(element).parent().parent().parent().attr("id");
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


const loadData = function(){
    var defArr = [];
    defArr.push($.get('singleReviewTemplate.html'));
    defArr.push($.get('singleRestaurantTemplate.html'));
    defArr.push($.get('../static/data/reviews_data.csv'));
    $.when.apply($,defArr).done(function(response1, response2, response3){
        // const reviewTemplate = "<div>" + response1[2].responseText + "</div>";
        const reviewTemplate =  response1[2].responseText ;
        const restautantTemplate = "<div>" + response2[2].responseText +"</div>";
        const csvData = response3[2].responseText;

        var dataJson = convertCsvToJson(csvData);
        occupyItems($(reviewTemplate), dataJson);
    });
};

$(document).ready(function(){
    loadData();
});
