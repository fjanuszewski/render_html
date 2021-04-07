#!/bin/bash

ENV=dev
AWS_PROFILE=default
SOURCE="$(pwd)/cloudformations"
FUNCTIONS="$(pwd)/functions/*"
UUID=$$
BUCKET=2019demoup
PROJECT=DocumentManagement
STACK=$ENV-Infra-$PROJECT

echo "Validating SAM Template..."
sam validate --template "$SOURCE/template.yaml" --debug  --profile $AWS_PROFILE

echo "Building functions..."
for functions in $FUNCTIONS
do
    echo 'Building ' $functions
    cd $functions
    rm -Rf node_modules
    yarn install --prod
    cd -
done

echo 'Uploading Render swagger to S3'
aws s3 cp "$SOURCE/render-swagger.yaml" s3://$BUCKET/$ENV-render-swagger-$UUID.yaml --profile $AWS_PROFILE

echo 'Uploading Html swagger to S3'
aws s3 cp "$SOURCE/html-swagger.yaml" s3://$BUCKET/$ENV-html-swagger-$UUID.yaml --profile $AWS_PROFILE

echo 'Building SAM package and uploading cloudformation'
sam package --profile $AWS_PROFILE --template-file "$SOURCE/template.yaml" --output-template-file "template_$UUID.yaml" --s3-bucket $BUCKET
sam deploy --profile $AWS_PROFILE --template-file "template_$UUID.yaml" --stack-name $STACK --tags Project=$PROJECT --capabilities CAPABILITY_NAMED_IAM --parameter-overrides UUID=$UUID Environment=$ENV DeployBucket=$BUCKET Project=$PROJECT

echo "Cleaning..."

