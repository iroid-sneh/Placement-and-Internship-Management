export const validate = (schema, target = "body") => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[target], {
            abortEarly: false,
            convert: true,
            stripUnknown: true,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0]?.message || "Validation failed",
                errors: error.details.map((detail) => detail.message),
            });
        }

        req[target] = value;
        return next();
    };
};
