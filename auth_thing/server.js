const fetch = require("node-fetch");
const fs = require("fs");
const rl = require("readline-sync");
const auths = [];

async function createAuthSession() {
    const baseUrl = "https://account-public-service-prod03.ol.epicgames.com/account/api"

    const accessTokenRes = await fetch(`${baseUrl}/oauth/token`, {
        "method": "POST",
        "headers": {
            "Authorization": "Basic YjA3MGYyMDcyOWY4NDY5M2I1ZDYyMWM5MDRmYzViYzI6SEdAWEUmVEdDeEVKc2dUIyZfcDJdPWFSbyN+Pj0+K2M2UGhSKXpYUA==",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "body": "grant_type=client_credentials"
    });
    const accessToken = await accessTokenRes.json();

    const deviceCodeRes = await fetch(`${baseUrl}/oauth/deviceAuthorization`, {
        "method": "POST",
        "headers": {
            "Authorization": `bearer ${accessToken.access_token}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "body": "prompt=login"
    });
    const deviceCode = await deviceCodeRes.json();

    async function getDeviceCode(deviceCode) {
        const res = await fetch(`${baseUrl}/oauth/token`, {
            "method": "POST",
            "headers": {
                "Authorization": "Basic NTIyOWRjZDNhYzM4NDUyMDhiNDk2NjQ5MDkyZjI1MWI6ZTNiZDJkM2UtYmY4Yy00ODU3LTllN2QtZjNkOTQ3ZDIyMGM3",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            "body": `grant_type=device_code&device_code=${deviceCode.device_code}`
        });
        const data = await res.json();
        return {
            "status": res.status,
            "data": data
        };
    };

    async function deviceAuth(user) {
        const res = await fetch(`${baseUrl}/public/account/${user.account_id}/deviceAuth`, {
            "method": "POST",
            "headers": {
                "Authorization": `Bearer ${user.access_token}`
            }
        });
        const data = await res.json();
        const deviceAuth = { accountId: data.accountId, deviceId: data.deviceId, secret: data.secret };

        auths.push(deviceAuth);
        fs.writeFileSync("./deviceAuth.json", JSON.stringify(auths, null, 2), { "encoding": "utf8" });
        console.log(`Created device auth for: ${deviceCode.verification_uri_complete}!`);
    };

    console.log(`https://www.epicgames.com/id/logout?redirectUrl=${deviceCode.verification_uri_complete}`);
    const interval = setInterval(async function() {
        const res = await getDeviceCode(deviceCode);
        if (res.status == 200) {
            clearInterval(interval);
            deviceAuth(res.data);
        };
    }, 500);
};

const amount = rl.question("How many bots do you want to run? ");
for(let i = 0; i < amount; i++) {
    createAuthSession();
};