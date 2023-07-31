const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const PAYPAY = require('@paypayopa/paypayopa-sdk-node');
const dotenv = require("dotenv")
const { v4: uuidv4 } = require('uuid');
const configs = require('./config.json');

const port = process.env.APP_PORT ? process.env.APP_PORT : 4000;

const API_KEY       = configs.API_KEY;
const API_SECRET    = configs.API_SECRET;
const MERCHANT_ID   = configs.MERCHANT_ID;

function configurePayPay() {
    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: false
    });
}
configurePayPay();

const app = express();
app.disable("x-powered-by");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname));
// app.use("/", apiRouter);

app.get("/", (req, res) => {
    res.render(__dirname+"index.html")
})

async function getQR(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: false
    });

    var uuid = uuidv4() // 支払いID（一意になるようにuuidで生成）    
    // const merchantPaymentId = uuid;
    const merchantPaymentId = BigInt(
        "0x" + uuid.replace(/-/g, "")
    ).toString();
    // const merchantPaymentId = BigInt(hex).toString(); // don't convert this to a number

    const amount        = req.body.amount;  
    const description   = req.body.description;  
    const redirectUrl   = req.body.redirectUrl + "&merchantPaymentId="+ merchantPaymentId; //"http://127.0.0.1/web/shopping/sln_card_payment?flag=1",

    let payload = {
        merchantPaymentId: merchantPaymentId,
        amount: {
            amount: amount,
            currency: "JPY"
        },
        codeType: "ORDER_QR",
        orderDescription: description,
        isAuthorization: false,
        redirectUrl: redirectUrl,
        redirectType: "WEB_LINK",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1"
    };
    
    const response = await PAYPAY.QRCodeCreate(payload);
    let body_arr = JSON.parse(response.BODY);
    if(body_arr.resultInfo.code === 'SUCCESS'){
       
        // open(body_arr.data.url);
    }
    const body = response.BODY;
    // console.log(response.STATUS, body.resultInfo.code);
    console.log(body);
    res.send(response.BODY)
}


async function GetCodePaymentDetails(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: false
    });

    const merchantPaymentId        = req.body.merchantPaymentId;  
    
    const response1 = await PAYPAY.GetCodePaymentDetails([merchantPaymentId]);
    const body1 = response1.BODY;
    res.send(body1);
    console.log(body1.resultInfo.code);
    console.log(body1);
}


async function SetPaymentRefund(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: false
    });

    const amount            = req.body.amount;  
    const merchantPaymentId = req.body.merchantPaymentId;  
    const paymentId         = req.body.paymentId; 
    const description       = req.body.reason_des;  
           
    let payload = {
        merchantRefundId: merchantPaymentId,
        paymentId: paymentId,
        amount: {
            amount: amount,
            currency: 'JPY',
        },
        reason: description,
    };

    console.log(payload);
    
    // Calling the method to refund a Payment
    PAYPAY.PaymentRefund(payload, (response) => {
        // Printing if the method call was SUCCESS
        console.log(response.BODY);
        res.send(response.BODY);
    });
}

async function PaymentCancel(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: false
    });

    const merchantPaymentId        = req.body.merchantPaymentId;  
    
    PAYPAY.PaymentCancel(Array(merchantPaymentId), (response) => {
        console.log(response.BODY);
        // Printing if the method call was SUCCESS
        res.send(response.BODY);
        });
}

async function GetRefundDetails(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: false
    });

    const merchantRefundId        = req.body.merchantRefundId;  

    PAYPAY.GetRefundDetails(Array(merchantRefundId), (response) => {
        // Printing if the method call was SUCCESS
        console.log(response.BODY.resultInfo.code);
        res.send(response.BODY);
        }); 
}
    
async function QRCodeDelete(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: false
    });

    const codeId        = req.body.codeId;  

    PAYPAY.QRCodeDelete(Array(codeId), (response) => {
        // Printing if the method call was SUCCESS
        console.log(response.BODY.resultInfo.code);
        res.send(response.BODY);
    }); 
}
    

app.post("/QRCodeDelete", (req, res) => {    
    
    QRCodeDelete(req, res);
    
    // console.log(req);
})

app.get("/PaymentCancel", (req, res) => {    
    
    PaymentCancel(req, res);
    
    // console.log(req);
})

app.post("/GetRefundDetails", (req, res) => {    
    
    GetRefundDetails(req, res);    
    // console.log(req);
})

app.post("/SetPaymentRefund", (req, res) => {    
    
    SetPaymentRefund(req, res);    
    // console.log(req);
})

app.post("/getPaymentDetails", (req, res) => {    
    
    GetCodePaymentDetails(req, res);    
    // console.log(req);
})


app.get("/getQR", (req, res) => {    
    
    getQR(req, res);
    
    // console.log(req);
})

app.post("/getQR", (req, res) => {    
    getQR(req, res);
})

app.post("/auth", (req, res) => {
    let payload = {
        scopes: [
            "direct_debit"
        ],
        nonce: "random_generated_string",
        redirectType: "WEB_LINK",
        redirectUrl: "https://google.com",
        referenceId: uuidv4()
    };
    // Calling the method to create the account linking QR Code
    PAYPAY.AccountLinkQRCodeCreate(payload, (response) => {
        // Printing if the method call was SUCCESS
        console.log(response.BODY.resultInfo.code);
        // Printing the link to the generated QR Code
        res.send(response.BODY)
    });
})

app.post("/payment", (req, res) => {
    const token = req.headers['authorization']
    const userAuthId = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    const {amount, id} = req.body
    let payload = {
        merchantPaymentId: uuidv4(),
        amount: {
           amount,
           currency: "JPY"
        },
        userAuthorizationId: userAuthId.userAuthorizationId,
        orderDescription: `Deposit ${id}`
      };
      // Calling the method to create a qr code
      PAYPAY.CreatePayment(payload, (response) => {
      // Printing if the method call was SUCCESS
          res.send(response.BODY)
      });
})


app.get("/getInfo", (req, res) => {   
    
    res.send('clientId: ' + API_KEY + '<br> clientSecret: '+API_SECRET + '<br> merchantId: '+MERCHANT_ID);   
  
})

app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});