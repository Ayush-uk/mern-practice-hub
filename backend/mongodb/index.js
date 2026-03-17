const express =require("express");
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const Chat = require("./models/chat.js");
const methodoverride = require("method-override")

app.set("views" , path.join(__dirname , "views"));
app.set("view engine" , "ejs");
app.use(express.static(path.join(__dirname , "public")));
app.use(express.urlencoded({extended:true}));
app.use(methodoverride("_method"));


async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/watsapp');
}


main()
.then(()=>{
    console.log("connection sucessfully");
})
.catch(err => console.log(err));

app.get("/" , (req, res)=>{
  res.send("working fine");

})

app.get("/chats", async (req , res )=>{
  let chats =await  Chat.find();
  console.log(chats);
  // res.send("working");
  

  res.render("index.ejs" , {chats})

})

app.get("/chats/new" , (req,res)=>{
  res.render("new.ejs");



})

app.post("/chats" , (req,res)=>{
  let {from , msg , to} = req.body;
  let newchat = new Chat({
    from:from,
    to:to,
    msg:msg,
    date: new Date()
  });
  
  newchat.save()
  .then((res) =>{console.log("sucess")})
  .catch((err)=>{

    console.log(err)});
  
  res.redirect("/chats");



})

app.get("/chats/:id/edit", async (req,res)=>{
  let{id} = req.params;
  let chat =  await Chat.findById(id);
  res.render("edit.ejs" , {chat});

})

  app.put("/chats/:id" , async (req,res)=>{
    let{id} = req.params;
    let {msg :newmsg} = req.body;
    console.log(newmsg);

    let updatedChat = await Chat.findByIdAndUpdate(id , {msg: newmsg} ,{runValidators:true , new: true } );

    res.redirect("/chats");



})


app.delete("/chats/:id" ,async (req,res)=>{
  let{id} = req.params;
  let deletedchat =await Chat.findByIdAndDelete(id);
  console.log(deletedchat);

  res.redirect("/chats");
  


})
app.listen(8080 ,()=>{
  console.log("server is listing on 8080");
}

)


