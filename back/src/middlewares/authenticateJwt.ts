import { Response, NextFunction } from "express";
import passport from "passport";
import { IRequest, IUser } from "types/user";

export const jwtAuthentication = async (
    req : IRequest,
    res : Response,
    next : NextFunction
) => {
    try{
        passport.authenticate(
            "jwt",
            {session : false},
            (error : Error, user : IUser, info : any) => {
                if(error){
                    console.log(error);
                    next(error);
                }
                if(info){
                    console.log(info);
                    next(info);
                }
                req.user = user;
                next();
            }
        )(req,res,next);
    }catch(error){
        console.log(error);
        next(error);
    }
};