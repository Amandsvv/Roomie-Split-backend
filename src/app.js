import express from 'express';
import session from "express-session";
import cors from "cors";
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middlewares/errorHandler.middleware.js';


const app = express();

//Enable CORS for frontend-backend communication
app.use(cors(
    {
        origin : process.env.CORS_ORIGIN || '*',
        credentials : true
    }
));

app.use(express.json({limit : "32kb"}));
app.use(express.urlencoded({extended : true, limit : "16kb"}));
app.use(express.static('public'))
app.use(cookieParser());
app.use(
    session(
        {
            secret:process.env.SESSION_SECRET || "mysecret",
            resave : false,
            saveUninitialized :true,
            cookie : {
                secure : false,
                httpOnly : true,
                maxAge : 24 * 60 * 60 * 1000, //1 day expiry
            }
        }
    )
)


// convert import to CommonJs-compatiable__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirnname = path.dirname(__filename);

import Router from './routes/user.route.js';
import GroupRoute from './routes/group.routes.js'
import notificationRoute from './routes/notification.routes.js'

app.use('/api',Router);
app.use('/api',GroupRoute)
app.use('/api/notifications',notificationRoute)

// Using the global error Handler 
app.use(errorHandler);
export {app};

