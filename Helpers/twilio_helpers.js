const env=require('dotenv')
env.config()
const client =require('twilio')(process.env.TWILIO_ACCOUNDSID,process.env.TWILIO_AUTHTOCKEN)
const servicesId=process.env.TWILIO_SERVICEID

module.exports={
    doSms:(number)=>{
        console.log(number);
        let res={}
        return new Promise((resolve,reject)=>{
            client.verify.services(servicesId).verifications.create({
                to:`+91${number.phone}`,
                channel:'sms'
            }).then((res)=>{
                console.log(res);
                res.valid=true
                resolve(res)
            })
        })
    },
    otpVerify:(otpData,number)=>{
        let res={}
        return new Promise((resolve, reject) => {
            client.verify.services(process.env.TWILIO_SERVICEID).verificationChecks.create({
                to:`+91${number}`,
                code:otpData.otp
            }).then((res)=>{
                console.log(res);
                if(res.status === 'approved'){
                    resolve(response=true)
                }else{
                    resolve(response=false)

                }
            })
        })
    }
}