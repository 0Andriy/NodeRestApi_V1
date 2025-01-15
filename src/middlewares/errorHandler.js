import config from "../config/config.js"



function errorHandling(err, req, res, next) {
    config.logger.error(err)

    res.status(500).json({
        status: 500,
        message: "Something went wrong",
        error: err.message
    })
}


export default errorHandling
