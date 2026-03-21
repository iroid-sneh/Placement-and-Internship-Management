import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { JWT } from "../constants/constant.js";
import User from "../../../models/user.js";

const cookieExtractor = function (req) {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies["token"];
    }
    return token;
};

const options = {
    jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // For mobile/API
        cookieExtractor, // For web
    ]),
    secretOrKey: JWT.SECRET,
};

passport.use(
    new JwtStrategy(options, async (jwtPayload, done) => {
        try {
            // Verify user still exists
            const user = await User.findById(jwtPayload.id);
            if (!user) {
                return done(null, false);
            }

            return done(null, {
                userId: jwtPayload.id,
                email: jwtPayload.email,
                name: jwtPayload.name,
            });
        } catch (err) {
            return done(err, false);
        }
    })
);

export default passport;
