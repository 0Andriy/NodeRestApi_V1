createLogger() {
    // https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/

    // Визначаємо рівні логування
    const logLevels = {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
    };

    const errorFilter = winston.format((info, opts) => {
        return info.level === 'error' ? info : false;
    });

    const httpFilter = winston.format((info, opts) => {
        return info.level === 'http' ? info : false;
    });

    // Створюємо спільний формат для логів, який буде використовуватися в усіх транспортах
    const logFormat = winston.format.combine(
        winston.format.errors({ stack: true }),  // Додаємо стек помилки
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),  // Додаємо стандартну мітку часу (ISO формат 8601)
        winston.format.printf(({ timestamp, level, message, logMetadata, stack }) => {
            return `${timestamp} [${level}]: ${logMetadata || "undefined"} ${message} ${stack || ""}`;  // Формат виведення логів
        })
    );

    // Кастомний формат JSON
    const customJsonFormat = winston.format.combine(
        logFormat,
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, logMetadata, stack }) => {
            return `{"timestamp": "${timestamp}", "level": "${level}", "message": "${message}"}`;
        }),
        winston.format.json()  // Виведення в JSON формат (потрібно для структурованих даних)
    );


    const logger = winston.createLogger({
        levels: logLevels,
        level: this.nodeEnv === 'development' ? 'debug' : 'info',  // Встановлюємо рівень логування: debug для розробки, info для продакшн
        format: logFormat, // Встановлюємо спільний формат для всіх логів
        transports: [
            // Транспорт для логування доступу (для виведення в консоль)
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),  // Додаємо кольорове виділення рівня логування
                    winston.format.align(), // Вирівнювання логів
                    logFormat  // Використовуємо спільний формат
                ),
            }),
            // // Транспорт для всіх логів у окремий файл
            // new winston.transports.File({
            //     filename: path.join(__dirname, '../../logs/combined.log'),
            //     format: winston.format.combine(
            //         customJsonFormat,  // Використовуємо спільний формат
            //     ),
            // }),
            new winston.transports.DailyRotateFile({
                filename: path.join(__dirname, '../../logs/combineds', 'combined-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: "20m",
                maxFiles: '14d',
                format: winston.format.combine(
                    customJsonFormat,  // Використовуємо спільний формат
                ),
                // format: winston.format.combine(
                //     winston.format.errors({ stack: true }),
                //     winston.format.timestamp(),
                //     winston.format.json(),
                // ),
            }),
            // Транспорт для логів помилок у окремий файл
            new winston.transports.DailyRotateFile({
                level: 'error', // Для помилок
                filename: path.join(__dirname, '../../logs/errors/error-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: "20m",
                maxFiles: '14d',
                format: winston.format.combine(
                    errorFilter(),
                    customJsonFormat,  // Використовуємо спільний формат
                ),
            }),
        ]
    });


    // Додаємо метод для звертання до кастомного рівня "request"
    // logger.request = (message) => {
    //     logger.log('request', message);  // Логування з рівнем 'request'
    // };


    return logger
}


