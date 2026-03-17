const mongoose = require("mongoose");

const chatschema =new mongoose.Schema({

    from:{
        type:String,
        required:true
    },
    to:{
        type:String,
        required:true
    },
    msg:{
        type:String,
        maxLength:55

    },
    date:{
        type:Date,
        reqired:true

    }

});    

const Chat = mongoose.model("Chat",chatschema);
module.exports =Chat;



