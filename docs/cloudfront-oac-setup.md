# CloudFront (OAC) Setup for S3 Images

## 1) App environment variable

Set the CloudFront domain for Expo public env vars.

```bash
EXPO_PUBLIC_CLOUDFRONT_DOMAIN=<YOUR_CLOUDFRONT_DOMAIN>
```

Example:

```bash
EXPO_PUBLIC_CLOUDFRONT_DOMAIN=dxxxxxxxxxxxx.cloudfront.net
```

## 2) S3 bucket policy (OAC only)

Keep S3 public access block fully enabled, then attach this policy to the image bucket.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnlyWithOAC",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::<S3_BUCKET_NAME>/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::<AWS_ACCOUNT_ID>:distribution/<CLOUDFRONT_DISTRIBUTION_ID>"
        }
      }
    }
  ]
}
```

Optional (usually not required for image delivery):

```json
{
  "Sid": "AllowCloudFrontListBucketOptional",
  "Effect": "Allow",
  "Principal": {
    "Service": "cloudfront.amazonaws.com"
  },
  "Action": [
    "s3:ListBucket"
  ],
  "Resource": "arn:aws:s3:::<S3_BUCKET_NAME>",
  "Condition": {
    "StringEquals": {
      "AWS:SourceArn": "arn:aws:cloudfront::<AWS_ACCOUNT_ID>:distribution/<CLOUDFRONT_DISTRIBUTION_ID>"
    }
  }
}
```

## 3) Operational notes

- Enable OAC on the CloudFront distribution origin.
- Keep S3 bucket private (no public ACL/policy).
- Set long `Cache-Control` on image objects, for example:
  - `public, max-age=31536000, immutable`
- Use versioned file names when updating images.
- Run invalidation if you must replace an existing key.
