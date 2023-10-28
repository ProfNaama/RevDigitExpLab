
const restaurantStarsHandler = function(newRestaurantItem, rewtaurantTransposeDataColoumn, restaurantInfoJson){
    let reviewStarsHtml = newRestaurantItem.children().find(".restaurantReviewsCount");
    reviewStarsHtml.text(rewtaurantTransposeDataColoumn.length);
    let sum = 0;
    rewtaurantTransposeDataColoumn.forEach(rating => {
        sum += parseFloat(rating);
    });
    fillStarsHandler(newRestaurantItem, (sum / rewtaurantTransposeDataColoumn.length));

    newRestaurantItem.children().find(".restaurantReviewsCount").text(rewtaurantTransposeDataColoumn.length)
    newRestaurantItem.children().find(".restaurantLocation").text(restaurantInfoJson["restaurantLocation"])
    newRestaurantItem.children().find(".restaurantDescription").text(restaurantInfoJson["restaurantDescription"])
    newRestaurantItem.children().find(".restaurantImage").attr("src", "../static/graphics/restaurants/" + restaurantInfoJson["restaurantImage"]);
}

const csvTransposeHandlersMethods = {
    reviweStars:restaurantStarsHandler,

};

const occupyRestaurantItems = function(loadedRestaurantElementTemplate, reviewsDataJson, restaurantsInfoJson){
    let restaurantSet = reviewsDataJson.reduce((acc, curr, i) => acc.add(curr["restaurantName"]), new Set());
    
    restaurantSet.forEach(rName => {
        var newRestaurantItem = loadedRestaurantElementTemplate.clone(true);
        newRestaurantItem.children().find(".restaurantName").text(rName);
        let filteredCsvTransposeData = JsonArrayToCsv(reviewsDataJson.filter(element=>element["restaurantName"] === rName));
        let restaurantInfo = restaurantsInfoJson.filter(element=>element["restaurantName"] === rName)[0];
        Object.keys(filteredCsvTransposeData).forEach(k => {
            if (k in csvTransposeHandlersMethods){
                csvTransposeHandlersMethods[k](newRestaurantItem, filteredCsvTransposeData[k], restaurantInfo);
            }
        });
        $(newRestaurantItem).appendTo('#reviewsContainer');
    });

    // in case only single restaurant, just lead to the reviews page
    if (restaurantSet.size == 1){
        $($( ".restaurantButton")[0]).trigger( "click" );
    }
}

const onRestaurantChosen = function(restaurantNode){
    let restaurantName = $(restaurantNode).parent().children().find(".restaurantName")[0].innerText;
    let urlHost = (new URL(window.location)).host;
    let urlParams = (new URL(window.location)).searchParams;
    let restaurantUrl = urlHost + "/views/ReviewsPage.html" + "?" + "res=" + restaurantName;

    urlParams.forEach((v, k) => {
        restaurantUrl += ("&" + k + "=" + v);
    });
    // alert(window.location.protocol + "//" + restaurantUrl);
    window.location.href = window.location.protocol + "//" + restaurantUrl;
}

var loadRestaurantsData = function(){
    var defArr = [];
    defArr.push($.get('singleRestaurantTemplate.html'));
    defArr.push($.get('../static/data/reviews_data.csv'));
    defArr.push($.get('../static/data/restaurant_info.csv'));
    $.when.apply($,defArr).done(function(response1, response2, response3){
        const restautantTemplate = "<div>" + response1[2].responseText +"</div>";
        const csvData = response2[2].responseText;
        const restuarantInfocsv = response3[2].responseText;

        var dataJson = convertCsvToJson(csvData);
        var restaurantsInfoJson = convertCsvToJson(restuarantInfocsv);
        occupyRestaurantItems($(restautantTemplate), dataJson, restaurantsInfoJson);
    });
};

$(document).ready(function(){
    decodeCookiesParams();
    loadRestaurantsData();
  });

