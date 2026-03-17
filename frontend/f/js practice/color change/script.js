

let btn = document.querySelector('button');  
btn.addEventListener('click', function(){  
    let h3 = document.querySelector("h3");

    let random =getrandomcolor();
    h3.innerText = random;
    let div = document.querySelector("div");

    div.style.backgroundColor=random;
    console.log("color is changed");   
}); 


function getrandomcolor(){
    let red =Math.floor(Math.random()*255);
     let green=Math.floor(Math.random()*255);
      let blue =Math.floor(Math.random()*255);


      let color =`rgb(${red} ${green} ${blue})`;
      return color;



}