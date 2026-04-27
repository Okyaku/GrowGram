const RAW_CLOUDFRONT_DOMAIN =
  process.env.EXPO_PUBLIC_CLOUDFRONT_DOMAIN ?? "";
const RAW_S3_BUCKET = process.env.EXPO_PUBLIC_S3_BUCKET ?? "";

const normalizeDomain = (domain: string) =>
  domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");

const stripLeadingSlash = (value: string) => value.replace(/^\/+/, "");

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const isS3Host = (host: string) => {
  const normalizedHost = host.toLowerCase();
  if (!normalizedHost.endsWith("amazonaws.com")) {
    return false;
  }

  return normalizedHost.includes(".s3.") || normalizedHost.startsWith("s3.");
};

const extractKeyFromS3Url = (rawUrl: string, bucketName: string): string => {
  const parsed = new URL(rawUrl);
  const host = parsed.hostname.toLowerCase();
  const path = stripLeadingSlash(decodeURIComponent(parsed.pathname || ""));

  // path-style URL: s3.<region>.amazonaws.com/<bucket>/<key>
  if ((host.startsWith("s3.") || host === "s3.amazonaws.com") && bucketName) {
    const bucketPrefix = `${bucketName}/`;
    if (path.startsWith(bucketPrefix)) {
      return path.slice(bucketPrefix.length);
    }
  }

  // virtual-hosted-style URL already has only key in path.
  return path;
};

export const toCloudFrontImageUrl = (
  sourceValue: string,
  fallbackUrl?: string,
): string => {
  if (!sourceValue) {
    return fallbackUrl ?? sourceValue;
  }

  const cloudFrontDomain = normalizeDomain(RAW_CLOUDFRONT_DOMAIN);
  if (!cloudFrontDomain) {
    return fallbackUrl ?? sourceValue;
  }

  const bucketName = RAW_S3_BUCKET.trim();

  if (isHttpUrl(sourceValue)) {
    try {
      const parsed = new URL(sourceValue);
      const currentHost = parsed.hostname.toLowerCase();
      if (currentHost === cloudFrontDomain.toLowerCase()) {
        return sourceValue;
      }

      if (!isS3Host(currentHost)) {
        return sourceValue;
      }

      const key = extractKeyFromS3Url(sourceValue, bucketName);
      return `https://${cloudFrontDomain}/${stripLeadingSlash(key)}`;
    } catch {
      return fallbackUrl ?? sourceValue;
    }
  }

  return `https://${cloudFrontDomain}/${stripLeadingSlash(sourceValue)}`;
};
