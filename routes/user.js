var express = require('express');
const twilio_helpers = require('../Helpers/twilio_helpers');
var router = express.Router();
const userHeplers = require('../Helpers/user_helpers');
var productHelpers = require('../Helpers/product_helpers');
const { getTotalAmount, verifyPayment } = require('../Helpers/user_helpers');
const { response } = require('express');
const admin_helpers = require('../Helpers/admin_helpers');

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  let wishCount = null
  if (req.session.user) {
    cartCount = await userHeplers.getCartCount(req.session.user._id)
    wishCount = await userHeplers.getWishCount(req.session.user._id)
  }
  let category = await productHelpers.viewCategory()
  let banner = await productHelpers.getBanners()
  productHelpers.getProduct().then((products) => {
    let user = req.session.user
    res.render('user/user_home', { user, products, cartCount, category, wishCount,banner });
  })

});

router.get('/login', function (req, res, next) {

  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/user_login', { layout: 'login_layout', "loginErr": req.session.loginErr });
    req.session.loginErr = false
  }

});

router.get('/sign_up', function (req, res, next) {
  res.render('user/user_sign_up', { layout: 'login_layout' });
});

router.post('/sign_up', (req, res) => {
  console.log(req.body);
  req.session.userBody = req.body
  twilio_helpers.doSms(req.body).then((response) => {
    console.log(response);
    if (response.valid) {
      console.log('hiii');
      res.render('user/otp', { layout: 'login_layout' })
    } else {
      console.log('hello');
      res.redirect('/sign_up')
    }
  })


  // userHeplers.doSignup(req.body).then((response)=>{
  //   console.log(response);
  //   req.session.loggedIn = true
  //   req.session.user=response.user
  //   res.redirect('/otp')
  // })
})
// router.get('/sign_up',(req,res)=>{
//   res.render('user/otp',{layout:'login_layout'})
// });
router.post('/otp', (req, res) => {
  twilio_helpers.otpVerify(req.body, req.session.userBody.phone).then((response) => {
    console.log(response);
    if (response) {
      userHeplers.doSignup(req.session.userBody).then((response) => {

        req.session.loggedIn = true
        req.session.user = response.user
        res.redirect('/')
      })
    } else {
      res.render('user/otp', { layout: 'login_layout', otp_error: 'otp invalid' })
    }
  })

})

router.post('/login', (req, res) => {
  userHeplers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginErr = "INVALID PASSWORD OR USERNAME..!!"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.loggedIn = false
  req.session.user = null
  res.redirect('/')
})

router.get('/cart', verifyLogin, async (req, res, next) => {
  let cartCount = null
  let wishCount = null
  if (req.session.user) {
    cartCount = await userHeplers.getCartCount(req.session.user._id)
    wishCount = await userHeplers.getWishCount(req.session.user._id)
  }
  let products = await userHeplers.getCartProducts(req.session.user._id)
  let category = await productHelpers.viewCategory(req.session.user._id)
  let totalValue = await userHeplers.getTotalAmount(req.session.user._id)

  res.render('user/user_cart', { user: req.session.user, products, cartCount, category, totalValue,wishCount })
})

// router.get('/remove_cart/',verifyLogin,(req,res)=>{
//   //userHeplers.removeCart(cartId).then(()=>{
//     console.log("sgsegs",req.query.id,req.session.user._id);
//   //})
// })

router.get('/shop', async (req, res) => {
  let cartCount = null
  let wishCount = null
  if (req.session.user) {
    cartCount = await userHeplers.getCartCount(req.session.user._id)
    wishCount = await userHeplers.getWishCount(req.session.user._id)
  }
  let category = await productHelpers.viewCategory()

  productHelpers.getProduct().then((products) => {
    res.render('user/user_shop', { user: req.session.user, products, cartCount, category,wishCount })
  })

})

router.get('/add_to_wishlist/:id',verifyLogin, async (req,res,next)=>{
  console.log("whishlist proceeding");
  let wishCount = null
  if (req.session.user) {
    wishCount = await userHeplers.getWishCount(req.session.user._id)
  }
  console.log("cccccccccccccccc",wishCount);
  userHeplers.addToWish(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })

})

router.get('/add_to_cart/:id', verifyLogin, async (req, res, next) => {
  console.log("api call");
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHeplers.getCartCount(req.session.user._id)
  }
  userHeplers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

router.post('/change_product_quantity', (req, res, next) => {

  userHeplers.changeProQuant(req.body).then(async (response) => {
    response.total = await userHeplers.getTotalAmount(req.session.user._id)
    res.json(response)
  })
})

router.post('/remove_cartItem', verifyLogin, (req, res) => {
  userHeplers.removeCartItem(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/place_order', verifyLogin, async (req, res) => {
  let products = await userHeplers.getCartProducts(req.session.user._id)
  let total = await userHeplers.getTotalAmount(req.session.user._id)
  let address =await userHeplers.getUserAdress(req.session.user._id)
  let cartCount = await userHeplers.getCartCount(req.session.user._id)
  let wishCount = await userHeplers.getWishCount(req.session.user._id)
  let coupons = await admin_helpers.getAllCoupons(req.session.user._id)

  res.render('user/user_checkout', { user: req.session.user, products, total,address,cartCount,wishCount,coupons });
});

router.post('/place_order', verifyLogin, async (req, res) => {

  let products = await userHeplers.getCartProList(req.body.userId)
  let totalPrice = 0
  if(req.session.coupon){
    totalPrice = req.session.total
  }else{
    totalPrice = await userHeplers.getTotalAmount(req.body.userId)
  }
  
  let couponDetais = req.session.coupon

  userHeplers.placeOrder(req.body, products, totalPrice,couponDetais).then((orderId) => {

    if (req.body['payment_method'] === 'COD') {
      res.json({ cod_success: true })
    } else {
      userHeplers.generateRazorPay(orderId, totalPrice).then((response) => {
        res.json(response)

      })
    }

  })

})

router.get('/cod_success', verifyLogin, (req, res) => {
  res.render('user/cod_success_page', { user: req.session.user, layout: 'login_layout' })
})

router.get('/orders', verifyLogin, async (req, res) => {
  let category = await productHelpers.viewCategory()
  let orders = await userHeplers.getOrders(req.session.user._id)
  res.render('user/user_orders', { user: req.session.user, orders, category })

})
router.get('/view_orders', verifyLogin, async (req, res) => {
  // let category = await productHelpers.viewCategory()
  let products = await userHeplers.getOrderproducts(req.query.id)
  res.render('user/user_order_products', { user: req.session.user, products })

})

router.post('/verify_payment', verifyLogin, (req, res) => {
  console.log(req.body);
  userHeplers.verifyPayment(req.body).then(() => {
    userHeplers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("payment success");
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false })
  })
})

router.get('/profile', verifyLogin,async(req, res) => {
   let cartCount = await userHeplers.getCartCount(req.session.user._id)
   let address = await userHeplers.getUserAdress(req.session.user._id) 
   let wishCount = await userHeplers.getWishCount(req.session.user._id)  
    res.render('user/user_profile',{user: req.session.user,address,cartCount,wishCount})
 
})

router.post('/add_address', verifyLogin, (req, res) => {
  userHeplers.addAddress(req.body).then(() => {
    res.redirect('/profile')
  })

})

router.get('/address',verifyLogin,(req,res)=>{ 
  res.render('user/user_address',{user: req.session.user})
})

router.get('/edit_address',verifyLogin,async(req,res)=>{
  
  let address = await userHeplers.getAddressDetails(req.query.id)
  res.render('user/user_editAddress',{user: req.session.user,address})
})

router.post('/edit_address',verifyLogin,async(req,res)=>{
  console.log("jishad",req.query.id,req.body);
  userHeplers.updateAddress(req.query.id,req.body).then(()=>{
    res.redirect('/profile')
  })
})

router.get('/del_address',verifyLogin,(req,res)=>{
  userHeplers.delAddress(req.query.id).then((response)=>{
    res.redirect('/profile')
  })
})

router.post('/update_user',verifyLogin,(req,res)=>{
  console.log("aaaaaaaaaaaaaaaaaaaaaa",req.query.id,req.body);
  userHeplers.updateUser(req.query.id,req.body).then((response)=>{
    res.redirect('/profile')
  })
})

router.get('/wishlist',verifyLogin,async(req,res)=>{
  let cartCount = null
  let wishCount = null
  if (req.session.user) {
    cartCount = await userHeplers.getCartCount(req.session.user._id)
    wishCount = await userHeplers.getWishCount(req.session.user._id)
  }
  let products = await userHeplers.getWishProducts(req.session.user._id)
  
  let totalValue = await userHeplers.getWishTotalAmount(req.session.user._id)

  res.render('user/user_wishlist', { user: req.session.user, products, cartCount, totalValue, wishCount })
})

router.post('/remove_wishItem', verifyLogin, (req, res) => {
  userHeplers.removeWishItem(req.body).then((response) => {
    res.json(response)
  })
})

router.post('/apply_coupon',(req,res)=>{
  console.log('dfsfa',req.body);
  productHelpers.applyCoupon(req.body).then((response)=>{
    if (response.status) {
      req.session.coupon = response.coupon
      req.session.total = response.discountTotal
    }
    res.json(response)
  })
})







module.exports = router;
