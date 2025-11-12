export function polling(intervalMS: number, callNumber: number, callback: () => void): void {
    let intervalRef: ReturnType<typeof setInterval>;
    let called: number = 0;

    intervalRef = setInterval(() => {
        callback();
        called += 1;
        if (called >= callNumber) {
            clearInterval(intervalRef);
        }
    }, intervalMS);
}
