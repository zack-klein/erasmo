module "erasmo" {
  source                  = "github.com/zack-klein/lambda-function"
  api_gateway_name        = "erasmo"
  lambda_name             = "erasmo"
  lambda_source_s3_bucket = "zacharyjklein-lambdas"
  lambda_source_s3_key    = "erasmo/handler.zip"
  lambda_iam_policy       = templatefile("policies/lambda.json", { table_arn : aws_dynamodb_table.health-checker-users.arn })
}