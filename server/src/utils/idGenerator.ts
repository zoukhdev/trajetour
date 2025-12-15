
/**
 * Generates a short, readable, unique-ish identifier.
 * Length: 6 characters
 * Charset: Uppercase Alphanumeric (excluding ambiguous characters like I, 1, O, 0)
 * Space: ~1 billion combinations
 */
export const generateShortId = (length: number = 6): string => {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed I, 1, O, 0
    let result = '';
    const charsetLength = charset.length;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charsetLength);
        result += charset.charAt(randomIndex);
    }

    return result;
};
