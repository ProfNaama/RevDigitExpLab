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

const delayQuestionFormMillis = 5 * 1000; // 10 seconds
const enableReviewWithHiddenQuestions = function(currentReviewIdx){
    $(reviewElementsArray[currentReviewIdx]).show();
    $(reviewElementsArray[currentReviewIdx]).find(".RatingForm").hide();
    setTimeout(() => {
        $(reviewElementsArray[currentReviewIdx]).find(".RatingForm").show();

    }, delayQuestionFormMillis);
};

const nextReviewClicked = function(reviewButtonElement) {
    if (currentReviewIdx == reviewElementsArray.length - 1) {
        submitSurvey();
        return;
    }

    $(reviewElementsArray[currentReviewIdx]).hide();
    currentReviewIdx++;
    enableReviewWithHiddenQuestions(currentReviewIdx);
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

const occupySummaryStars = function(reviewSubjectElementsData, newItem = null){
    let ratingSum = 0.0;
    reviewSubjectElementsData.forEach(element => {
        ratingSum += parseFloat(element["reviewStars"]);
    });
    let avgRatingPercent = (ratingSum * 100) / reviewSubjectElementsData.length;
    if (newItem == null){
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
    } else {
        $(newItem.children().find(".star-over")).each((idx, starElement) => {
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
        $(newItem.children().find(".avg-rating-num")).text("" + Math.round((ratingSum / reviewSubjectElementsData.length) * 10) / 10);
        $(newItem.children().find(".count_of_revs")).text("(" + reviewSubjectElementsData.length + " reviews)");
    }
}

const occupyStarBars = function(reviewSubjectElementsData, newItem = null){
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
        let element = [];
        if (newItem == null){
            element = $(".overall_Star_rating").children().find(currentStarsClassName);
        } else {
            element = $(newItem.children().find(".overall_Star_rating")).children().find(currentStarsClassName);
        }
        if (element.length > 0){
            element[0].style.width = (currentStarCount / reviewSubjectElementsData.length) * 100 + "%";
        }
    });

}

const occupySummaryData = function(reviewSubjectElementsData, newItem = null){
    occupySummaryStars(reviewSubjectElementsData, newItem);
    occupyStarBars(reviewSubjectElementsData, newItem);
    let firstReviewInfo = reviewSubjectElementsData[0];
    let imageUrl = "url(../static/surveyData/graphics/reviewSubjects/"+ firstReviewInfo["reviewSubjectImage"] + ")";
    imageUrl += ("," + imageUrl);
    if (newItem == null){
        $(".resName").text(firstReviewInfo["reviewSubjectName"]);
        $(".resTag").text(firstReviewInfo["reviewSubjectDescription"] + firstReviewInfo["reviewSubjectLocation"]);
        $(".resHeader")[0].style["background-image"] = imageUrl;
    } else {
        $(newItem.children().find(".resName")).text(firstReviewInfo["reviewSubjectName"]);
        $(newItem.children().find(".resTag")).text(firstReviewInfo["reviewSubjectDescription"] + firstReviewInfo["reviewSubjectLocation"]);
        $(newItem.children().find(".resHeader"))[0].style["background-image"] = imageUrl;
    }
}

const occupyItems = function(loadedElementTemplate, allReviewsJson){
    const treatmentGroup = getRandomTreatmentGroup(allReviewsJson);
    clearAllPairStartingWithKey("");
    let treatmentGroupElementsJson = allReviewsJson.filter(e => e["treatmentGroup"] == treatmentGroup);
    treatmentGroupElementsJson.forEach(elementDataJson => {
        let newItem = loadedElementTemplate.clone(true);    
            $(newItem).attr("id", elementDataJson["reviewKey"]);
            occupySummaryData([elementDataJson], newItem);
    
            Object.keys(elementDataJson).forEach(columnKey => {
                if (columnKey in csvHandlersMethods){
                    csvHandlersMethods[columnKey](newItem, elementDataJson[columnKey]);
                }
            });    
            $(newItem).appendTo('#reviewsContainer');    
            reviewElementsArray.push(newItem);
            // hide all reviews except the first one
            $(newItem).hide();
    });
    enableReviewWithHiddenQuestions(currentReviewIdx);
    renderFormSubmitButton();
}

function groupLikertQuestions(likertQuestions) {
    let groupedQuestions = [];
    likertQuestions.forEach(function(question) {
        if (question["label"] && question["label"] != "") {
            let key = question["leftmost_label"] + ";" + question["rightmost_label"];
            if (groupedQuestions.length == 0 || groupedQuestions[groupedQuestions.length - 1].key != key) {
                groupedQuestions.push({key: key, questions: []});
            }
            groupedQuestions[groupedQuestions.length - 1].questions.push(question);
        }
    });
    return groupedQuestions.map(function(group) {return group.questions;});
};

function onTemplateInstanceLoad() {
    let ratingForms = $(".RatingForm");
    let ratingForm = $(ratingForms[ratingForms.length - 1]);
    let groupedQuestions = groupLikertQuestions(reviewQuestions);
    groupedQuestions.forEach(function(group) {
        let is_likert = group[0]["is_likert"];
        let is_label = group[0]["is_label"];

        let currentRableElement = ratingForm.find(".ratingGroupTableTemplate").clone(true);
        if (is_likert == "1") {
            let groupLeftLabel = group[0]["leftmost_label"];
            let groupRightLabel = group[0]["rightmost_label"];
            currentRableElement.removeAttr("hidden");
            currentRableElement.attr("class", "ratingGroupTable");
            currentRableElement.find(".ratingFormLeftmostText").text(groupLeftLabel);
            currentRableElement.find(".ratingFormRightmostText").text(groupRightLabel);
            let formQuestions = currentRableElement.find(".RatingFormQuestions")

            group.forEach(function(question) {
                let q = $(questionTemplateHtml).clone(true);
                q.removeAttr("id");
                if ("label" in question && question.label != "") {
                    q.find(".Q").text(question.label);
                    q.find(".range_radio_btn").attr("name", question.name);
                    q.appendTo(formQuestions);
                    q.show();
                }
            });
        }
        if (is_label == "1") {
            let h6Element = $("<h6>");
            h6Element.attr("class", "Q_label");
            h6Element.text(group[0]["label"]);
            currentRableElement = h6Element;
        }
        currentRableElement.appendTo(ratingForm);
    });
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
