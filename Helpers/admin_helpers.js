var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { NewFactorInstance } = require('twilio/lib/rest/verify/v2/service/entity/newFactor')
const { ObjectId } = require('mongodb')

module.exports = {
    
    doLogin:(userData)=>{
        return new Promise(async(resolve, reject) => {
            let loginStatus =false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({email:userData.Email})
            if (admin){
                bcrypt.compare(userData.Password,admin.Password).then((status)=>{
                    if (status) {
                        console.log("login success");
                        response.admin=admin
                        response.status=true
                        resolve(response)
                    }else{
                        console.log("login failed") 
                        resolve({status:false})
                    }
                })
            }else{
                console.log("login not found")
                resolve({status:false})
            }
        })
    },

    getAllOrders:()=>{
        return new Promise(async(resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
            .find().toArray()
            resolve(orders)
        })
    },

    orderShipped:(orderId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status: 'Shipped'
                }
            }).then(()=>{
                resolve()
            })
        })
    },

    orderAccept:(orderId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status: 'Accept'
                }
            }).then(()=>{
                resolve()
            })
        })
    },

    orderTransit:(orderId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status: 'In Transit'
                }
            }).then(()=>{
                resolve()
            })
        })
    },

    orderDelivered:(orderId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status: 'Delivered'
                }
            }).then(()=>{
                resolve()
            })
        })
    },

    orderCancel:(orderId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status: 'cancelled'
                }
            }).then(()=>{
                resolve()
            })
        })
    },

    addCoupon: (coupon) =>{
        coupon.Name = coupon.Name.toUpperCase()
        coupon.user = []
        coupon.Discount = parseInt(coupon.Discount)
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPONS_COLLECTION).findOne({Name: coupon.Name })
            if (coupons) {
                reject('already exist')
            } else {
                db.get().collection(collection.COUPONS_COLLECTION).insertOne(coupon).then((response) => {
                    resolve(response)
                })
            }
        })
    },

    getAllCoupons: () => {
        return new Promise(async (resolve, reject) => {
            let Coupon = await db.get().collection(collection.COUPONS_COLLECTION).find().toArray()
            resolve(Coupon)
        })
    },

    removeCoupons: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPONS_COLLECTION).deleteOne({ _id: ObjectId(couponId) }).then(() => {
                resolve()
            })
        })
    },

    SalesDate: () => {
        return new Promise(async (resolve, reject) => {
          let  total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $project: {
                        totalAmount: 1,
                        deliveryDetails: 1
                    }
                },
                {
                    $group: {
                        _id: '$deliveryDetails.date',
                        total: { $sum: '$totalAmount' }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                },
                {
                    $project: {
                        _id: 1,
                        total: 0
                    }
                },
                {
                    $limit: 7
                }
            ]).toArray()
            var totalId = total.map(function (item) {
                return item['_id']
            })
            resolve(totalId)
            console.log('totalId',totalId);
        })
    },
    dialyTotalSales: () => {
        return new Promise(async (resolve, reject) => {
          let  total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $project: {
                        totalAmount: 1,
                        deliveryDetails: 1
                    }
                },
                {
                    $group: {
                        _id: '$deliveryDetails.date',
                        total: { $sum: '$totalAmount' }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                },
                {
                    $project: {
                        _id: 0,
                        total: 1
                    }
                },
                {
                    $limit: 7
                }
            ]).toArray()
            var totalId = total.map(function (item) {
                return item['total']
            })
            resolve(totalId)
            console.log('totalId2323',totalId);
        })
    }
}