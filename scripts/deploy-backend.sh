set -e


# Assumes running from root
cd ./backend


BUCKET=zacharyjklein-lambdas
LAMBDA=erasmo


mkdir ./temp
cd ./temp


echo "Installing dependencies..."
pip install --target ./ -r ../requirements.txt
cp ../handler.py ./handler.py
cp -r ../erasmo ./

# Pandas and numpy needed to be handled separately...
PANDAS_URL="https://files.pythonhosted.org/packages/e6/de/a0d3defd8f338eaf53ef716e40ef6d6c277c35d50e09b586e170169cdf0d/pandas-0.24.1-cp36-cp36m-manylinux1_x86_64.whl"
PANDAS_WHL="pandas-0.24.1-cp36-cp36m-manylinux1_x86_64.whl"
NUMPY_URL="https://files.pythonhosted.org/packages/f5/bf/4981bcbee43934f0adb8f764a1e70ab0ee5a448f6505bd04a87a2fda2a8b/numpy-1.16.1-cp36-cp36m-manylinux1_x86_64.whl"
NUMPY_WHL="numpy-1.16.1-cp36-cp36m-manylinux1_x86_64.whl"
curl $PANDAS_URL >> $PANDAS_WHL
curl $NUMPY_URL >> $NUMPY_WHL

unzip -o $PANDAS_WHL
unzip -o $NUMPY_WHL

rm $PANDAS_WHL
rm $NUMPY_WHL

echo "Zipping up..."
zip -r handler.zip ./*


echo "Deploying to S3..."
aws s3 cp handler.zip "s3://$BUCKET/$LAMBDA/handler.zip"


# echo "Updating lambda function $LAMBDA_FUNCTION_NAME..."
aws lambda update-function-code --function-name $LAMBDA \
  --s3-bucket $BUCKET \
  --s3-key $LAMBDA/handler.zip


echo "Cleaning up..."
cd ../
rm -rf ./temp