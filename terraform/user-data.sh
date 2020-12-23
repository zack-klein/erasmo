#!/bin/bash

set -ex

yum update -y
yum install python3 git -y
amazon-linux-extras install nginx1 -y
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
NGINX_PATH="/etc/nginx/conf.d/app.conf"
DOMAIN="erasmo.zacharyjklein.com"
cat <<EOF > $NGINX_PATH
server {
    listen 80;
    server_name __;

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


