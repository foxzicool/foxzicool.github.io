const OWNER = "foxzicool";

const REPO = "foxzicool.github.io";

const FILE = "backend.txt";

const BRANCH = "main";


const GITHUB_URL =
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`;


function headers() {

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


function send(
    res,
    status,
    data
) {

    res.status(status);

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    return res.json(data);

}


function decodeBase64(
    content
) {

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


function encodeBase64(
    text
) {

    return Buffer
        .from(
            text,
            "utf8"
        )
        .toString("base64");

}


function parseData(
    text
) {

    const lines =
        text
            .split(/\r?\n/)
            .filter(
                line =>
                    line.trim() !== ""
            );

    return lines.map(
        line => {

            const index =
                line.indexOf("|");

            if (
                index === -1
            ) {

                return null;

            }

            return {

                id:
                    line.substring(
                        0,
                        index
                    ),

                name:
                    line.substring(
                        index + 1
                    )

            };

        }
    ).filter(Boolean);

}


function buildText(
    data
) {

    return data
        .map(
            item =>
                `${item.id}|${item.name}`
        )
        .join("\n") +
        (
            data.length
                ? "\n"
                : ""
        );

}


async function getGithubFile() {

    const response =
        await fetch(
            GITHUB_URL +
            `?ref=${BRANCH}`,
            {
                headers:
                    headers()
            }
        );

    const result =
        await response.json();

    if (
        !response.ok
    ) {

        throw new Error(
            result.message ||
            "GitHub 讀取失敗"
        );

    }

    return result;

}


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
                    ...headers(),

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        message:
                            message,

                        content:
                            encodeBase64(
                                text
                            ),

                        sha:
                            sha,

                        branch:
                            BRANCH

                    })

            }
        );


    const result =
        await response.json();


    if (
        !response.ok
    ) {

        throw new Error(
            result.message ||
            "GitHub 寫入失敗"
        );

    }


    return result;

}


export default async function handler(
    req,
    res
) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    if (
        req.method ===
        "OPTIONS"
    ) {

        return res.status(204).end();

    }


    try {

        /*
        ============================
        READ
        ============================
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
        ============================
        CREATE
        ============================
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
        ============================
        UPDATE
        ============================
        */

        if (
            req.method ===
            "PUT"
        ) {

            const id =
                String(
                    req.query.id ||
                    req.url
                        .split("/")
                        .pop()
                        .split("?")[0]
                );


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
        ============================
        DELETE
        ============================
        */

        if (
            req.method ===
            "DELETE"
        ) {

            const id =
                String(
                    req.query.id ||
                    req.url
                        .split("/")
                        .pop()
                        .split("?")[0]
                );


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
            error
        );

        return send(
            res,
            500,
            {
                error:
                    error.message
            }
        );

    }

}