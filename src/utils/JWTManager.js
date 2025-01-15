import config from "../config/config.js";
import jwt from "jsonwebtoken"



class JWTManager {

    async decode(token) {
        const payload = jwt.decode(token)

        return payload
    }



    
}