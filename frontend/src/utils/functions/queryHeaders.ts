export function queryHeaders(requestParams: Record<string, any>, apiPath: string): string {
    let url: string = apiPath;
    let params: string = "";

    for (let i = 0; i < Object.entries(requestParams).length; ++i) {
        const [key, value] = Object.entries(requestParams)[i];

        if (value || value === true || value === false) {
            const param: string = `${key}=${value}`;

            if (params === "") {
                params += `?${param}`;
            } else {
                params += `&${param}`;
            }
        }
    }

    url += params;

    return url;
}
