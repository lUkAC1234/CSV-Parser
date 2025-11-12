export function parseDateInWords(date: Date): string {
    const currentDate: Date = new Date();

    const appendToResult = (currentResult: string, newPart: string): string => {
        if (!currentResult) {
            return newPart;
        }
        return `${currentResult}, ${newPart}`;
    };

    let finalResult: string = "";

    const oneDay = 1000 * 60 * 60 * 24;
    const startOfDayCurrent = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const startOfDayInput = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const totalDaysDiff = Math.floor((startOfDayCurrent.getTime() - startOfDayInput.getTime()) / oneDay);

    if (totalDaysDiff === 0) {
        return "today";
    } else if (totalDaysDiff === 1) {
        return "yesterday";
    }

    let tempDate = new Date(date.getTime());

    let years = 0;
    let months = 0;
    let days = 0;

    while (
        tempDate.getFullYear() < currentDate.getFullYear() ||
        (tempDate.getFullYear() === currentDate.getFullYear() && tempDate.getMonth() < currentDate.getMonth()) ||
        (tempDate.getFullYear() === currentDate.getFullYear() &&
            tempDate.getMonth() === currentDate.getMonth() &&
            tempDate.getDate() <= currentDate.getDate())
    ) {
        let nextYearTemp = new Date(tempDate);
        nextYearTemp.setFullYear(tempDate.getFullYear() + 1);

        if (nextYearTemp.getTime() > currentDate.getTime()) {
            break;
        }
        years++;
        tempDate.setFullYear(tempDate.getFullYear() + 1);
    }

    while (
        tempDate.getFullYear() < currentDate.getFullYear() ||
        (tempDate.getFullYear() === currentDate.getFullYear() && tempDate.getMonth() < currentDate.getMonth()) ||
        (tempDate.getFullYear() === currentDate.getFullYear() &&
            tempDate.getMonth() === currentDate.getMonth() &&
            tempDate.getDate() <= currentDate.getDate())
    ) {
        let nextMonthTemp = new Date(tempDate);
        nextMonthTemp.setMonth(tempDate.getMonth() + 1);

        if (nextMonthTemp.getTime() > currentDate.getTime()) {
            break;
        }
        months++;
        tempDate.setMonth(tempDate.getMonth() + 1);
    }

    days = Math.floor((currentDate.getTime() - tempDate.getTime()) / oneDay);

    if (years > 0) {
        finalResult = appendToResult(finalResult, `${years} year${years > 1 ? "s" : ""}`);
    }
    if (months > 0) {
        finalResult = appendToResult(finalResult, `${months} month${months > 1 ? "s" : ""}`);
    }
    if (days > 0) {
        finalResult = appendToResult(finalResult, `${days} day${days > 1 ? "s" : ""}`);
    }

    if (finalResult === "") {
        return "just now";
    }

    return `${finalResult} ago`;
}
