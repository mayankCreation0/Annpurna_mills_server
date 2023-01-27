const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req,res,next)=>{
    try{
        let token = req.headers.authorization;
        if(token){
            token = token.split(" ")[1];
            let user = jwt.verify(token,process.env.SECRET_KEY);
            req.userid = user._id;
        }
        else{
            console.log("Unauthorized user");
            res.status(400).json({message:'Unauthorized user'})
        }
        next();
    }
    catch(err){
        console.log(err);
        res.status(400).json({message:'Unauthorized user'})
    }
}
module.exports = auth;