import Joi from "joi";

export default Joi.object().keys({
    name: Joi.string().required().label("name"),
    email: Joi.string().email().required().label("email"),
    password: Joi.string().min(6).required().label("password"),
});
