import boto3

from erasmo.portfolio import Portfolio
from erasmo.constant import TABLE, PARTITION_KEY

from boto3.dynamodb.conditions import Key


def add_portfolio(name):
    portfolio = Portfolio(name)
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(TABLE)
    table.put_item(Item=portfolio.to_json())
    return portfolio


def list_portfolios():
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(TABLE)
    items = table.scan(ProjectionExpression=PARTITION_KEY)
    portfolios = [p[PARTITION_KEY] for p in items.get("Items", [])]
    return portfolios


def _get_portfolio(name):
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(TABLE)

    response = table.query(KeyConditionExpression=Key(PARTITION_KEY).eq(name))
    items = response.get("Items")

    if len(items) > 0:
        item = items[0]
        companies = item.get("companies", [])
        return Portfolio(name, companies=companies)
    else:
        return None


def get_portfolio(name):
    portfolio = _get_portfolio(name)
    if portfolio:
        return portfolio.to_json()
    else:
        return None


def _update_portfolio(portfolio):
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(TABLE)
    response = table.put_item(Item=portfolio.to_json())
    portfolio = get_portfolio(portfolio.to_json()[PARTITION_KEY])
    return portfolio


def delete_portfolio(name):
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(TABLE)
    table.delete_item(Key={PARTITION_KEY: name})
    return True


def add_shares(portfolio_id, ticker, shares):
    portfolio = _get_portfolio(portfolio_id)
    portfolio.add_shares(ticker, shares)
    response = _update_portfolio(portfolio)
    return response


def remove_shares(portfolio_id, ticker, shares):
    portfolio = _get_portfolio(portfolio_id)
    portfolio.remove_shares(ticker, shares)
    response = _update_portfolio(portfolio)
    return response


def remove_company(portfolio_id, ticker):
    portfolio = _get_portfolio(portfolio_id)
    portfolio.remove_company(ticker)
    response = _update_portfolio(portfolio)
    return response