const getReviewButtonKey = function(reviewButtonElement){
    return $(reviewButtonElement).parent().parent().attr("id");
}

const usefullReviewClicked = function(reviewButtonElement){
    const currentElementKey = getReviewButtonKey(reviewButtonElement);
    reviewButtonElement.style.border = "1px solid var(--red)";
    addPairToQuestionairData(currentElementKey, "1");
    $(reviewButtonElement).attr("onclick", "usefullReviewUnClicked(this)");
}

const usefullReviewUnClicked = function(reviewButtonElement){
    const currentElementKey = getReviewButtonKey(reviewButtonElement);
    reviewButtonElement.style.border = "1px solid black";
    addPairToQuestionairData(currentElementKey, "0");
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
    reviewsElement.attr("src", "../static/surveyData/graphics/avatars/"+value);
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
    reviewStars:fillStarsHandler,
    reviewerCount:textElementHandler(".reviewerCount"),
    reviewerAvatar:reviewerAvatarHandler,
    reviewerLocation:textElementHandler(".reviewerLocation"),
    EliteBadge:EliteBadgeHandler,
    reviewSubjectStars:textElementHandler(".reviewSubjectStars"),
    reviewSubjectReviewText:textElementHandler(".reviewSubjectReviewText"),
    reviewSubjectName:textElementHandler(".reviewReviewSubjectName")
};

const occupySummaryStars = function(reviewSubjectElementsData){
    let ratingSum = 0.0;
    reviewSubjectElementsData.forEach(element => {
        ratingSum += parseFloat(element["reviewStars"]);
    });
    let avgRatingPercent = (ratingSum * 100) / reviewSubjectElementsData.length;
    
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
    $(".avg-rating-num").text("" + Math.round((ratingSum / reviewSubjectElementsData.length) * 10) / 10);
    $(".count_of_revs").text("(" + reviewSubjectElementsData.length + " reviews)");
    
    
}

const occupyStarBars = function(reviewSubjectElementsData){
    let starsSummary = new Array(0, 0, 0, 0, 0, 0);
    let starsClassNames = new Array(".zero_stars", ".one_stars", ".two_stars", ".three_stars", ".four_stars", ".five_stars");
    reviewSubjectElementsData.forEach(element => {
        if (parseFloat(element["reviewStars"]) >= 4.5){
            starsSummary[5]+= 1;
        } else if (parseFloat(element["reviewStars"]) >= 3.5){
            starsSummary[4]+= 1;
        } else if (parseFloat(element["reviewStars"]) >= 2.5){
            starsSummary[3]+= 1;
        } else if (parseFloat(element["reviewStars"]) >= 1.5){
            starsSummary[2]+= 1;
        } else if (parseFloat(element["reviewStars"]) >= 0.5){
            starsSummary[1]+= 1;
        } else {
            starsSummary[0]+= 1;
        }
    });
    starsSummary.forEach((currentStarCount, i) => {
        let currentStarsClassName = starsClassNames[i];
        let element = $(".overall_Star_rating").children().find(currentStarsClassName);
        if (element.length > 0){
            element[0].style.width = (currentStarCount / reviewSubjectElementsData.length) * 100 + "%";
        }
    });

}

const occupySummaryData = function(reviewSubjectElementsData){
    occupySummaryStars(reviewSubjectElementsData);
    occupyStarBars(reviewSubjectElementsData);
    let firstReviewInfo = reviewSubjectElementsData[0];
    $(".resName").text(firstReviewInfo["reviewSubjectName"]);
    $(".resTag").text(firstReviewInfo["reviewSubjectDescription"] + firstReviewInfo["reviewSubjectLocation"]);
    let imageUrl = "url(../static/surveyData/graphics/reviewSubjects/"+ firstReviewInfo["reviewSubjectImage"] + ")";
    imageUrl += ("," + imageUrl);
    $(".resHeader")[0].style["background-image"] = imageUrl;
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
            $(newItem).attr("id", elementDataJson["reviewKey"]);
    
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
    defArr.push($.get('../static/html/singleReviewTemplate.html'));
    defArr.push($.get('../static/surveyData/reviews_data.csv'));
    defArr.push($.get('../static/surveyData/redirect_url.txt'));
    $.when.apply($,defArr).done(function(response1, response2, response3){
        const reviewTemplate = "<div>" + response1[2].responseText +"</div>";
        const reviewsCsvData = response2[2].responseText;
        const redirectPrefix = response3[2].responseText;

        var reviewsDataJson = convertCsvToJson(reviewsCsvData);
        occupyItems($(reviewTemplate), reviewsDataJson);
        $("#FinishedBTN").attr("destination", redirectPrefix);
    });
};

$(document).ready(function(){
    loadData();
});
