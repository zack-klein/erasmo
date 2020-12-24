from flask import Flask, request, abort

from erasmo import operations


app = Flask(__name__)


# Error handlers
@app.errorhandler(400)
def bad_request(e):
    return {"error": True, "message": str(e)}, 400


@app.errorhandler(404)
def page_not_found(e):
    return {"error": True, "message": "Page not found!"}, 404


@app.errorhandler(Exception)
def handle_exception(e):
    """
    Return JSON instead of HTML for HTTP errors.
    """
    return {"error": True, "message": f"An error occurred: {e}"}, 500


@app.after_request
def add_cors(response):
    """
    A hacky CORS!
    """
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


# Routes
@app.route("/ping/")
def ping():
    return "pong"


@app.route("/portfolio/", methods=["GET", "POST", "DELETE"])
def portfolio():

    if request.method == "GET":
        portfolios = operations.list_portfolios()
        response = []
        for portfolio in portfolios:
            d = {
                "name": portfolio,
                "detail_url": f"{request.base_url}{portfolio}/",
            }
            response.append(d)

    elif request.method == "POST":
        portfolio_id = request.get_json(force=True).get("portfolio_id")

        if not portfolio_id:
            abort(
                400, description="Expected portfolio_id and didn't receive it!"
            )

        else:
            response = operations.add_portfolio(portfolio_id).to_json()

    elif request.method == "DELETE":
        portfolio_id = request.get_json(force=True).get("portfolio_id")

        if not portfolio_id:
            abort(
                400, description="Expected portfolio_id and didn't receive it!"
            )

        else:
            response = operations.delete_portfolio(portfolio_id)

    return {"results": response}


@app.route("/portfolio/<portfolio_id>/", methods=["GET", "POST", "DELETE"])
def shares(portfolio_id):

    if request.method == "GET":
        portfolio = operations.get_portfolio(portfolio_id)
        response = {"results": portfolio}

    elif request.method == "POST":
        data = request.get_json(force=True)

        ticker = data.get("ticker")
        shares = int(data.get("shares"))
        intention = data.get("intention")

        if not all([portfolio_id, ticker, shares, intention]) or not any(
            [intention.upper() == "ADD", intention.upper() == "REMOVE"]
        ):
            msg = "Need: ticker, shares, intention."
            msg += " shares must be an integer or integer-serializable string."
            msg += " intention myst be either 'ADD' or 'REMOVE'."
            abort(400, description=msg)

        if intention.upper() == "ADD":
            response = operations.add_shares(portfolio_id, ticker, shares)
        elif intention.upper() == "REMOVE":
            response = operations.remove_shares(portfolio_id, ticker, shares)

    elif request.method == "DELETE":
        data = request.get_json(force=True)
        ticker = data.get("ticker")

        if not ticker:
            msg = "Need: ticker."
            abort(400, msg)

        response = operations.remove_company(portfolio_id, ticker)

    return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
