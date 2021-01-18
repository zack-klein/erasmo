import unittest

from erasmo.portfolio import Portfolio


print("Init the portfolio")
portfolio = Portfolio("Tech")

print("Add microsoft")
portfolio.add_company("MSFT", 4)
print(portfolio.value)

portfolio.add_shares("BX", 1)
print("Add BX")
print(portfolio.value)

print("Add one more BX")
portfolio.add_shares("BX", 1)
print(portfolio.value)

print("Remove one BX")
portfolio.remove_shares("BX", 1)
print(portfolio.value)

print("Remove all Microsoft...")
portfolio.remove_company("MSFT")
print(portfolio.value)

print("One more time, with BX now...")
portfolio.remove_shares("BX", 1)
print(portfolio.value)


class TestPortfolio(unittest.TestCase):
    def setUp(self):
        self.portfolio_name = "Test Portfolio"
        self.portfolio = Portfolio(self.portfolio_name)
