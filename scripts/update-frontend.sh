set -e


cd ./frontend

echo "Building frontend..."

yarn build

echo "Publishing..."

aws s3 sync build/ s3://erasmo.zacharyjklein.com

