set -e

NAME=erasmo

echo "Grabbing IP address..."
IP=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=$NAME" --query 'Reservations[*].Instances[*].PublicIpAddress' --output text)

echo "Running update..."
ssh-keyscan -H $IP >> ~/.ssh/known_hosts
ssh ec2-user@$IP sudo bash /home/ec2-user/update.sh

echo "Update complete!"