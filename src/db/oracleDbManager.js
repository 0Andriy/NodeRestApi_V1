import oracledb from "oracledb"
import config from "../config/config.js"


// Клас OracleDBManager реалізує шаблон Singleton (один екземпляр на весь проект),
// що дозволяє ефективно керувати підключеннями до бази даних через пул або без пулу.
class OracleDBManager {
    constructor(config) {
        // Дефолтні налаштування підключення до бази даних
        this.defaultConnectionSettings = {
            user: "admin",
            password: "admin",
            connectString: "admin",
            // edition: 'ORA$BASE', // used for Edition Based Redefintion
            // events: false, // whether to handle Oracle Database FAN and RLB events or support CQN
            // externalAuth: false, // whether connections should be established using External Authentication
            // homogeneous: true, // all connections in the pool have the same credentials
            // poolAlias: 'default', // set an alias to allow access to the pool via a name.
            // poolIncrement: 1, // only grow the pool by one connection at a time
            // poolMax: 4, // maximum size of the pool. (Note: Increase UV_THREADPOOL_SIZE if you increase poolMax in Thick mode)
            // poolMin: 0, // start with no connections; let the pool shrink completely
            // poolPingInterval: 60, // check aliveness of connection if idle in the pool for 60 seconds
            // poolTimeout: 60, // terminate connections that are idle in the pool for 60 seconds
            // queueMax: 500, // don't allow more than 500 unsatisfied getConnection() calls in the pool queue
            // queueTimeout: 60000, // terminate getConnection() calls queued for longer than 60000 milliseconds
            // sessionCallback: myFunction, // function invoked for brand new connections or by a connection tag mismatch
            // sodaMetaDataCache: false, // Set true to improve SODA collection access performance
            // stmtCacheSize: 30, // number of statements that are cached in the statement cache of each connection
            // enableStatistics: false // record pool usage for oracledb.getPool().getStatistics() and logStatistics()
        }


        // Дефолтні налаштування для запитів до бази
        this.defaultQueryOptions = {
            // Включення автоматичної фіксації змін
            autoCommit: true,
            // Формат результатів у вигляді об'єкта
            outFormat: oracledb.OUT_FORMAT_OBJECT,

            // Обробка специфічних типів даних (BLOB, CLOB) ....
            fetchTypeHandler: (metaData) => {
                // Tells the database to return BLOB as Buffer
                if (metaData.dbType === oracledb.DB_TYPE_BLOB) {
                    return { type: oracledb.BUFFER }
                }

                // Tells the database to return CLOB as String
                if (metaData.dbType === oracledb.DB_TYPE_CLOB) {
                    return { type: oracledb.STRING }
                }
            }
        }


        // Перевіряємо конфігурацію на необхідність ініціалізації Thick Mode для підключення
        if (config.useThickMode) {
            // enable node-oracledb Thick mode
            oracledb.initOracleClient(config.clientOpts)
        }

        // Використовувати пул підключень за замовчуванням
        this.usePool = true

        // Об'єкти для зберігання пулів і підключен
        this.pools = {}
        this.connections = {}

        // Конфігурація бази даних
        this.config = config

        // Список дозволених імен баз даних
        this.allowedNames = Object.keys(config.db)

    }



    // Функція ініціалізації сесії для підключення до бази з певним тегом
    /**
     * Initialize a session for a connection with a specific tag.
     * @param {object} connection - Database connection object
     * @param {string} requestedTag - Requested session tag
     * @param {function} callbackFn - Callback function to call after initialization
     */
    async initSession(connection, requestedTag, callbackFn) {
        console.log(`In initSession. requested tag: ${requestedTag}, actual tag: ${connection.tag}`);

        // Технічна обробка сесії (можна додати ALTER SESSION чи інші налаштування)

        callbackFn()
    }


    // Перевірка наявності підключення до бази
    /**
     * Check if the database connection or pool exists.
     * @param {string} dbName - Database name to check
     * @returns {boolean} - True if connected, false otherwise
     */
    async isDBConnected(dbName) {
        // Цей код буде перевіряти, чи є вказана назва бази даних ключем у властивості connections або pools класу OracleDBManager.
        // Якщо так, то метод поверне true, інакше - false.
        return this.connections.hasOwnProperty[dbName] || this.pools.hasOwnProperty[dbName];
    }


    // Перевірка, чи дозволено підключення до бази
    /**
     * Check if the connection to the specified database is allowed based on config.
     * @param {string} dbName - Database name to check
     * @returns {boolean} - True if allowed, false otherwise
     */
    async isDatabaseAllowed(dbName) {
        return this.allowedNames.includes(dbName);
    }


    // Підключення до бази даних з перевіркою авторизації
    /**
     * Authenticate a user and establish a database connection.
     * @param {string} dbName - Database name to connect to
     * @param {string} login - User login
     * @param {string} password - User password
     * @returns {boolean} - True if authentication is successful, false otherwise
     */
    async authConnect(dbName, login, password) {
        let connection = null

        try {
            // Формуємо конфігурацію для підключення до бази
            const dbConfig = {
                user: login,
                password: password,
                connectString: this.config.db[dbName].connectString
            }

            // Спроба підключення до бази даних
            connection = await oracledb.getConnection(dbConfig)

            console.log(`Connection was successful for user: ${login}`)

            // Авторизація пройшла успішно
            return true

        } catch (error) {
            throw new Error(`Failed to authenticate user: ${login}`)

        } finally {
            if (connection) {
                try {
                    // Закриваємо підключення після використання
                    await connection.close();

                } catch (error) {
                    console.error(err);
                }
            }
        }
    }


    // Створення підключення до бази даних
    /**
     * Connect to the specified database, using a connection pool or direct connection.
     * @param {string} dbName - Database name to connect to
     * @param {boolean} usePool - Whether to use connection pool or not
     */
    async connect(dbName, usePool = this.usePool) {
        try {
            // Формуємо конфігурацію з налаштувань бази даних
            const config = {
                ...this.defaultConnectionSettings,
                ...this.config.db[dbName]
            }


            if (usePool) {
                // Створення пулу підключень
                const pool = await oracledb.createPool(config)
                console.log(`Pool created for database: ${dbName}`)

                this.pools[dbName] = pool

                // Перевірка на наявність статистики та її логування
                if (pool.enableStatistics) {
                    const timerId = setInterval(() => {
                        pool.logStatistics()
                    }, 1000 * 60)
                }

            } else {
                // Створення окремого підключення без пулу
                const connection = await oracledb.getConnection(config)
                console.log(`Connected to database: ${dbName}`)

                this.connections[dbName] = connection
            }

        } catch (error) {
            console.log(`Error connecting to database: ${dbName}`, error)
        }
    }


    // Отримання підключення з пулу чи без нього
    /**
     * Retrieve an existing connection from the pool or direct connections.
     * @param {string} dbName - Database name
     * @param {boolean} usePool - Whether to use the connection pool or not
     * @returns {object} - Connection object
     */
    async getConnection(dbName, usePool = this.usePool) {
        let connection = null

        try {

            if (usePool) {
                connection = this.pools[dbName].getConnection()

            } else {
                connection = this.connections[dbName]
            }

            return connection

        } catch (error) {
            console.error(`No ${usePool ? 'pool' : 'connection'} found for ${dbName}`);
        }
    }


    // Закриття підключення до бази
    /**
     * Close a database connection or pool.
     * @param {string} dbName - Database name to close the connection/pool
     * @param {boolean} usePool - Whether to close a pool or a single connection
     */
    async close(dbName, usePool = this.usePool) {
        try {
            if (usePool) {
                const pool = this.pools[dbName]

                if (pool) {
                    await pool.close()
                    console.log(`Pool closed for database: ${dbName}`)

                    delete this.pools[dbName]
                }

            } else {
                const connection = this.connections[dbName]

                if (connection) {
                    await connection.close()
                    console.log(`Connection closed for database: ${dbName}`)

                    delete this.connections[dbName]
                }
            }

        } catch (error) {
            console.log(`Error closing connection or pool: ${dbName}`, error);
        }
    }


    // Закриття всіх підключень і пулів
    /**
     * Close all database connections and pools.
     */
    async closeAllConnections() {
        try {
            // Закриваємо всі пул підключення
            for (const dbName in this.pools) {
                const pool = this.pools[dbName];
                if (pool) {
                    await pool.close();
                    console.log(`Pool closed for database: ${dbName}`);
                    delete this.pools[dbName]; // Видаляємо пул з об'єкта
                }
            }

            // Закриваємо всі звичайні підключення
            for (const dbName in this.connections) {
                const connection = this.connections[dbName];
                if (connection) {
                    await connection.close();
                    console.log(`Connection closed for database: ${dbName}`);
                    delete this.connections[dbName]; // Видаляємо підключення з об'єкта
                }
            }

        } catch (error) {
            console.error("Error closing all connections: ", error);

        } finally {
            // Закриваємо всі пул підключення в оркестрації
            await oracledb.getPool().close(0);
        }
    }


    // Виконання запиту до бази даних
    /**
    * Execute a SQL query on the specified database.
    * @param {string} dbName - Database name
    * @param {string} sql - SQL query to execute
    * @param {object} params - Parameters for the SQL query
    * @param {object} options - Query-specific options
    * @param {boolean} usePool - Whether to use the connection pool or not
    * @returns {object} - Result of the query execution
    */
    async execute(dbName, sql, params = {}, options = {}, usePool = this.usePool) {
        let connection = null

        try {
            // Змішуємо стандартні і специфічні для запиту налаштування
            const generalOptions = { ...this.defaultQueryOptions, ...options }

            // Отримуємо підключення
            connection = await this.getConnection(dbName, usePool)

            // Робимо перевірку чи є якийсь конект до бази з певним імям
            if (!connection) {
                throw new Error(`Database ${dbName} is not connected or pooled`)
            }

            // Виконання SQL запиту
            const result = await connection.execute(sql, params, generalOptions)

            // Вертаємо результат
            return result

        } catch (error) {
            throw new Error(`Error executing query: ${sql} ${error}`)

        } finally {
            if (connection && usePool) {
                try {
                    // Put the connection back in the pool
                    await connection.close()

                } catch (error) {
                    throw new Error(`Error close connection ${error}`)
                }
            }
        }
    }


    // Виконання кількох запитів до бази даних
    /**
     * Execute multiple SQL queries on the specified database.
     * @param {string} dbName - Database name
     * @param {string} sql - SQL query to execute
     * @param {object} params - Parameters for the SQL query
     * @param {object} options - Query-specific options
     * @param {boolean} usePool - Whether to use the connection pool or not
     * @returns {object} - Result of the query execution
     */
    async executeMany(dbName, sql, params = {}, options = {}, usePool = this.usePool) {
        // Зміна куди буде поміщено відповідний конект
        let connection = null

        try {
            // Змішуємо стандартні і специфічні для запиту налаштування
            const generalOptions = { ...this.defaultQueryOptions, ...options }

            // Отримуємо підключення
            connection = await this.getConnection(dbName, usePool)

            // Робимо перевірку чи є якийсь конект до бази з певним імям
            if (!connection) {
                throw new Error(`Database ${dbName} is not connected or pooled`)
            }

            // Виконання кількох запитів
            const result = await connection.executeMany(sql, params, generalOptions)

            // Вертаємо результат
            return result

        } catch (error) {
            throw new Error(`Error executing queryMany: ${sql} ${error}`)

        } finally {
            if (connection && usePool) {
                try {
                    // Put the connection back in the pool
                    await connection.close()

                } catch (error) {
                    throw new Error(`Error close connection ${error}`)
                }
            }
        }
    }


    // // Виконання PL/SQL скриптів
    // /**
    //  * Execute PL/SQL script on the specified database.
    //  * @param {string} dbName - Database name
    //  * @param {string} script - PL/SQL script to execute
    //  * @param {object} params - Parameters for the SQL query
    //  * @param {object} options - Query-specific options
    //  * @param {boolean} usePool - Whether to use the connection pool or not
    //  * @returns {object} - Result of the query execution
    //  */
    // async executePLSQL(dbName, script, params = {}, options = {}, usePool = this.usePool) {
    //     // Зміна куди буде поміщено відповідний конект
    //     let connection = null

    //     try {
    //         // Змішуємо стандартні і специфічні для запиту налаштування
    //         const generalOptions = { ...this.defaultQueryOptions, ...options }

    //         // Отримуємо підключення
    //         connection = await this.getConnection(dbName, usePool)

    //         // Робимо перевірку чи є якийсь конект до бази з певним імям
    //         if (!connection) {
    //             throw new Error(`Database ${dbName} is not connected or pooled`)
    //         }

    //         // Виконуємо запит до бази
    //         const result = await connection.execute(script, params, generalOptions)

    //         // Вертаємо результат
    //         return result

    //     } catch (error) {
    //         throw new Error(`Error executing PL/SQL script: ${script} ${error}`)

    //     } finally {
    //         if (connection && usePool) {
    //             try {
    //                 await connection.close()

    //             } catch (error) {
    //                 throw new Error(`Error closing connection ${error}`)
    //             }
    //         }
    //     }
    // }
}



// Експортуємо обєкт даного класу (Singlton - один об'єкт на весь додаток)
export default new OracleDBManager(config.oracleDB)