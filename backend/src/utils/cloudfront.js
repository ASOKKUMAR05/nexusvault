const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");

export const getCloudFrontSignedUrl = (fileKey) => {
    const url = `https://${process.env.CLOUDFRONT_DOMAIN}/${fileKey}`;

    const signedUrl = getSignedUrl({
        url,
        keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
        dateLessThan: new Date(Date.now() + 1000 * 60 * 60) // 1 hour
    });

    return signedUrl;
};