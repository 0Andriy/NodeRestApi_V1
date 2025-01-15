import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

import path from 'path';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);


const options = {
    // Swagger definition
    // You can set every attribute except paths and swagger
    // https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md
    definition: {
        openapi: '3.0.0',
        info: {
            // API informations (required)
            title: 'REST API',
            description: 'Example of CRUD API ',
            version: '1.0.0',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'Bearer',
                    bearerFormat: "JWT"
                }
            }
        },
        // security: [
        //     {
        //         bearerAuth: []
        //     }
        // ]
    },
    // Note that this path is relative to the current directory from which the Node.js is ran, not the application itself.
    apis: [path.join(__dirname, '../**/**.js')],
}

const swaggerSpec = swaggerJsdoc(options)

function swaggerDocs(app, port, host = "localhost") {
    const endpoint = "api-docs"
    // Swagger Page
    app.use(`/${endpoint}`, swaggerUi.serve, swaggerUi.setup(swaggerSpec))

    // Docs in JSON format
    app.get(`/${endpoint}.json`, (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.send(swaggerSpec)
    })
    console.info(`Swagger docs available at => http://${host}:${port}/${endpoint}`)
}


export default swaggerDocs
