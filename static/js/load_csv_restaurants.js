
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

    // in case only single restaurant, just lead to the reviews page
    if (restaurantsSet.size == 1){
        $($( ".restaurantButton")[0]).trigger( "click" );
    }
}

const onRestaurantChosen = function(restaurantNode){
    let restaurantName = $(restaurantNode).parent().children().find(".restaurantName")[0].innerText;
    let urlHost = (new URL(window.location)).host;
    let urlParams = (new URL(window.location)).searchParams;
    let restaurantUrl = urlHost + "/views/ReviewsPage.html" + "?" + "res=" + restaurantName;

    Object.keys(urlParams).forEach(k => {
        restaurantUrl += ("&" + k + "=" + urlParams[k]);
    });
    // alert(window.location.protocol + "//" + restaurantUrl);
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

$(document).ready(function(){
    loadRestaurantsData();
  });

