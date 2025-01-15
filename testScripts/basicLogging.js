const colours = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',

    fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        crimson: '\x1b[38m',
    },
    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m',
        crimson: '\x1b[48m',
    },
};

// Проверяем, определена ли TEST, чтобы избежать ошибок
const TEST = typeof TEST !== 'undefined' ? TEST : false;

function getCallingFunction(error = new Error()) {
    try {
        const stack = error.stack;
        if (!stack) return '--';

        const line = stack.split('\n')[2] || '';
        const regex = /at\s+([^\s()]+).*$/;
        const match = line.match(regex);

        return match && match[1] ? match[1] : '--';
    } catch {
        return '--';
    }
}

function log(message = '', ...optionalParams) {
    if (!TEST) {
        console.log(
            `[${new Date().toLocaleString()}]`,
            colours.fg.magenta,
            '[SERVER-LOG]',
            colours.reset,
            message,
            ...optionalParams
        );
    }
}

function info(message = '', ...optionalParams) {
    if (!TEST) {
        console.info(
            `[${new Date().toLocaleString()}]`,
            colours.fg.cyan,
            '[INFO]',
            colours.reset,
            colours.bg.green,
            `[${getCallingFunction(new Error())}]`,
            colours.reset,
            message,
            ...optionalParams
        );
    }
}

function warn(message = '', ...optionalParams) {
    if (!TEST) {
        console.warn(
            `[${new Date().toLocaleString()}]`,
            colours.fg.yellow,
            '[WARN]',
            colours.reset,
            colours.bg.green,
            `[${getCallingFunction(new Error())}]`,
            colours.reset,
            message,
            ...optionalParams
        );
    }
}

function error(message = '', ...optionalParams) {
    if (!TEST) {
        console.error(
            `[${new Date().toLocaleString()}]`,
            colours.fg.red,
            '[ERROR]',
            colours.reset,
            colours.bg.green,
            `[${getCallingFunction(new Error())}]`,
            colours.reset,
            message,
            ...optionalParams
        );
    }
}

// Локальная версия объекта логирования
const logging = {
    log,
    info,
    warn,
    error,
    warning: warn,
    getCallingFunction,
};

// Добавляем logging в глобальную область видимости
globalThis.logging = logging;

// Экспортируем для использования в других файлах
export default logging;
