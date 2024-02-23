const redirectWithGetParams = function(submitUrl) {
    let urlParams = (new URL(window.location)).searchParams;
        if (urlParams.size > 0){
            counter = 1;
            submitUrl += "?";
            urlParams.forEach((v, k)=>{
                submitUrl += (k + "=" + v);
                if (counter < urlParams.size) {
                    submitUrl += "&"
                }
                counter += 1;
            });
        }
        window.location.href = submitUrl;
};
