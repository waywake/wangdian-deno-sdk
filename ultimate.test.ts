import { assertEquals } from "https://deno.land/std@0.199.0/assert/mod.ts";
import {
    WangDianClient as Client,
    WangDianPager as Pager,
} from "./ultimate.ts";

import * as log from "https://deno.land/std@0.200.0/log/mod.ts";

await log.setup({
    handlers: {
        console: new log.handlers.ConsoleHandler("DEBUG"),
    },

    loggers: {
        wangdian_sdk: {
            level: "DEBUG",
            handlers: ["console"],
        },
    },
});

const client = new Client({
    sid: Deno.env.get("WANGDIAN_SID")!,
    appKey: Deno.env.get("WANGDIAN_APP_KEY")!,
    appSecret: Deno.env.get("WANGDIAN_APP_SECRET")!,
    apiUrl: "http://47.92.239.46/openapi",
});

Deno.test("test page call", async () => {
    const result = await client.pageCall<Record<string, object>>(
        "setting.Warehouse.queryWarehouse",
        new Pager(0, 3),
        { hide_delete: 0 }
    );

    assertEquals((result["details"] as object[]).length, 3);
});
