const OWNER = "foxzicool";
const REPO = "foxzicool.github.io";
const FILE = "backend.txt";
const BRANCH = "main";

const GITHUB_URL =
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`;


/*
==================================================
GitHub API Headers
==================================================
*/

function getHeaders() {

    return {
        "Authorization":
            `Bearer ${process.env.FOXTOKEN}`,

        "Accept":
            "application/vnd.github+json",

        "X-GitHub-Api-Version":
            "2022-11-28",

        "User-Agent":
            "foxzicool-crud"
    };

}


/*
==================================================
CORS
==================================================
*/

function setCors(res) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        "https://foxzicool.github.io"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

}


/*
==================================================
取得 GitHub backend.txt
==================================================
*/

async function getGithubFile() {

    const response =
        await fetch(
            `${GITHUB_URL}?ref=${BRANCH}`,
            {
                method: "GET",
                headers: getHeaders()
            }
        );


    const result =
        await response.json();


    if (!response.ok) {

        throw new Error(
            result.message ||
            "無法讀取 GitHub backend.txt"
        );

    }


    return result;

}


/*
==================================================
Base64 → UTF-8
==================================================
*/

function decodeBase64(content) {

    const clean =
        content.replace(
            /\n/g,
            ""
        );


    return Buffer
        .from(
            clean,
            "base64"
        )
        .toString("utf8");

}


/*
==================================================
UTF-8 → Base64
==================================================
*/

function encodeBase64(text) {

    return Buffer
        .from(
            text,
            "utf8"
        )
        .toString("base64");

}


/*
==================================================
解析 backend.txt

格式：

1|蘋果
2|香蕉
3|測試
==================================================
*/

function parseData(text) {

    if (!text || !text.trim()) {

        return [];

    }


    const lines =
        text
            .split(/\r?\n/)
            .filter(
                line =>
                    line.trim() !== ""
            );


    return lines
        .map(
            line => {

                const index =
                    line.indexOf("|");


                if (index === -1) {

                    return null;

                }


                return {

                    id:
                        line.substring(
                            0,
                            index
                        ).trim(),

                    name:
                        line.substring(
                            index + 1
                        )

                };

            }
        )
        .filter(Boolean);

}


/*
==================================================
建立 backend.txt

1|蘋果
2|香蕉
3|測試
==================================================
*/

function buildText(data) {

    if (data.length === 0) {

        return "";

    }


    return data
        .map(
            item =>
                `${item.id}|${item.name}`
        )
        .join("\n") +
        "\n";

}


/*
==================================================
寫回 GitHub backend.txt
==================================================
*/

async function saveGithubFile(
    text,
    sha,
    message
) {

    const response =
        await fetch(
            GITHUB_URL,
            {

                method: "PUT",

                headers: {
                    ...getHeaders(),

                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({

                        message:
                            message,

                        content:
                            encodeBase64(text),

                        sha:
                            sha,

                        branch:
                            BRANCH

                    })

            }
        );


    const result =
        await response.json();


    if (!response.ok) {

        throw new Error(
            result.message ||
            "GitHub 寫入失敗"
        );

    }


    return result;

}


/*
==================================================
HTTP Response
==================================================
*/

function send(
    res,
    status,
    data
) {

    setCors(res);

    return res
        .status(status)
        .json(data);

}


/*
==================================================
API
==================================================
*/

export default async function handler(
    req,
    res
) {

    setCors(res);


    /*
    ==============================
    OPTIONS
    ==============================
    */

    if (
        req.method ===
        "OPTIONS"
    ) {

        return res
            .status(204)
            .end();

    }


    try {


        /*
        ==============================
        GET
        讀取資料
        ==============================
        */

        if (
            req.method ===
            "GET"
        ) {

            const file =
                await getGithubFile();


            const text =
                decodeBase64(
                    file.content
                );


            const data =
                parseData(text);


            return send(
                res,
                200,
                data
            );

        }


        /*
        ==============================
        POST
        新增資料
        ==============================
        */

        if (
            req.method ===
            "POST"
        ) {

            const name =
                String(
                    req.body?.name ||
                    ""
                ).trim();


            if (!name) {

                return send(
                    res,
                    400,
                    {
                        error:
                            "名稱不能為空"
                    }
                );

            }


            const file =
                await getGithubFile();


            const text =
                decodeBase64(
                    file.content
                );


            const data =
                parseData(text);


            /*
            找目前最大的 ID
            */

            let maxId = 0;


            data.forEach(
                item => {

                    const id =
                        parseInt(
                            item.id,
                            10
                        );


                    if (
                        !isNaN(id)
                    ) {

                        maxId =
                            Math.max(
                                maxId,
                                id
                            );

                    }

                }
            );


            const newItem = {

                id:
                    String(
                        maxId + 1
                    ),

                name:
                    name

            };


            data.push(
                newItem
            );


            await saveGithubFile(

                buildText(data),

                file.sha,

                `CRUD: Create ${newItem.id}`

            );


            return send(
                res,
                201,
                newItem
            );

        }


        /*
        ==============================
        PUT
        修改資料
        ==============================
        */

        if (
            req.method ===
            "PUT"
        ) {

            const id =
                getId(req);


            const name =
                String(
                    req.body?.name ||
                    ""
                ).trim();


            if (!id) {

                return send(
                    res,
                    400,
                    {
                        error:
                            "缺少 ID"
                    }
                );

            }


            if (!name) {

                return send(
                    res,
                    400,
                    {
                        error:
                            "名稱不能為空"
                    }
                );

            }


            const file =
                await getGithubFile();


            const text =
                decodeBase64(
                    file.content
                );


            const data =
                parseData(text);


            const item =
                data.find(
                    item =>
                        item.id === id
                );


            if (!item) {

                return send(
                    res,
                    404,
                    {
                        error:
                            "找不到資料"
                    }
                );

            }


            item.name =
                name;


            await saveGithubFile(

                buildText(data),

                file.sha,

                `CRUD: Update ${id}`

            );


            return send(
                res,
                200,
                {

                    message:
                        "修改成功",

                    id:
                        id,

                    name:
                        name

                }
            );

        }


        /*
        ==============================
        DELETE
        刪除資料
        ==============================
        */

        if (
            req.method ===
            "DELETE"
        ) {

            const id =
                getId(req);


            if (!id) {

                return send(
                    res,
                    400,
                    {
                        error:
                            "缺少 ID"
                    }
                );

            }


            const file =
                await getGithubFile();


            const text =
                decodeBase64(
                    file.content
                );


            const data =
                parseData(text);


            const newData =
                data.filter(
                    item =>
                        item.id !== id
                );


            if (
                newData.length ===
                data.length
            ) {

                return send(
                    res,
                    404,
                    {
                        error:
                            "找不到資料"
                    }
                );

            }


            await saveGithubFile(

                buildText(newData),

                file.sha,

                `CRUD: Delete ${id}`

            );


            return send(
                res,
                200,
                {

                    message:
                        "刪除成功",

                    id:
                        id

                }
            );

        }


        /*
        ==============================
        不支援的方法
        ==============================
        */

        return send(
            res,
            405,
            {
                error:
                    "不支援的 HTTP 方法"
            }
        );

    }
    catch (error) {

        console.error(
            "CRUD API Error:",
            error
        );


        return send(
            res,
            500,
            {
                error:
                    error.message ||
                    "伺服器發生錯誤"
            }
        );

    }

}


/*
==================================================
取得 ID

支援：

/api/data/1

以及：

/api/data?id=1
==================================================
*/

function getId(req) {

    /*
    先嘗試 query
    */

    if (
        req.query &&
        req.query.id
    ) {

        return String(
            req.query.id
        );

    }


    /*
    再從 URL 取得
    */

    const url =
        req.url ||
        "";


    const parts =
        url
            .split("?")[0]
            .split("/");


    const last =
        parts[
            parts.length - 1
        ];


    if (
        last &&
        last !== "data"
    ) {

        return decodeURIComponent(
            last
        );

    }


    return "";

}