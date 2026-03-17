const express = require("express");
const app = express();

let port = 8080;
const path =require("path");
app.use(express.urlencoded({ extended :true}));

app.set("view engine" , "ejs");

app.set("views" , path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname, "public")));


let posts = [
    {
        id: "1a",
        username: "ayush_ukenday", 
        content :"obsession is far better than discpline"},
    {
        id: "1b",
        username: "xys", 
        content :"motivation is like a desise"},
        {
            id: "1c",
        username: " ram", 
        content :"work hard"


    }
];


app.get("/posts" , (req,res) =>{
    res.render("index.ejs" ,{posts})

});

app.get("/posts/new" , (req,res)=>{
    res.render("new.ejs")
});

app.post("/posts",(req,res)=>{
    let {username, content} = req.body;
    posts.push({username , content});
    res.redirect("/posts");

})






app.listen(port,()=>{

    console.log(`app is listening on port ${port}`);
   

});
