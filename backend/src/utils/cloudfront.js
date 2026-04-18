const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");

const getCloudFrontSignedUrl = (fileKey) => {
    const url = `https://${process.env.CLOUDFRONT_DOMAIN}/${fileKey}`;

    return getSignedUrl({
        url,
        keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        privateKey: process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        dateLessThan: new Date(Date.now() + 1000 * 60 * 60)
    });
};

module.exports = { getCloudFrontSignedUrl };