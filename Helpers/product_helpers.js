var db = require('../config/connection')
var collection = require('../config/collections')
const collections = require('../config/collections')
const { response } = require('express')
var objectId = require('mongodb').ObjectId



module.exports = {

    addProduct: (product, callback) => {
        console.log( product );
        product.Price = parseInt(product.Price)
        db.get().collection('product').insertOne(product).then((data) => {
            callback(data.insertedId)
        })
    },

    getProduct: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTIONS).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTIONS).deleteOne({ _id: objectId(proId) }).then((response) => {
                console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTIONS).findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTIONS)
                .updateOne({ _id: objectId(proId) }, {
                    $set: {
                        Name: proDetails.Name,
                        Category: proDetails.Category,
                        Price: proDetails.Price,
                        Discription: proDetails.Discription
                    }
                }).then((response) => {
                    resolve()
                })
        })
    },
    addCategory: (category) => {
        return new Promise(async (resolve, reject) => {
            category.categoryName = category.categoryName.toUpperCase()
            let categoryRes = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ categoryName: category.categoryName })

            if (categoryRes) {
                reject('Category Already Exists')
            } else {
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((response) => {
                    resolve()
                })
            }
        })
    },
    viewCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },
    getCatDetails: (cateId) => {
        return new Promise((resolve, reject) => {
            let catRes = db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(cateId) })
            if (catRes) {
                resolve(catRes)
            } else {
                reject("Not Found")
            }
        })
    },
    editCategory: (cateId, editedCat) => {
        console.log(cateId);
        editedCat.categoryName = editedCat.categoryName.toUpperCase()
        return new Promise(async (resolve, reject) => {
            let sameCategory = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ categoryName: editedCat.categoryName })
            if (sameCategory) {
                reject("Alredy Exists")
            } else {
                db.get().collection(collection.CATEGORY_COLLECTION)
                    .updateOne({ _id: objectId(cateId) }, {
                        $set: {
                            categoryName: editedCat.categoryName
                        }
                    }).then((response) => {
                        resolve()
                    })
            }
        })
    },
    deleteCategory: (delCat) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(delCat) }).then((response) => {
                resolve(response)
            })
        })
    },
    addBanner: (banner, callback) => {

        db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((data) => {
            callback(data.insertedId)
        })
    },
    getBanners: () => {
        return new Promise(async (resolve, reject) => {
            let banners = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banners)
        })
    },
    deleteBanner: (banId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BANNER_COLLECTION).deleteOne({ _id: objectId(banId) }).then((response) => {
                console.log(response);
                resolve(response)
            })
        })
    },

    applyCoupon: (data) => {
        return new Promise(async (resolve, reject) => {
            console.log('applyCoupon', data.couponId, data.userId, data.total);
            let response = {}
            response.Discount = 0
            let coupon = await db.get().collection(collection.COUPONS_COLLECTION).findOne({ _id: objectId(data.couponId) })
            console.log("hhhhhhhhhhhhhhhhh",coupon);
            if (coupon) {
                let userExit = await db.get().collection(collection.COUPONS_COLLECTION).
                    findOne({ _id: objectId(data.couponId), user: { $in: [objectId(data.userId)] } })
                if (userExit) {
                    response.status = false
                    resolve(response)
                    console.log('333', response);
                } else {
                    response.status = true
                    response.coupon = coupon

                    response.discountTotal = data.total - ((data.total * coupon.Discount) / 100)
                    response.discountPrice = (data.total * coupon.Discount) / 100
                    console.log(response);
                    resolve(response)
                }
            } else {
                response.status = false
                resolve(response)
            }
        })

    }

}