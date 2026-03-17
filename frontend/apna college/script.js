let inp = document.querySelector("input");
let button = document.querySelector("button");
let ul = document.querySelector("ul");


button.addEventListener("click", function(){
    let item = document.createElement("li");

    item.innerText=inp.value;

     let del = document.createElement("button");
    del.innerText ="delete";
    del.classList.add("delete");
     item.appendChild(del);

     ul.appendChild(item);
   
     inp.value= "";



    
});

let btns = document.querySelectorAll(".delete");
for( del of btns){
    del.addEventListener("click" , function(){
        let par = this.parentElement;
        console.log(par);

        par.remove();



    });
};
