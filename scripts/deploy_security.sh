#!/bin/bash

ENV=dev
AWS_PROFILE=default
SOURCE="$(pwd)/cloudformations"
UUID=$$
BUCKET=2019demoup
PROJECT=DocumentManagement
STACK=$ENV-Security-$PROJECT

echo 'Building SAM package and uploading cloudformation'
sam package --profile $AWS_PROFILE --template-file "${SOURCE}/security.yaml" --output-template-file "security_$UUID.yaml" --s3-bucket $BUCKET
sam deploy --profile $AWS_PROFILE --template-file "security_$UUID.yaml" --stack-name $STACK --tags Project=$PROJECT --capabilities CAPABILITY_NAMED_IAM --parameter-overrides Environment=$ENV Project=$PROJECT
rm "security_$UUID.yaml"
