import { Md5 } from "https://deno.land/std@0.119.0/hash/md5.ts";

export interface IWangDianClientOptions {
    sid: string;
    appKey: string;
    appSecret: string;
    apiUrl?: string;
}

export class WangDianPager {
    public readonly calcTotal: number;

    constructor(
        public readonly pageIndex = 0,
        public readonly pageSize = 10,
        calcTotal = true
    ) {
        this.calcTotal = calcTotal ? 1 : 0;
    }
}

export interface WangDianResult<T> {
    status: number;
    data?: T;
    message?: string;
}

export class WangDianClient {
    private readonly sid: string;
    private readonly appKey: string;
    private readonly secret: string;
    private readonly salt: string;
    private readonly apiUrl: string;

    constructor(private options: IWangDianClientOptions) {
        this.sid = options.sid;
        this.appKey = options.appKey;

        this.apiUrl = options.apiUrl || "https://wdt.wangdian.cn/openapi";

        const [secret, salt] = options.appSecret.split(":");
        this.secret = secret;
        this.salt = salt;
    }

    // 生成请求签名
    private buildSign(params: Record<string, string>) {
        const str = Object.keys(params)
            .filter((key) => key !== "sign")
            .sort()
            .map((key) => `${key}${params[key]}`)
            .join("");

        return new Md5()
            .update(this.secret + str + this.secret)
            .toString("hex");
    }

    private buildRequestUrl(
        method: string,
        body: object,
        pager?: WangDianPager
    ) {
        const timestamp = Math.floor(new Date().getTime() / 1000 - 1325347200);

        const params: Record<string, string> = {
            sid: this.sid,
            key: this.appKey,
            salt: this.salt,
            method: method,
            timestamp: timestamp.toString(),
            v: "1.0",
            body: JSON.stringify(body),
        };

        if (pager) {
            params["page_no"] = pager.pageIndex.toString();
            params["page_size"] = pager.pageSize.toString();
            params["calc_total"] = pager.calcTotal.toString();
        }

        params["sign"] = this.buildSign(params);
        delete params["body"];

        const queryParams = new URLSearchParams(params);
        const requestURL = new URL(this.apiUrl);
        requestURL.search = queryParams.toString();
        return requestURL.toString();
    }

    private async invoke<T>(
        method: string,
        data: object,
        pager?: WangDianPager
    ) {
        const resp = await fetch(this.buildRequestUrl(method, data, pager), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = (await resp.json()) as WangDianResult<T>;
        if (!result) {
            throw new Error("invalid response");
        }

        if (result.status > 0) {
            throw new Error(
                `code: ${result.status}, message: ${result.message}`
            );
        }

        return result.data!;
    }

    call<T = object>(method: string, data: object) {
        return this.invoke<T>(method, data);
    }

    pageCall<T = object>(
        method: string,
        pager: WangDianPager,
        params: Record<string, string | number>
    ) {
        return this.invoke<T>(method, [params], pager);
    }
}