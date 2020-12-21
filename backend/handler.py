import json

from erasmo import operations


def handler(event, context):
    """
    Provide an event that contains the following keys:

      - operation: one of the operations in the operations dict below
      - tableName: required for operations that interact with DynamoDB
      - payload: a parameter to pass to the operation being performed
    """

    operation = event.get("operation")

    all_operations = {
        "add_portfolio": operations.add_portfolio,
        "list_portfolios": operations.list_portfolios,
        "get_portfolio": operations.get_portfolio,
        "delete_portfolio": operations.delete_portfolio,
        "add_shares": operations.add_shares,
        "remove_shares": operations.remove_shares,
        "remove_company": operations.remove_company,
    }

    if operation in all_operations:
        try:
            payload = event.get("payload", {})
            results = all_operations[operation](**payload)
            status_code = 200
        except Exception as e:
            results = str(e)
            status_code = 500

    else:
        results = 'Unrecognized operation: "{}"'.format(operation)
        status_code = 400

    response = {
        "isBase64Encoded": False,
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",  # TODO: Change to localhost
            "Access-Control-Allow-Methods": "POST",
        },
        "multiValueHeaders": {},
        "body": json.dumps(results),
    }
    return response
