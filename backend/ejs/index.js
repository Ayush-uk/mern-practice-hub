const express = require("express");
const app = express();

let port = 8080;

app.set("view engine" , "ejs");
app.get("/" , (req,res)=>{
    res.render("home.ejs");
});

app.use("/hello" , (req,res)=>{
    res.send("hello");
});


app.listen(port,()=>{

    console.log(`app is listening on port ${port}`);
   

});

