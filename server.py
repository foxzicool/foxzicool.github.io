from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "backend.txt")


def read_data():
    data = []

    if not os.path.exists(DATA_FILE):
        return data

    with open(DATA_FILE, "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()

            if not line:
                continue

            parts = line.split("|", 1)

            if len(parts) == 2:
                data.append({
                    "id": parts[0],
                    "name": parts[1]
                })

    return data


def write_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as file:
        for item in data:
            file.write(f"{item['id']}|{item['name']}\n")


class Handler(BaseHTTPRequestHandler):

    def send_json(self, data, status=200):
        response = json.dumps(
            data,
            ensure_ascii=False
        ).encode("utf-8")

        self.send_response(status)

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )

        self.send_header(
            "Access-Control-Allow-Origin",
            "*"
        )

        self.send_header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        )

        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type"
        )

        self.send_header(
            "Content-Length",
            str(len(response))
        )

        self.end_headers()

        self.wfile.write(response)

    def do_OPTIONS(self):
        self.send_response(200)

        self.send_header(
            "Access-Control-Allow-Origin",
            "*"
        )

        self.send_header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        )

        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type"
        )

        self.end_headers()

    # =========================
    # READ
    # GET /api/data
    # =========================

    def do_GET(self):

        if self.path == "/api/data":

            data = read_data()

            self.send_json(data)

            return

        self.send_error(404)

    # =========================
    # CREATE
    # POST /api/data
    # =========================

    def do_POST(self):

        if self.path != "/api/data":

            self.send_error(404)

            return

        try:

            length = int(
                self.headers.get(
                    "Content-Length",
                    0
                )
            )

            body = self.rfile.read(length)

            request_data = json.loads(
                body.decode("utf-8")
            )

            name = str(
                request_data.get(
                    "name",
                    ""
                )
            ).strip()

            if not name:

                self.send_json(
                    {
                        "error": "名稱不能為空"
                    },
                    400
                )

                return

            data = read_data()

            max_id = 0

            for item in data:

                try:

                    current_id = int(
                        item["id"]
                    )

                    if current_id > max_id:
                        max_id = current_id

                except (ValueError, TypeError):
                    pass

            new_item = {
                "id": str(max_id + 1),
                "name": name
            }

            data.append(new_item)

            write_data(data)

            self.send_json(
                new_item,
                201
            )

        except Exception as error:

            self.send_json(
                {
                    "error": str(error)
                },
                500
            )

    # =========================
    # UPDATE
    # PUT /api/data/{id}
    # =========================

    def do_PUT(self):

        if not self.path.startswith(
            "/api/data/"
        ):

            self.send_error(404)

            return

        try:

            item_id = self.path[
                len("/api/data/"):
            ]

            length = int(
                self.headers.get(
                    "Content-Length",
                    0
                )
            )

            body = self.rfile.read(length)

            request_data = json.loads(
                body.decode("utf-8")
            )

            name = str(
                request_data.get(
                    "name",
                    ""
                )
            ).strip()

            if not name:

                self.send_json(
                    {
                        "error": "名稱不能為空"
                    },
                    400
                )

                return

            data = read_data()

            found = False

            for item in data:

                if item["id"] == item_id:

                    item["name"] = name

                    found = True

                    break

            if not found:

                self.send_json(
                    {
                        "error": "找不到資料"
                    },
                    404
                )

                return

            write_data(data)

            self.send_json(
                {
                    "message": "修改成功",
                    "id": item_id,
                    "name": name
                }
            )

        except Exception as error:

            self.send_json(
                {
                    "error": str(error)
                },
                500
            )

    # =========================
    # DELETE
    # DELETE /api/data/{id}
    # =========================

    def do_DELETE(self):

        if not self.path.startswith(
            "/api/data/"
        ):

            self.send_error(404)

            return

        try:

            item_id = self.path[
                len("/api/data/"):
            ]

            data = read_data()

            new_data = [
                item
                for item in data
                if item["id"] != item_id
            ]

            if len(new_data) == len(data):

                self.send_json(
                    {
                        "error": "找不到資料"
                    },
                    404
                )

                return

            write_data(new_data)

            self.send_json(
                {
                    "message": "刪除成功",
                    "id": item_id
                }
            )

        except Exception as error:

            self.send_json(
                {
                    "error": str(error)
                },
                500
            )


if __name__ == "__main__":

    server = HTTPServer(
        ("localhost", 8080),
        Handler
    )

    print("==============================")
    print("CRUD API Server")
    print("==============================")
    print("API: http://localhost:8080")
    print("資料庫:", DATA_FILE)
    print("==============================")
    print("按 Ctrl + C 停止伺服器")
    print("==============================")

    try:

        server.serve_forever()

    except KeyboardInterrupt:

        print("\nServer stopped.")

    finally:

        server.server_close()