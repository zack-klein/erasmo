import dateutil.parser

from datetime import datetime, timedelta
from decimal import Decimal

import pandas as pd
import simplejson as json
import yfinance as yf

from erasmo.constant import PARTITION_KEY


class Portfolio:
    def __init__(self, name, companies=[]):
        self.name = name
        self.companies = companies

        # TODO: Need to make sure companies are formatted correctly
        self._recalculate_portfolio()

    def _set_data(self):
        """
        Grab Yahoo Finance data for the companies in the portfolio.
        """
        if len(self.companies) == 0:
            return pd.DataFrame()
        else:
            tickers = [company["ticker"] for company in self.companies]
            # Need to make sure tickers are real
            return yf.download(tickers)

    def _set_value(self):
        """
        Set the value of the portfolio.
        """
        value = 0

        # Need to set the date
        if not self.data.empty:
            date = max(self.data["Close"].index)
        else:
            date = datetime.now().strftime("%Y-%m-%d")

        # One company vs. `n` companies have different structures :(
        if len(self.companies) == 1:
            company = self.companies[0]

            ticker = company["ticker"]
            shares = company["shares"]

            price = self.data[self.data["Close"].index == date]["Close"][date]
            value += Decimal(price) * shares

        else:
            for company in self.companies:

                ticker = company["ticker"]
                shares = company["shares"]

                price = self.data[self.data["Close"][ticker].index == date][
                    "Close"
                ][ticker][date]
                value += Decimal(price) * shares

        return value

    def _recalculate_portfolio(self):
        """
        Reset the data and the value of the portfolio.
        """
        self.data = self._set_data()
        self.value = self._set_value()

    def _get_company(self, ticker):
        """
        If the company is in the portfolio, return it. Else return None.
        """
        company = None
        for _company in self.companies:
            if _company["ticker"] == ticker:
                company = _company

        return company

    def add_company(self, ticker, shares):
        """
        Add a company to the portfolio. If it already exists, just add the
        shares.
        """
        exists = self._get_company(ticker)

        if exists:
            self.add_shares(ticker, shares)

        else:
            self.companies.append(
                {"ticker": ticker, "shares": Decimal(shares)}
            )
            self._recalculate_portfolio()

    def add_shares(self, ticker, shares):
        """
        Add shares of a company to the portfolio.
        """
        company = self._get_company(ticker)

        if not company:
            self.add_company(ticker, shares)
        else:
            company["shares"] += shares
            self._recalculate_portfolio()

    def remove_shares(self, ticker, shares):
        """
        Remove shares of a company already in the portfolio.
        """
        company = self._get_company(ticker)

        if not company:
            raise ValueError(f"{ticker} is not in the portfolio!")

        existing_shares = company["shares"]

        if shares > existing_shares:
            raise ValueError(
                f"{self.name} only has {existing_shares} shares of "
                f"{company['ticker']}! You tried to delete {shares}."
            )

        elif shares == existing_shares:
            self.remove_company(ticker)

        else:
            company["shares"] -= shares
            self._recalculate_portfolio()

    def remove_company(self, ticker):
        """
        Remove a company from the portfolio.
        """
        for i, company in enumerate(self.companies):
            if ticker == company["ticker"]:
                del self.companies[i]
                self._recalculate_portfolio()
                return

        raise ValueError(f"{ticker} is not in the portfolio!")

    def get_historic_prices(self, start=None, end=None):
        """
        Retrieves the prices for the portfolio for a chunk of time.
        """
        if not start:
            start = datetime.now() - timedelta(days=1 * 365)
        else:
            start = dateutil.parser.parse(start)

        if not end:
            end = datetime.now() - timedelta(days=1)
        else:
            end = dateutil.parser.parse(end)

        if self.data.empty:
            return None

        if len(self.companies) == 1:
            filtered = self.data["Close"].to_frame()
            filtered = filtered.loc[start:end]
            filtered["Total"] = filtered["Close"]
            del filtered["Close"]
            ticker = self.companies[0]["ticker"]
            filtered[ticker] = filtered["Total"]

        else:
            filtered = self.data["Close"]
            filtered = filtered.loc[start:end]
            filtered.fillna(0, inplace=True)
            filtered["Total"] = 0

            for column in filtered.columns:
                if column != "Total":
                    filtered["Total"] += filtered[column]

        # Clean it up a bit
        as_dict = json.loads(filtered.to_json())

        return as_dict

    def to_ddb(self):
        """
        Format the portfolio to use decimal.Decimal's instead of floats.
        """
        as_dict = {
            PARTITION_KEY: self.name,
            "companies": self.companies,
            "value": self.value,
        }
        return as_dict

    def to_json(self):
        """
        Format the portfolio to be REST friendly (decimal.Decimal's) screw
        this up.
        """
        as_dict = {
            PARTITION_KEY: self.name,
            "companies": self.companies,
            "value": self.value,
        }
        # We serialize to JSON and convert back to deal with weird decimal
        # data types from dynamodb
        s = json.dumps(as_dict)
        as_json = json.loads(s)
        return as_json
