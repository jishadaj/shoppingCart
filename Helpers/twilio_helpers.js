const client =require('twilio')('AC4cf01ad73ef371a51889153dcde1c38f','68277e84e25c84ec05f2c5ffc3dae074')
const servicesId='VA60dff821219b8ee9b0b2e04bbe9b9a01'

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
            client.verify.services(servicesId).verificationChecks.create({
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