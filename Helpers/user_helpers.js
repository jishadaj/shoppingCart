var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
const { ObjectID } = require('bson')
var objectId = require('mongodb').ObjectId
var moment = require('moment')
const Razorpay = require('razorpay')
const { resolve } = require('path')
var instance = new Razorpay({
    key_id: 'rzp_test_C2SwUfxIkg9Jhn',
    key_secret: '4Qi3v1d6ZppJVp3EABdUMyho',
});


module.exports = {
    doSignup: (userData) => {

        userData.isBlocked = false
        return new Promise(async (resolve, reject) => {
            let response = {}

            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTIONS).insertOne(userData).then(async (data) => {
                let user = await db.get().collection(collection.USER_COLLECTIONS).findOne((data.insertedId))
                response.user = user
                resolve(response)
            })
        })

    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTIONS).findOne({ email: userData.Email, isBlocked: false })
            let blocked = await db.get().collection(collection.USER_COLLECTIONS).findOne({ email: userData.Email, isBlocked: true })
            console.log(user);
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log("login success");
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("login failed")
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("login not found")
                resolve({ status: false })
            }
        })
    },
    addToWish: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userWish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (userWish) {
                // let proExist = userWish.products.findIndex(product => product.item == proId)
                // console.log(proExist);
                // if (proExist != -1) {
                //     db.get().collection(collection.CART_COLLECTION)
                //         .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                //             {
                //                 $inc: { 'products.$.quantity': 1 }
                //             }).then(() => {
                //                 resolve()
                //             })
                // } else {
                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {

                                $push: { products: proObj }

                            }
                        ).then((response) => {
                            resolve(response)
                        })
               // }

            } else {
                let wishObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response) => {
                    resolve(response)
                })
            }

        })
    },

    getWishProducts: (userId) => {
        return new Promise(async (resolve, reject) => {

            let wishItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([   
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(wishItems)
        })
    },

    getWishTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {

                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.Price'] } }
                    }
                }

            ]).toArray()

            resolve(total[0]?.total)
        })
    },

    getWishCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let wish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (wish) {
                count = wish.products.length
            }
            resolve(count)
        })
    },
    removeWishItem: (details) => {

        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION)
                .updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve(response)
                })
        })
    },

    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {

                                $push: { products: proObj }

                            }
                        ).then((response) => {
                            resolve()
                        })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {

                    resolve()
                })
            }

        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {

            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([   
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProQuant: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        console.log(details, 'fdsfsdfsd');

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }).then((response) => {


                            resolve({ status: true })

                        })
            }

        })
    },
    getUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTIONS).find().toArray()
            resolve(users)
        })
    },
    userBlock: (userId) => {
        return new Promise(async (resolve, reject) => {
            let block = await db.get().collection(collection.USER_COLLECTIONS)
                .updateOne({ _id: objectId(userId) },
                    { $set: { isBlocked: true } })
            resolve()
        })
        //console.log("blocked",response);

    },
    userUnBlock: (userId) => {
        return new Promise(async (resolve, reject) => {
            let unblock = await db.get().collection(collection.USER_COLLECTIONS)
                .updateOne({ _id: objectId(userId) },
                    { $set: { isBlocked: false } })
            resolve(response)
        })


    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {

                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.Price'] } }
                    }
                }

            ]).toArray()

            resolve(total[0]?.total)
        })
    },
    placeOrder: (order, products, total,couponDetais) => {

        return new Promise((resolve, reject) => {

            let status = order.payment_method === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    firstName: order.fname,
                    lastName: order.lname,
                    country: order.country,
                    address: order.address1,
                    townCity: order.town_city,
                    state: order.state,
                    pincode: order.pin,
                    phone: order.phone,
                    email: order.email,
                    date: moment(new Date()).format("dddd MMM Do YY"),
                },
                userId: objectId(order.userId),
                paymentMethod: order.payment_method,
                products: products,
                totalAmount: total,
                status: status
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                if(couponDetais){
                    db.get().collection(collection.COUPONS_COLLECTION).updateOne({_id:objectId(couponDetais._id)},
                    {
                        $push:{
                            user:objectId(order.userId)
                        }
                    })
                }
                resolve(response.insertedId)
            })

        })
    },
    getCartProList: (userId) => {
        return new Promise(async (resolve, reject) => {

            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            resolve(cart.products)
        })
    },
    getOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: objectId(userId) }
                ).toArray()
            resolve(orders)
        })
    },
    getOrderproducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()

            resolve(orderItems)
        })
    },
    generateRazorPay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, (err, order) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("razorpayyyyy", order);
                    resolve(order)
                }

            });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', '4Qi3v1d6ZppJVp3EABdUMyho');

            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')

            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }
                ).then(() => {
                    resolve()
                })
        })
    },
    removeCartItem: (details) => {

        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve(response)
                })
        })
    },
    addAddress: (address) => {
        address.UserId = objectId(address.UserId);
        return new Promise(async (resolve, reject) => {

            db.get().collection(collection.ADDRESS_COLLECTION).insertOne(address).then(() => {
                resolve()
            })
        })
    },
    getUserAdress: (UserId) => {
        
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({ UserId: objectId(UserId) }
            ).toArray()
            
            resolve(address)

        })

    },
    getAddressDetails:(addId)=>{
        return new Promise(async(resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).findOne({_id:objectId(addId)}).then((address)=>{
                resolve(address)
            })
        })
    },
    updateAddress:(addId,body)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).updateOne({_id:objectId(addId)},
            {
                $set:{
                    Address:body.Address,
                    City:body.City,
                    State:body.State,
                    Country:body.Country,
                    Pin:body.Pin
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    delAddress:(addId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({_id:objectId(addId)}).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    updateUser:(userId,body)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTIONS).updateOne({_id:objectId(userId)},
            {
                $set:{
                    name:body.username,
                    email:body.email,
                    phone:body.phone,
                    password:body.password
                    
                }
            }).then((response)=>{
                resolve()
            })
        })
    }

}