import User from "../models/user.model.js";
import jwt from 'jsonwebtoken'
 
export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ error: "unauthrized no token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ error: "unauthrized Invalid token" });
        }

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        req.user = user;
        next();
        //next iisliye call kra hai taake iske baad voh route call ho sake jo iske baad likha hai auth.routes mei get request mei
    } catch (error) {
        console.log("error in protectroute middleware", error.message)
        res.status(500).json({
            error: "Internal server error"
        });
    }
}