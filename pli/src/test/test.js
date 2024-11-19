
// Implement the following functions
function add(a, b) {
    if (a === undefined || b === undefined) {
        throw new Error("Deux arguments doivent être fournis.");
    }
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error("Les arguments doivent être des chiffres ou des nombres.");
    }
    return a + b;
}

function subtract(a, b) {
    if (a === undefined || b === undefined) {
        throw new Error("Deux arguments doivent être fournis.");
    }
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error("Les arguments doivent être des chiffres ou des nombres.");
    }
    return a - b;
}

function multiply(a, b) {
    if (a === undefined || b === undefined) {
        throw new Error("Deux arguments doivent être fournis.");
    }
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error("Les arguments doivent être des chiffres ou des nombres.");
    }
    return a * b;
}

function divide(a, b) {
    if (a === undefined || b === undefined) {
        throw new Error("Deux arguments doivent être fournis.");
    }
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error("Les arguments doivent être des chiffres ou des nombres.");
    }
    if (b === 0) {
        throw new Error("Impossible de faire une division par 0.");
    }

    return a / b;

}

module.exports = { add, subtract, multiply, divide };