import type { SignatureV4 } from "@smithy/signature-v4";
import { extendedEncodeURIComponent } from "../../utils/sanitize-s3-key";

export const deleteFromS3 = async ({
  signer,
  name,
  endpoint,
  bucket,
}: {
  signer: SignatureV4;
  name: string;
  endpoint: string;
  bucket: string;
}): Promise<void> => {
  const url = new URL(
    `/${bucket}/${extendedEncodeURIComponent(name)}`,
    endpoint
  );

  const s3Request = await signer.sign({
    method: "DELETE",
    protocol: url.protocol,
    hostname: url.hostname,
    path: url.pathname,
    headers: {
      "x-amz-date": new Date().toISOString(),
      "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
    },
  });

  const response = await fetch(url, {
    method: s3Request.method,
    headers: s3Request.headers,
  });

  if (response.status !== 204 && response.status !== 200) {
    throw Error(`Cannot delete file ${name} from S3: ${response.status}`);
  }
};
