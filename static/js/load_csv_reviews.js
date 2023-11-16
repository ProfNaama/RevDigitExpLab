const getReviewButtonKey = function(reviewButtonElement){
    let key = $(reviewButtonElement).parent().parent().attr("id");
    let restaurantName = $(reviewButtonElement).parent().parent().children().find(".reviewRestaurantName").text();
    return restaurantName + "_" + key;
}

const usefullReviewClicked = function(reviewButtonElement){
    const currentElementKey = getReviewButtonKey(reviewButtonElement);
    reviewButtonElement.style.border = "1px solid red";
    addPairToQuestionairData(currentElementKey, "yes");
    $(reviewButtonElement).attr("onclick", "usefullReviewUnClicked(this)");
}

const usefullReviewUnClicked = function(reviewButtonElement){
    const currentElementKey = getReviewButtonKey(reviewButtonElement);
    reviewButtonElement.style.border = "1px solid black";
    addPairToQuestionairData(currentElementKey, "no");
    $(reviewButtonElement).attr("onclick", "usefullReviewClicked(this)");
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
    reviewsElement.attr("src", "../static/graphics/avatars/"+value);
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

const occupyItems = function(loadedElementTemplate, allReviewsJson){
    const treatmentGroup = getRandomTreatmentGroup(allReviewsJson);
    clearAllPairStartingWithKey("");
    let treatmentGroupElementsJson = allReviewsJson.filter(e => e["treatmentGroup"] == treatmentGroup);
    occupySummaryData(treatmentGroupElementsJson);
    

    for(var didx=0; didx < allReviewsJson.length; didx++){
        var elementDataJson = allReviewsJson[didx];
        // we want the review idx to continue to advance regardless of the treatment group
        if (parseInt(elementDataJson["treatmentGroup"]) == treatmentGroup){
            var newItem = loadedElementTemplate.clone(true);
            $(newItem).attr("id", "item_review_id_" + didx);
    
            Object.keys(elementDataJson).forEach(columnKey => {
                if (columnKey in csvHandlersMethods){
                    csvHandlersMethods[columnKey](newItem, elementDataJson[columnKey]);
                }
            });
            $(newItem).appendTo('#reviewsContainer');
        }
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
