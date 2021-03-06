import * as express from "express";
import {IndexRouter} from "./routers/index";
import * as bodyParser from "body-parser";
import {MessageRoute} from "./routers/msgs"
import * as passport from "passport";
import * as localStrategy from "passport-local-mongoose";
import * as mongoose from "mongoose";
import {UserModel} from "./model/user";
import {SendMessage} from "./routers/sendMessageRoute/sendMessage";
import { MongoError } from "./node_modules/@types/mongodb";


class App
{

    public constructor()
    {
        let app : express.Application = express();
        
        //connection
        let db_url = process.env.DATABASEURL || "mongodb://localhost:27017/autoSMS_121" 

        //setting
        app.set("view engine", "ejs");

        mongoose.connect(db_url, {useNewUrlParser: true}, (err: MongoError) => 
        {
            console.log(err);
        });


        //use
        app.use(express.static("public"));
        app.use(bodyParser.urlencoded({ extended: true }))
        app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
        app.use(passport.initialize());
        app.use(passport.session());

        
        
        let userModel:UserModel = new UserModel();
        let User: mongoose.Model<mongoose.Document> = userModel.getCollection();

        //casting collection to PassportLocalModel<Docuemnt>
        passport.use((User as mongoose.PassportLocalModel<mongoose.Document>).createStrategy());
        passport.serializeUser((User as mongoose.PassportLocalModel<mongoose.Document>).serializeUser());
        passport.deserializeUser((User as mongoose.PassportLocalModel<mongoose.Document>).deserializeUser());
        
        //this method will create an accout
        userModel.checkUser();
        
        //instantiate the class of UserCollection   
        this.handleRouter(app, userModel.getCollection());

        this.listen(app);
    }

 
    private handleRouter(app:express.Application, user:mongoose.Model<mongoose.Document>):void
    {
        let indexRouter:IndexRouter = new IndexRouter();
        let messageRouter:MessageRoute = new MessageRoute(user);
        let sender:SendMessage = new SendMessage(app);
        app.use("/", indexRouter.getRouter());
        app.use("/msgs", messageRouter.getRouter());
        app.use("/sendMessage", sender.getRouter());
    }    


    private listen(app:express.Application):void 
    {

        let port = process.env.PORT || 3000;

        app.listen(port, () =>
        {
            console.log("Server started");
        });
    }
}

//starting app
new App();