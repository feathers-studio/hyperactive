#!/bin/bash

# Check if filename is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <filename>"
  exit 1
fi

# Configure AWS CLI with Scaleway credentials
aws configure set aws_access_key_id $SCW_ACCESS_KEY
aws configure set aws_secret_access_key $SCW_SECRET_KEY
aws configure set region fr-par  # or your region
aws configure set endpoint_url https://$SCW_ENDPOINT

# Upload file and make it public
aws s3 cp "$1" s3://pkg/$(basename "$1") --acl public-read

# Print the public URL
echo "File uploaded successfully!"
echo "Public URL: https://$SCW_ENDPOINT/pkg/$(basename "$1")"
