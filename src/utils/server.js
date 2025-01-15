import config from "../config/config.js"

import http from "http"
import https from "https"
import express from "express"

import cors from "cors"
import cookieParser from "cookie-parser"
import compression from "compression";
import swaggerDocs from './swagger.js'

import oracleDbManager from "../db/oracleDbManager.js"

// Роути
import basicRouter from "../routes/basic/basic.route.js"
import authRouter from "../routes/auth/auth.route.js"

// Middleware
import morganMiddleware from "../middlewares/morganMiddleware.js";
import forceHttps from "../middlewares/forceHttps.js"
import errorHandling from "../middlewares/errorHandler.js"





// <=======================================================================>
// <=======================================================================>
// <=======================================================================>

const app = express()



// <=======================================================================>
// <==========================  Middlewares ===============================>
// <=======================================================================>

// Підключає middleware для стиснення відповідей (зменшує обсяг переданих даних)
app.use(
    compression({
        level: 6, // Рівень стиснення від 0 (немає стиснення) до 9 (максимальне стиснення). 
        // 6 - це оптимальний баланс між швидкістю та ефективністю.
        filter: (req, res) => {
            // Кастомний фільтр для визначення, чи потрібно застосовувати стиснення
            if (!req.headers['x-no-compression']) {
                // Якщо заголовок 'x-no-compression' не присутній, використовується стандартний фільтр для стиснення
                return compression.filter(req, res);
            }
            // Якщо заголовок 'x-no-compression' присутній, стиснення не застосовується
            return false;
        },
    })
);


// redirect http to https
app.use(forceHttps(config.server.useHttps))
// logger http request
app.use(morganMiddleware)
// To support JSON-encoded bodies -- Для того щоб Express розумів JSON в request.body
app.use(express.json())
// To support URL-encoded bodies
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(cookieParser())



// <=======================================================================>
// <========================== Routes (endpoints) =========================>
// <=======================================================================>

// default
app.use("/api/v1/", basicRouter)
// auth
app.use("/api/v1/auth", authRouter)




app.get('/', (req, res) => {

    const data = 'This is a post about how to use the compression package'.repeat(10000);

    res.send(data);

});



config.logger.error("error message")
config.logger.warn("warn message")

config.logger.error(new Error("error message"))

// <=======================================================================>
// <================  Error handling middleware  ==========================>
// <=======================================================================>
app.use(errorHandling)



// <=======================================================================>
// <=========================  http server  ===============================>
// <=======================================================================>
function initHttpServer() {
    // Create servers
    const httpServer = http.createServer(app)

    // Servers running
    httpServer.listen(config.server.ports.http, config.server.host, () => {
        // const host = httpServer.address().address;
        // const { port } = httpServer.address();
        // console.log(host, port)
        console.log(`Server is running => http://${config.server.host}:${config.server.ports.http}`)
        swaggerDocs(app, config.server.ports.http, config.server.host)
    })

}


// <=======================================================================>
// <=========================  https server  ==============================>
// <=======================================================================>
function initHttpsServer() {
    // Create servers
    const httpsServer = https.createServer(config.getSslOptions(), app)

    // Servers running
    httpsServer.listen(config.server.ports.https, config.server.host, () => {
        // const host = httpsServer.address().address;
        // const { port } = httpsServer.address();
        // console.log(host, port)
        console.log(`Server is running => https://${config.server.host}:${config.server.ports.https}`)
        swaggerDocs(app, config.server.ports.http, config.server.host)
    })

}


// <=======================================================================>
// <=========================  Run App  ===================================>
// <=======================================================================>
async function initApp() {
    // <=======================================================================>
    // <======================  Connect to database  ==========================>
    // <=======================================================================>
    await oracleDbManager.connect("db1")

    // const result = await oracleDbManager.execute("db1", "SELECT 1 FROM DUAL")
    // console.log(result)

    if (config.server.useHttp) {
        initHttpServer()
    }

    if (config.server.useHttps) {
        initHttpsServer()
    }


    process.on('SIGINT', async () => {
        await oracleDbManager.closeAllConnections();
        config.logger.info('Database connection closed');
        process.exit(0);
    });
}


// <=======================================================================>
// <============================  Run   ===================================>
// <=======================================================================>


initApp()

