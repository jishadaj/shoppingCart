
function addToCart(proId){
    $.ajax({
        url:'/add_to_cart/'+proId,
        method:'get',
        success:(response)=>{
            console.log("cart",response);
            if(response.status){
                let count = $('#cart_count').html()
                count = parseInt(count)+1
                $("#cart_count").html(count)
            }
        }
    })
}

function addToWishlist(proId){
    $.ajax({
        url:'/add_to_wishlist/'+proId,
        method:'get',
        success:(response)=>{
            console.log(response);
            if(response.status){
                alert("done")
                let count = $('#wish_count').html()
                count = parseInt(count)+1
                $("#wish_count").html(count)
            }
        }
    })
}