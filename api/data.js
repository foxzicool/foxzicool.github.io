export default function handler(req, res) {

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


    if (req.method === "OPTIONS") {

        return res.status(204).end();

    }


    res.status(200).json({

        success: true,

        message: "Vercel API 正常運作"

    });

}