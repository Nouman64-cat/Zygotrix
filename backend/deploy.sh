#!/bin/bash

# Configuration
PROFILE="zygotrix"
REGION="us-east-1"
REPO_NAME="zygotrix-backend"
IMAGE_TAG="latest"

# 1. Get AWS Account ID automatically
ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --query "Account" --output text)
ECR_URL="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "🚀 Starting deployment for Zygotrix Backend..."

# 2. Login Docker to ECR
aws ecr get-login-password --region $REGION --profile $PROFILE | docker login --username AWS --password-stdin $ECR_URL

# 3. Build the Image
echo "📦 Building Docker image..."
docker build --platform linux/amd64 -t $REPO_NAME .

# 4. Tag and Push
echo "📤 Pushing to ECR..."
docker tag $REPO_NAME:latest $ECR_URL/$REPO_NAME:$IMAGE_TAG
docker push $ECR_URL/$REPO_NAME:$IMAGE_TAG

echo "✅ Success! App Runner will now auto-deploy the new image."