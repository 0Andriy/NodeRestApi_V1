
class CustomError extends Error {
    /**
     * Конструктор класу CustomError
     * @param {number} statusCode HTTP статус код помилки
     * @param {string} message Повідомлення про помилку
     * @param {Array} errors Масив додаткових помилок (необов'язково)
    */
    constructor(statusCode, message, errors = []){
        super(message)
        this.name = this.constructor.name
        this.statusCode = statusCode
        this.errors = errors

        Error.captureStackTrace(this, this.constructor);
    }


    // Сервер не може або не буде обробляти запит через щось, 
    // що сприймається як помилка клієнта (наприклад, неправильний синтаксис, формат або маршрутизація запиту).
    static BadRequest(message, errors = []) {
        return new CustomError(400, message, errors)
    }


    // Хоча стандарт HTTP визначає цю відповідь як "неавторизовану", семантично вона означає "неавтентифіковану". 
    // Це означає, що клієнт повинен аутентифікувати себе, щоб отримати запитану відповідь.
    static Unauthorized(message = "Користувач не авторизований.", errors = []) {
        return new CustomError(401, message, errors = [])
    }


    // Клієнт не має прав доступу до контенту, тобто він неавторизований, тому сервер відмовляється надати запитаний ресурс. 
    // На відміну від 401 Unauthorized, особистість клієнта відома серверу.
    static Forbidden(message, errors = []) {
        return new CustomError(403, message, errors = [])
    }


    // Сервер не може знайти запитаний ресурс. У браузері це означає, що URL-адресу не розпізнано. 
    // В API це також може означати, що адреса правильна, але ресурс не існує. 
    // Сервер також може надіслати цей код відповіді замість 403 Forbidden, щоб приховати існування ресурсу від неавторизованого клієнта. 
    // Це найвідоміший код відповіді через його часту появу в мережі
    static NotFound(message, errors = []) {
        return new CustomError(404, message, errors = [])
    }


    // На сервері сталася помилка, внаслідок якої він не може успішно обробити запит.
    static InternalServerError(message, errors = []) {
        return new CustomError(500, message, errors = [])
    }
}




// Експортуємо клас
export default CustomError