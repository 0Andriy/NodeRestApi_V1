import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import winston from 'winston';  // Логер
import 'winston-daily-rotate-file';


import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);


// <=========================================================>
// <==================  Виключення  =========================>
// <=========================================================>
// Ігнорування SSL сертифікатів при виконанні запиту до чогось
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0



// Клас Config для управління конфігурацією
class Config {
    constructor() {
        // Визначення середовища
        this.nodeEnv = process.env.NODE_ENV || 'development';

        // Зчитування конфігурації з .env файлів
        this.loadEnvConfig()

        // Параметри сервера
        this.server = {
            host: process.env.HOST || 'localhost',
            ports: {
                http: process.env.HTTP_PORT || 8080,
                https: process.env.HTTPS_PORT || 8443
            },
            ssl: {
                keyPath: process.env.SSL_KEY_PATH || path.join(__dirname, "../../certs", './ssl/key.pem'),
                certPath: process.env.SSL_CERT_PATH || path.join(__dirname, "../../certs", './ssl/cert.pem')
            },
            useHttp: true, //process.env.USE_HTTP !== 'false', // Перемикач для HTTP сервера
            useHttps: false, //process.env.USE_HTTPS !== 'false', // Перемикач для HTTPS сервера
        };


        // Налаштування для логування
        this.logger = this.createLogger(); // Створення інстанції логера


        // Параметри токенів для доступу та оновлення
        this.tokenConfig = {
            accessToken: {
                secretKey: process.env.JWT_ACCESS_TOKEN_SECRET_KEY || 'default_access_token_secret_key', // Секретний ключ для access токена
                options: {
                    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m', // Термін дії access токена: 15 хвилин
                },
                cookie: {
                    name: process.env.JWT_ACCESS_TOKEN_COOKIE_NAME || 'accessTokenCookie', // Ім'я cookie для access токена
                    options: {
                        maxAge: process.env.JWT_ACCESS_TOKEN_COOKIE_MAX_AGE || 15 * 60 * 1000, // Термін дії cookie: 15 хвилин у мс
                        httpOnly: process.env.JWT_ACCESS_TOKEN_COOKIE_HTTP_ONLY || true, // Обмеження доступу до cookie лише через HTTP
                        secure: process.env.JWT_ACCESS_TOKEN_COOKIE_SECURE || true, // Встановлення cookie лише через HTTPS
                    },
                },
                header: {
                    name: 'Authorization', // Назва заголовка
                    prefix: 'Bearer', // Префікс для типу токена
                },
            },
            refreshToken: {
                secretKey: process.env.JWT_REFRESH_TOKEN_SECRET_KEY || 'default_refresh_token_secret_key', // Секретний ключ для refresh токена
                options: {
                    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d', // Термін дії refresh токена: 7 днів
                },
                cookie: {
                    name: process.env.JWT_REFRESH_TOKEN_COOKIE_NAME || 'refreshTokenCookie', // Ім'я cookie для refresh токена
                    options: {
                        maxAge: process.env.JWT_REFRESH_TOKEN_COOKIE_MAX_AGE || 7 * 24 * 60 * 60 * 1000, // Термін дії cookie: 7 днів у мс
                        httpOnly: process.env.JWT_REFRESH_TOKEN_COOKIE_HTTP_ONLY || true, // Обмеження доступу до cookie лише через HTTP
                        secure: process.env.JWT_REFRESH_TOKEN_COOKIE_SECURE || true, // Встановлення cookie лише через HTTPS
                    },
                },
            },
            // Додаткові параметри для налаштування токенів (за необхідності)
            generalOptions: {
                algorithm: process.env.JWT_SIGNING_ALGORITHM || 'HS256', // Алгоритм підпису токену
                issuer: process.env.JWT_ISSUER || 'defaultIssuer', // Видавець токену
                audience: process.env.JWT_AUDIENCE || 'defaultAudience', // Аудиторія токену
            },
        };


        // Налаштування для різних баз даних
        this.oracleDB = {
            useThickMode: process.env.ORACLE_USE_THICK_MODE || true, // Визначає режим підключення до OracleDB.
            clientOpts: { libDir: process.env.NODE_ORACLEDB_CLIENT_LIB_DIR || path.join(__dirname, '../../instantclient_23_6') }, // Шлях до клієнта Oracle (необхідний для "thick" режиму).
            db: {
                db1: {
                    user: process.env.DB_USER || 'test', // Користувач бази даних
                    password: process.env.DB_PASSWORD || 'test', // Пароль
                    connectString: process.env.DB_CONNECT_STRING || 'localhost/ORCL', // Рядок підключення
                    poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 1, // Мінімальний розмір пулу
                    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10, // Максимальний розмір пулу
                    poolIncrement: parseInt(process.env.DB_POOL_INCREMENT, 10) || 1, // Розмір інкремента для пулу
                    poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT, 10) || 60, // Час простою перед закриттям
                    enableStatistics: false
                },
                db2: {
                    user: process.env.DB_USER || 'admin', // Користувач бази даних
                    password: process.env.DB_PASSWORD || 'password', // Пароль
                    connectString: process.env.DB_CONNECT_STRING || 'localhost/XEPDB1', // Рядок підключення
                    poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 1, // Мінімальний розмір пулу
                    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10, // Максимальний розмір пулу
                    poolIncrement: parseInt(process.env.DB_POOL_INCREMENT, 10) || 1, // Розмір інкремента для пулу
                    poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT, 10) || 60, // Час простою перед закриттям
                    enableStatistics: false
                }
            }
        };

    }


    // Завантаження конфігурацій з .env файлів
    loadEnvConfig() {
        const envFile = path.join(__dirname, "../", `.env.${this.nodeEnv}`);
        if (fs.existsSync(envFile)) {
            dotenv.config({ path: envFile });

        } else {
            console.warn(`Configuration file ${envFile} not found. Falling back to default environment settings.`);
            dotenv.config(); // Завантажити стандартний .env файл
        }
    }


    // Отримання параметрів SSL
    getSslOptions() {
        const { keyPath, certPath } = this.server.ssl;

        try {
            return {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath)
            };

        } catch (error) {
            console.log(`Failed to read SSL files. Error: ${error.message}`);
            throw new Error('Unable to load SSL files. Please check your configuration.');
        }
    }


    // Налаштування для логера
    createLogger() {
        // Визначаємо рівні логування
        // error має найвищий пріоритет (0), а silly — найнижчий (6).
        // Логи нижчого рівня, ніж поточний, ігноруються.
        const logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            http: 3,
            verbose: 4,
            debug: 5,
            silly: 6,
        };

        // Спільний формат логів
        const getLogFormat = () => winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), // Мітка часу в форматі ISO 8601
            winston.format.errors({ stack: true }), // Логування помилок зі стеком
            winston.format.printf(({ timestamp, level, message, logMetadata, stack, ...meta }) => {
                return `${timestamp} [${level}]: ${logMetadata || ''} ${message} ${stack || ''} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
            })
            // winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
            //     // Створюємо об'єкт для JSON логу
            //     const logEntry = {
            //         timestamp,
            //         level,
            //         message,
            //         ...(Object.keys(metadata).length > 0 && { metadata }), // Додаємо metadata лише якщо вони є
            //         ...(stack && { stack }) // Додаємо stack, якщо він є
            //     };

            //     // Повертаємо JSON-стрічку з відступами (pretty print)
            //     return JSON.stringify(logEntry, null, 2);
            // })
            // winston.format.printf(({ timestamp, level, message, ...meta }) => {
            //     return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
            // })
        );

        // Кастомний JSON формат
        const getCustomJsonFormat = () => winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            winston.format.json()
        );

        // Фільтр для певного рівня
        const createLevelFilter = (level) => winston.format((info) => (info.level === level ? info : false))();

        // Динамічний транспорт - це канали, куди записуються логи (наприклад, консоль або файли
        const createTransport = (options) => {
            const { level, filename, format, filter } = options;
            return new winston.transports.DailyRotateFile({
                level, // Рівень логування
                filename: path.join(__dirname, filename), // Шлях до файлу
                datePattern: 'YYYY-MM-DD', // Щоденне розбиття логів
                zippedArchive: true, // Архівувати старі логи
                maxSize: '20m', // Максимальний розмір файлу
                maxFiles: '14d', // Максимальний термін зберігання логів
                format: filter ? winston.format.combine(filter, format) : format, // Фільтруємо логи за рівнем
            });
        };

        // Створюємо логер
        const logger = winston.createLogger({
            levels: logLevels,
            level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
            format: getLogFormat(),
            transports: [
                // Транспорт для консолі
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(), // Додає кольори залежно від рівня логування
                        winston.format.align(), // Вирівнює логи
                        winston.format.prettyPrint(), // Виводить об'єкти в красивому форматі
                        getLogFormat()
                    ),
                }),
                // Транспорт для всіх логів
                createTransport({
                    filename: '../../logs/combined/combined-%DATE%.log',
                    format: getCustomJsonFormat(),
                }),
                // Транспорт для помилок
                createTransport({
                    level: 'error',
                    filename: '../../logs/errors/error-%DATE%.log',
                    format: getCustomJsonFormat(),
                    filter: createLevelFilter('error'),
                }),
            ],
        });

        return logger;

    }


}




// Експортуємо екземпляр класу Config, як Singlton (один глобальний обєкт на весь додаток)
export default new Config();
