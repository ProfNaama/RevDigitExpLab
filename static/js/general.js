var FinishedBTN = document.getElementById("FinishedBTN");
FinishedBTN.disabled = true; 

setTimeout(()=> {
    //document.getElementById("FinishedBTN").style.display="block"
    FinishedBTN.disabled = false; 
    console.log("done");
},30000)


