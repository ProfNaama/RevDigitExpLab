var reviewQuestions = []
const updateGlobalQuestions = (questions) => {reviewQuestions = questions;}

var questionTemplateHtml = "";
const updateGlobalQuestionTemplate = (question_html) => {questionTemplateHtml = question_html;}

const getReviewButtonKey = function(reviewButtonElement){
    return $(reviewButtonElement).parent().parent().attr("id");
}

var submitDestinationUrl="";

let currentReviewIdx = 0;
var reviewElementsArray = [];

const renderFormSubmitButton = function() {
    if (currentReviewIdx == reviewElementsArray.length - 1) {
        $(reviewElementsArray[currentReviewIdx]).find(".formSubmit").val("Submit Survey")
    }
    else {
        $(reviewElementsArray[currentReviewIdx]).find(".formSubmit").val("Next Review")
    }
}

const nextReviewClicked = function(reviewButtonElement) {
    if (currentReviewIdx == reviewElementsArray.length - 1) {
        submitSurvey();
        return;
    }

    $(reviewElementsArray[currentReviewIdx]).hide();
    currentReviewIdx++;
    $(reviewElementsArray[currentReviewIdx]).show();

    document.body.scrollTop = document.documentElement.scrollTop = 0
    renderFormSubmitButton();
}

const onRadioButtonClicked = function(radioBtnElement){
    const currentElementKey =  $(radioBtnElement).parent().parent().parent().parent().parent().parent().parent().parent().attr("id");
    addPairToQuestionairData(currentElementKey + "_" + radioBtnElement.name, radioBtnElement.value);
}

const textElementHandler = function(jqueryLocator){
    return function(newItem, value){
        var reviewsElement = newItem.children().find(jqueryLocator);
        reviewsElement.text(value);
    }
}

const imgElementHandler = function(imgClassName, basePath="./"){
    return function(newItem, value) {
        var reviewsElement = newItem.children().find(imgClassName);
        reviewsElement.attr("src", basePath+value);
    }
};

const styleDisplayHandler = function (className) {
    return function(newItem, value) {
        var reviewsElement = newItem.children().find(className);
        if (value == "1") {
            reviewsElement[0].style.display = "inline"
        }
        else if (value == "0") {
            reviewsElement[0].style.display = "disable"
        }
    }
}

const clearStars = function (newItem) {
    var starsArray = newItem.children().find(".fa")
    for (let i = 0; i < starsArray.length; i++) {

        var currentItem = $(starsArray.get(i));
        currentItem.removeClass("fa-star-half-o");
        currentItem.removeClass("checked");
        currentItem.removeClass("fa-star");
        currentItem.addClass("fa-star-o");
    }
};

const fillStarsHandler = function (newItem, value) {
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

// for each csv column, there should be a handler function for that type of data. (key should be the same as the csv header, handler should be written)
const csvHandlersMethods = {
    reviewerName:textElementHandler(".reviewerName"),
    reviewStars:fillStarsHandler,
    reviewerCount:textElementHandler(".reviewerCount"),
    reviewerAvatar:imgElementHandler(".reviewerAvatar", "../static/surveyData/graphics/avatars/"),
    reviewerLocation:textElementHandler(".reviewerLocation"),
    EliteBadge:styleDisplayHandler(".EliteBadge"),
    reviewText:textElementHandler(".reviewText"),
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
            reviewElementsArray.push(newItem);
            // hide all reviews except the first one
            $(newItem).hide();
        }
    }
    $(reviewElementsArray[currentReviewIdx]).show();
    renderFormSubmitButton();
}

const loadReviesData = function(){
    var defArr = [];
    defArr.push($.get('../static/html/singleReviewTemplate.html'));
    defArr.push($.get('../static/surveyData/reviews_data.csv'));
    defArr.push($.get('../static/surveyData/question_bank.csv'));
    defArr.push($.get('../static/html/questionTemplate.html'));
    defArr.push($.get('../static/surveyData/redirect_url.txt'));
    $.when.apply($,defArr).done(function(response1, response2, response3, response4, response5){
        const reviewTemplate = "<div>" + response1[2].responseText +"</div>";
        const reviewsCsvData = response2[2].responseText;
        const questionBankCsv = response3[2].responseText;
        const questionHtmlTemplate = response4[2].responseText;
        submitDestinationUrl = response5[2].responseText;
        var reviewsDataJson = convertCsvToJson(reviewsCsvData);
        var questionBankJson = convertCsvToJson(questionBankCsv);
        updateGlobalQuestions(questionBankJson);
        updateGlobalQuestionTemplate(questionHtmlTemplate);
        occupyItems($(reviewTemplate), reviewsDataJson);
    });
};
