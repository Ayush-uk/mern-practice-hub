const mongoose = require('mongoose');
const Chat = require("./models/chat.js");

main()

.then(()=>{
    console.log("connection sucessfully");
})
.catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/watsapp');
};


let allchats = ([{
    from:"ayush",
    to:"gouri",
    msg:"hey what's going on",
    date: new Date()

},
{
    from:"pranit",
    to:"gaorav",
    msg:"hey what's going on",
    date: new Date()

},
{
    from:"amalti",
    to:"ammal",
    msg:"hey what's going on",
    date: new Date()

},
{
    from:"bassir",
    to:"kuknika",
    msg:"hey what's going on",
    date: new Date()

},
{
    from:"taniya",
    to:"neelam",
    msg:"hey what's going on",
    date: new Date()

},
{
    from:"awez",
    to:"nagma",
    msg:"hey what's going on",
    date: new Date()

},


]);
Chat.insertMany(allchats);
