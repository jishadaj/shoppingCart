var express = require('express');
var router = express.Router();
var productHelper = require('../Helpers/product_helpers')
var productHelpers = require('../Helpers/product_helpers')
var adminHelpers = require('../Helpers/admin_helpers');
var userHeplers = require('../Helpers/user_helpers')
const { response } = require('express');
const session = require('express-session');
const user_helpers = require('../Helpers/user_helpers');


const verifyLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  } else {
    res.redirect('/admin')
  }
}

/* GET users listing. */
router.get('/', function (req, res, next) {
  if (req.session.adminLoggedIn) {
    
    res.redirect('admin/home')
  } else {
    res.render('admin/admin_login', { layout: 'login_layout', "loginErr": req.session.loginErr });
    req.session.loginErr = false
  }
  //  let loginErr = req.session.loginErr
  //   res.render('admin/admin_login',{layout:'login_layout',loginErr})
  //   req.session.loginErr = false
});

router.post('/login', (req, res) => {
  adminHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminLoggedIn = true
      req.session.admin = response.admin
      res.redirect('home')
    } else {
      req.session.loginErr = "INVALID PASSWORD OR USERNAME..!!"
      res.redirect('/admin')
    }
  })
})

router.get('/home', verifyLogin, async(req, res) => {
  let admin = req.session.admin
  let dialyTotalSales = await adminHelpers.dialyTotalSales()
    let SalesDate = await adminHelpers.SalesDate()
    let arrayLength = dialyTotalSales.length-1
    let dailySales = dialyTotalSales[arrayLength]
    console.log('dialyTotalSales',dialyTotalSales)
    console.log('SalesDate',SalesDate);
  res.render('admin/admin_home', { layout: 'admin_layout', admin,dialyTotalSales,SalesDate })
})


router.get('/products', verifyLogin, (req, res) => {
  let admin = req.session.admin
  productHelpers.getProduct().then((products) => {
    res.render('admin/admin_products', { layout: 'admin_layout', products, admin })
  })

})
router.get('/add_product', verifyLogin, (req, res) => {
  let admin = req.session.admin
  productHelpers.viewCategory().then((category) => {
    res.render('admin/admin_add_product', { layout: 'admin_layout', admin, category })
  })

})

router.post('/add_product', verifyLogin, (req, res) => {
  console.log(req.body)
  console.log(req.files.Image)
  productHelper.addProduct(req.body, (id) => {
    let Image = req.files.Image
    console.log(id)
    Image.mv('./public/product_images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/admin_add_product', { layout: 'admin_layout' })
      } else {
        console.log(err)
      }
    })
  })
})

router.get('/logout', (req, res) => {
  req.session.adminLoggedIn = false
  req.session.admin = null

  res.redirect('/admin')
})

router.get('/del_product/:id', verifyLogin, (req, res) => {
  let proId = req.params.id
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/products')
  })
})

router.get('/edit_product/:id', verifyLogin, async (req, res) => {
  let admin = req.session.admin
  let product = await productHelpers.getProductDetails(req.params.id)
  
  res.render('admin/admin_edit_product', { layout: 'admin_layout', product, admin })
})

router.post('/edit_product/:id', verifyLogin, (req, res) => {
  console.log(req.params.id);
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/products')
    if (req.files.Image) {
      let Image = req.files.Image
      Image.mv('./public/product_images/' + req.params.id + '.jpg')
    }
  })
})

router.get('/category', verifyLogin, (req, res) => {

  let admin = req.session.admin
  productHelpers.viewCategory().then((category) => {
    res.render('admin/admin_category', { layout: 'admin_layout', admin, category })
  })

})

router.get('/add_category', verifyLogin, (req, res) => {
  let admin = req.session.admin
  let errMss = req.session.addCategoryErr
  res.render('admin/admin_add_category', { layout: 'admin_layout', admin, errMss })
  req.session.addCategoryErr = false
})
router.post('/add_category', verifyLogin, (req, res) => {
  productHelpers.addCategory(req.body).then((response) => {
    res.redirect('category')
  }).catch((err) => {
    req.session.addCategoryErr = err;
    res.redirect('add_category')
  })
})
router.get('/edit_category/:id', verifyLogin, async (req, res) => {
  let admin = req.session.admin
  let errMss = req.session.editCatErr
  let cateId = req.params.id
  productHelpers.getCatDetails(cateId).then((category) => {
    res.render('admin/admin_edit_category', { layout: 'admin_layout', category, admin, errMss })
    req.session.editCatErr = false

  }).catch((errMss) => {
    res.status(404).send(errMss)
  })

})

router.post('/edit_category/:id', verifyLogin, (req, res) => {
  productHelpers.editCategory(req.params.id, req.body).then(() => {
    console.log(response);
    res.redirect('/admin/category')

  }).catch((err) => {
    req.session.editCatErr = err
    res.redirect('back')
  })
})
router.get('/del_category/:id', verifyLogin, (req, res) => {
  let cateId = req.params.id
  productHelpers.deleteCategory(cateId).then((response) => {
    res.redirect('/admin/category')
  })
})
router.get('/user', verifyLogin, (req, res) => {
  let admin = req.session.admin
  user_helpers.getUsers().then((users) => {
    res.render('admin/admin_user', { layout: 'admin_layout', admin, users })
  })
})

router.get('/block/:id', verifyLogin, (req, res) => {
  userHeplers.userBlock(req.params.id).then(() => {
    res.redirect('/admin/user')

  })
})
router.get('/unblock/:id', verifyLogin, (req, res) => {
  userHeplers.userUnBlock(req.params.id).then((response) => {
    res.redirect('/admin/user')

  })
})
router.get('/orders', verifyLogin, async (req, res) => {
  let admin = req.session.admin
  adminHelpers.getAllOrders().then((orders)=>{
    res.render('admin/admin_orders', { layout: 'admin_layout',admin,orders })
  })

})

router.get('/banner',verifyLogin,(req,res)=>{
  let admin = req.session.admin
  productHelpers.getBanners().then((banners) => {
    res.render('admin/admin_banner',{ layout: 'admin_layout',admin,banners })
  })
  
})

router.get('/add_banner', verifyLogin, (req, res) => {
  let admin = req.session.admin
    res.render('admin/admin_add_banner', { layout: 'admin_layout', admin})

})

router.post('/add_banner', verifyLogin, (req, res) => {
  console.log(req.body)
  console.log(req.files.Image)
  productHelper.addBanner(req.body, (id) => {
    let Image = req.files.Image
    console.log(id)
    Image.mv('./public/banner_images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/banner')
      } else {
        console.log(err)
      }
    })
  })
})

router.get('/del_banner/:id', verifyLogin, (req, res) => {
  let banId = req.params.id
  productHelpers.deleteBanner(banId).then((response) => {
    res.redirect('/admin/banner')
  })
})

router.get('/shipped/:id',verifyLogin,(req,res)=>{
  console.log(req.params.id);
  adminHelpers.orderShipped(req.params.id).then((response)=>{
    res.json({status:true})
  })
})

router.get('/accept/:id',verifyLogin,(req,res)=>{
  console.log(req.params.id);
  adminHelpers.orderAccept(req.params.id).then((response)=>{
    res.json({status:true})
  })
})

router.get('/transit/:id',verifyLogin,(req,res)=>{
  console.log(req.params.id);
  adminHelpers.orderTransit(req.params.id).then((response)=>{
    res.json({status:true})
  })
})

router.get('/delivered/:id',verifyLogin,(req,res)=>{
  console.log(req.params.id);
  adminHelpers.orderDelivered(req.params.id).then((response)=>{
    res.json({status:true})
  })
})

router.get('/cancelled/:id',verifyLogin,(req,res)=>{
  console.log(req.params.id);
  adminHelpers.orderCancel(req.params.id).then((response)=>{
    res.json({status:true})
  })
})

router.get('/coupons',verifyLogin,(req,res)=>{
  let admin = req.session.admin
  adminHelpers.getAllCoupons().then((coupons)=>{
    res.render('admin/admin_coupons', { layout: 'admin_layout', admin,coupons})
  })
  
})

router.get('/add_coupons', verifyLogin, (req, res) => {
  let admin = req.session.admin
  let errMss = req.session.addCouponErr
  res.render('admin/admin_add_coupons', { layout: 'admin_layout', admin,errMss})
  req.session.addCouponErr = false

})

router.post('/add_coupon',verifyLogin,(req,res)=>{
  console.log(req.body);
  adminHelpers.addCoupon(req.body).then((response) => {
    res.redirect('coupons')
  }).catch((err) => {
    req.session.addCouponErr = err;
    res.redirect('add_coupons')
  })
})

router.get('/remove_coupon/:id',verifyLogin,(req,res)=>{
  
  adminHelpers.removeCoupons(req.params.id).then((response)=>{
    res.json({status:true})
  })
})






module.exports = router;
