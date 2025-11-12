const charsLowerCase: string = "abcdefghijklmnopqrstuvwxyz";
const charsUpperCase: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const charsNumbers: string = "0123456789";
const defaultChars: string = charsLowerCase + charsUpperCase + charsNumbers;

export function uniqueIdGenerator(
    length: number,
    options?: {
        includeNum?: boolean;
        upperCaseMixed?: boolean;
        upperCaseOnly?: boolean;
    },
) {
    let chars: string = charsLowerCase;
    let uniqueID: string = "";

    if (options) {
        const { includeNum, upperCaseMixed, upperCaseOnly } = options;

        if (upperCaseMixed) {
            chars += charsUpperCase;
        } else if (upperCaseOnly) {
            chars = charsUpperCase;
        }

        if (includeNum) {
            chars += charsNumbers;
        }
    } else {
        chars = defaultChars;
    }

    for (let i = 0; i < length; ++i) {
        const randomIndex: number = Math.floor(Math.random() * chars.length);
        const randomChar: string = chars[randomIndex];
        uniqueID += randomChar;
    }

    return uniqueID;
}
