#!/usr/bin/env bash

set -ex

sudo yum update -y
sudo yum install python3 git -y
sudo pip3 install supervisor

