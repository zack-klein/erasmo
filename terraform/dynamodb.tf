resource "aws_dynamodb_table" "health-checker-users" {
  name           = "erasmo"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "portfolio_id"

  attribute {
    name = "portfolio_id"
    type = "S"
  }

}