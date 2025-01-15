
// todo - доопрацювати

// Middleware для перевірки JWT токену в заголовку
export async function authTokenMiddleware(req, res, next) {
    try {
        // 1. Отримуємо токен з заголовку Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1]; // Bearer <token>
        // const [bearer, token] = authHeader?.split(' ')

        // if (bearer !== 'Bearer') {
        //     next(new Error('401 - Not authorized'));
        // }

        if (!token) {
            return res.status(401).json({ message: 'Access token is missing' });
        }

        // 2. Верифікуємо токен за допомогою секретного ключа
        const user = await jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // 3. Якщо токен валідний, додаємо дані користувача до запиту
        req.user = user;

        next(); // Продовжуємо обробку запиту

    } catch (err) {
        next(new Error('403 - Invalid or expired token'))
    }

}

