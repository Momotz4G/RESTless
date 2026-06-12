import CryptoJS from 'crypto-js';

// AWS Signature V4 Generator
export function generateAwsSignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string,
  accessKey: string,
  secretKey: string,
  region: string,
  service: string
): Record<string, string> {
  const urlObj = new URL(url);
  const host = urlObj.host;
  const path = urlObj.pathname;
  const queryParts: string[] = [];
  urlObj.searchParams.forEach((v, k) => {
    queryParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  });
  const query = queryParts.sort().join('&');

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);

  const newHeaders: Record<string, string> = { ...headers, host, 'x-amz-date': amzDate };
  
  const signedHeadersStr = Object.keys(newHeaders).map(k => k.toLowerCase()).sort().join(';');
  const canonicalHeaders = Object.keys(newHeaders)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map(k => `${k.toLowerCase()}:${newHeaders[k].trim()}\n`)
    .join('');

  const payloadHash = CryptoJS.SHA256(body || '').toString(CryptoJS.enc.Hex);

  const canonicalRequest = [
    method,
    path,
    query,
    canonicalHeaders,
    signedHeadersStr,
    payloadHash
  ].join('\n');

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex)
  ].join('\n');

  const kDate = CryptoJS.HmacSHA256(dateStamp, `AWS4${secretKey}`);
  const kRegion = CryptoJS.HmacSHA256(region, kDate);
  const kService = CryptoJS.HmacSHA256(service, kRegion);
  const kSigning = CryptoJS.HmacSHA256('aws4_request', kService);
  const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString(CryptoJS.enc.Hex);

  newHeaders['Authorization'] = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}`;

  return newHeaders;
}

// Digest Auth Helper
export function generateDigestAuthHeader(
  method: string,
  url: string,
  wwwAuthenticateHeader: string,
  username: string,
  password: string,
  nonceCount: number = 1
): string {
  const parseAuthHeader = (header: string) => {
    const params: Record<string, string> = {};
    const regex = /(\w+)=(?:"([^"]+)"|([^\s,]+))/g;
    let match;
    while ((match = regex.exec(header)) !== null) {
      params[match[1]] = match[2] || match[3];
    }
    return params;
  };

  const params = parseAuthHeader(wwwAuthenticateHeader.replace(/^Digest\s+/i, ''));
  const realm = params.realm || '';
  const nonce = params.nonce || '';
  const qop = params.qop || '';
  const opaque = params.opaque || '';

  const nc = ('00000000' + nonceCount).slice(-8);
  const cnonce = CryptoJS.lib.WordArray.random(8).toString(CryptoJS.enc.Hex);

  const urlObj = new URL(url);
  const uri = urlObj.pathname + urlObj.search;

  const ha1 = CryptoJS.MD5(`${username}:${realm}:${password}`).toString(CryptoJS.enc.Hex);
  const ha2 = CryptoJS.MD5(`${method}:${uri}`).toString(CryptoJS.enc.Hex);
  
  let response = '';
  if (qop === 'auth' || qop === 'auth-int') {
    response = CryptoJS.MD5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).toString(CryptoJS.enc.Hex);
  } else {
    response = CryptoJS.MD5(`${ha1}:${nonce}:${ha2}`).toString(CryptoJS.enc.Hex);
  }

  let authStr = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;
  if (opaque) authStr += `, opaque="${opaque}"`;
  if (qop) authStr += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;

  return authStr;
}
