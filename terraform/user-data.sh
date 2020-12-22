#!/bin/bash

set -ex

yum update -y
yum install python3 git -y
pip3 install supervisor

cp /usr/local/bin/supervisord /bin/supervisord

# Download the code
VERSION=master  # TODO: Can be changed later if needed
HOME=/home/ec2-user
BACKEND=$HOME/erasmo/backend
cd $HOME
git clone https://github.com/zack-klein/erasmo.git
cd $BACKEND

# Install requirements
python3 -m venv venv
$BACKEND/venv/bin/pip3 install -r requirements.txt

# Start the server!
COMMAND="$BACKEND/venv/bin/flask run --host 0.0.0.0 --port=80"
SUPERVISOR_BASE_PATH=$BACKEND/supervisord
SUPERVISOR_CONF_PATH=$SUPERVISOR_BASE_PATH/supervisord.conf
SUPERVISOR_PATH=$(which supervisord)

mkdir -p $SUPERVISOR_BASE_PATH

cat <<EOF > $SUPERVISOR_CONF_PATH
[supervisord]
logfile=$SUPERVISOR_BASE_PATH/supervisord.log

[program:app]
command=$COMMAND
directory=$BACKEND
stdout_logfile=$SUPERVISOR_BASE_PATH/app.log
redirect_stderr=true
EOF

$SUPERVISOR_PATH -c $SUPERVISOR_CONF_PATH

