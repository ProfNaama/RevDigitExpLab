var FinishedBTN = document.getElementById("FinishedBTN");
FinishedBTN.disabled = true; 

setTimeout(()=> {
    //document.getElementById("FinishedBTN").style.display="block"
    FinishedBTN.disabled = false; 
    console.log("done");
},3000)


var UsefulBTNArray = document.getElementsByClassName("UsefullBTN");
console.log(UsefulBTNArray);

UsefulBTNArray.forEach(element => {
    element.addEventListener("click", function(reviewButtonElement){
        reviewButtonElement.style.border = "1px solid red";
    })
});
