resource "aws_iam_role" "role" {
  name = "erasmo-role"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
POLICY
}

resource "aws_iam_policy" "policy" {
  name        = "erasmo-ec2-policy"
  path        = "/"
  description = "Policy for the EC2 instances."
  policy      = templatefile("policies/ec2.json", { table_arn : aws_dynamodb_table.health-checker-users.arn })
}

resource "aws_iam_role_policy_attachment" "policy" {
  role       = aws_iam_role.role.name
  policy_arn = aws_iam_policy.policy.arn
}

resource "aws_iam_instance_profile" "profile" {
  name = "erasmo-profile"
  role = aws_iam_role.role.name
}