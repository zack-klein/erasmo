#!/bin/bash

set -ex

yum update -y
yum install python3 git jq -y
amazon-linux-extras install nginx1 epel  -y
yum install certbot-nginx -y
pip3 install supervisor

cp /usr/local/bin/supervisord /bin/supervisord

# Download the code
VERSION=master  # TODO: Can be changed later if needed
HOME=/home/ec2-user
BACKEND=$HOME/erasmo/backend
VENV=$BACKEND/venv/bin
cd $HOME
git clone https://github.com/zack-klein/erasmo.git
cd $BACKEND

# Install requirements
python3 -m venv venv
$VENV/pip3 install -r requirements.txt

# Set up the server to run with systemd
WORKERS="3"
SYSTEMD_PATH="/etc/systemd/system/app.service"
SOCKET_PATH="$BACKEND/app.sock"

cat <<EOF > $SYSTEMD_PATH
[Unit]
Description=Gunicorn instance
After=network.target

[Service]
User=ec2-user
WorkingDirectory=$BACKEND
Environment="PATH=$VENV"
ExecStart=$VENV/gunicorn --workers $WORKERS --bind unix:$SOCKET_PATH -m 007 wsgi:app

[Install]
WantedBy=multi-user.target
EOF

# Now let's set up nginx to pass requests to the socket
# Also sets up HTTPS
NGINX_PATH="/etc/nginx/conf.d/app.conf"
DOMAIN="api.erasmo.zacharyjklein.com"
LETS_ENCRYPT_PATH="$HOME/letsencrypt/verification"

mkdir -p $LETS_ENCRYPT_PATH

mkdir -p /etc/letsencrypt/live/api.erasmo.zacharyjklein.com/

aws secretsmanager get-secret-value \
	--secret-id erasmo_api_privkey \
	--region us-east-1 \
	| jq -r .SecretString \
	>> /etc/letsencrypt/live/api.erasmo.zacharyjklein.com/privkey.pem 

aws secretsmanager get-secret-value \
	--secret-id erasmo_api_cert \
	--region us-east-1 \
	| jq -r .SecretString \
	>> /etc/letsencrypt/live/api.erasmo.zacharyjklein.com/fullchain.pem 

cat <<EOF > $NGINX_PATH
server {
    listen 80;
    server_name $DOMAIN;

    location ~ /.well-known {
        root $LETS_ENCRYPT_PATH;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }

}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/api.erasmo.zacharyjklein.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.erasmo.zacharyjklein.com/privkey.pem;

    location / {
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_pass http://unix:$SOCKET_PATH;
    }
}
EOF

# Run nginx as ec2-user, not nginx
sed -i '4,6s/nginx/ec2-user/g' /etc/nginx/nginx.conf


# And now (finally) let's start this puppy! 
systemctl start app
systemctl enable app

# Let's make sure the permissions on app.sock are right...
chown -R ec2-user: $BACKEND


systemctl start nginx
systemctl enable nginx


# Make an update script
UPDATE_SCRIPT_PATH="$HOME/update.sh"
cat <<EOF > $UPDATE_SCRIPT_PATH
set -ex

cd $HOME/erasmo
systemctl stop app
git pull
systemctl start app
EOF

