const usefullReviewClicked = function(reviewButtonElement){
    let key = $(reviewButtonElement).parent().parent().attr("id");
    let restaurantName = $(reviewButtonElement).parent().parent().children().find(".reviewRestaurantName").text();
    const currentElementKey = restaurantName + "_" + key;
    reviewButtonElement.style.background = "red";
    addPairToQuestionairData(currentElementKey, "yes");
}

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
    restaurantReviewText:textElementHandler(".restaurantReviewText"),
    restaurantName:textElementHandler(".reviewRestaurantName")
};


const occupySummaryStars = function(restaurantElementsData){
    let ratingSum = 0.0;
    restaurantElementsData.forEach(element => {
        ratingSum += parseFloat(element["reviweStars"]);
    });
    let avgRatingPercent = (ratingSum * 100) / restaurantElementsData.length;
    
    $(".star-over").each((idx, starElement) => {
        if (avgRatingPercent >= 100.0){
            $(starElement).removeClass("empty-star");
            $(starElement).addClass("full-star");
        }
        else if (avgRatingPercent > 0){
            $(starElement).removeClass("empty-star");
            $(starElement).addClass("partially-full-star");
            starElement.style.width =  "" + avgRatingPercent + "%";

        }
        avgRatingPercent -= 100.0;
    });
    $(".avg-rating-num").text("" + Math.round((ratingSum / restaurantElementsData.length) * 10) / 10);
    $(".count_of_revs").text("(" + restaurantElementsData.length + " reviews)");
    
    
}

const occupyStarBars = function(restaurantElementsData){
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

}

const occupySummaryData = function(restaurantElementsData){
    occupySummaryStars(restaurantElementsData);
    occupyStarBars(restaurantElementsData);
    let firstReviewInfo = restaurantElementsData[0];
    $(".resName").text(firstReviewInfo["restaurantName"]);
    $(".resTag").text(firstReviewInfo["restaurantDescription"] + firstReviewInfo["restaurantLocation"]);
    let imageUrl = "url(../static/graphics/restaurants/"+ firstReviewInfo["restaurantImage"] + ")";
    imageUrl += ("," + imageUrl);
    $(".resHeader")[0].style["background-image"] = imageUrl;
}

const occupyItems = function(loadedElementTemplate, elementsJsonData){
    let restaurantName = elementsJsonData[0]["restaurantName"];
    clearAllPairStartingWithKey(restaurantName);
    let restaurantElementsJson = elementsJsonData.filter(e => e["restaurantName"] === restaurantName);
    occupySummaryData(restaurantElementsJson);

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

const loadData = function(){
    var defArr = [];
    defArr.push($.get('singleReviewTemplate.html'));
    defArr.push($.get('../static/data/reviews_data.csv'));
    $.when.apply($,defArr).done(function(response1, response2){
        const reviewTemplate = "<div>" + response1[2].responseText +"</div>";
        const reviewsCsvData = response2[2].responseText;

        var reviewsDataJson = convertCsvToJson(reviewsCsvData);
        occupyItems($(reviewTemplate), reviewsDataJson);
    });
};

$(document).ready(function(){
    loadData();
});
