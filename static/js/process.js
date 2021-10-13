$(function () {
    $.getCookie = function (key) {
        const cookies = document.cookie;
        const list = cookies.split(";"); // 解析出名/值对列表
		for (let i = 0; i < list.length; i++) {
            const arr = list[i].split("="); // 解析出名和值
			if (arr[0].replace(/^\s*|\s*$/g, "") === key)
				if (!decodeURIComponent(arr[1]))
					return decodeURIComponent(arr[1]); // 对cookie值解码
				else
					return arr[1]
		}
		return "";
    }

    function get() {
        let mypaths = $.getCookie('my_paths')
        if (mypaths === '' || mypaths.length <= 0) {
            mypaths = [{
                src: location.href,
                open: 1
            }]
            document.cookie = "my_paths=" + JSON.stringify(mypaths) +"; expires=Thu, 18 Dec 2043 12:00:00 GMT; path=/"
        } else {
            mypaths = JSON.parse(mypaths)
            for (let i = 0; i < mypaths.length; i++) {
                if (mypaths[i]['src'] === location.href) {
                    mypaths[i]["open"] = parseInt(mypaths[i]["open"])+1
                    document.cookie = "my_paths=" + JSON.stringify(mypaths) +"; expires=Thu, 18 Dec 2043 12:00:00 GMT; path=/"
                    return
                }
            }
            mypaths.push({
                src: location.href,
                open: 1
            })
            document.cookie = "my_paths=" + JSON.stringify(mypaths) +"; expires=Thu, 18 Dec 2043 12:00:00 GMT; path=/"
        }
    }
    if(location.href[location.href.length-1]==='0'){
        get()
    }

    // console.log($.getCookie('my_paths'))

    // 大图原始大小
    let img_width,img_height
    // 小图原始大小
    let logo_width, logo_height
    // 旋转比例
    let route=0

    $('img.lazy').lazyload({
       //图片显示时淡入效果
　　　　effect: "fadeIn",
       //没有加载图片时的临时占位符
// 　　　　placeholder: "images/default.png",
       //图片在距离屏幕 200 像素时提前加载.
　　　　threshold: 200,
　　　　//将图片加载放进click事件中（不常用）
// 　　　　event:"click",
　　　　//加载隐藏的图片（不常用）
　　　　skip_invisible : false
　　　　//其他配置项请查看官网
　　})

    $('.body').css('height', (window.innerHeight-60)+'px')
    $(window).on('resize', function () {
        $('.body').css('height', (window.innerHeight-60)+'px')
    })


    $.resize_img = function () {
        const img_logo = $('#logo')
        const big_img = $('#full_img')
        big_img.css('height', 'auto')
        big_img.css('width', 'auto')
        // 原始大小
        img_width = big_img.width()
        img_height = big_img.height()
        // 初始化logo大小
        img_logo.css('width', 'auto')
        img_logo.css('width', 'auto')
        logo_width = img_logo.width()
        logo_height = img_logo.height()
        // 自适应大小
        if(img_height>=img_width){
            big_img.css('height', (window.innerHeight-60-40-50)+'px')
        }else{
            big_img.css('width', (window.innerHeight-60-40-200)+'px')
        }
        // 按比例缩小logo大小
        // console.log(logo_width)
        img_logo.css('width', logo_width*(big_img.width()/img_width)+'px')
    }


    $('.lazy').on('click', function () {
        const img = event.path[0]
        const big_img = $('#full_img')
        big_img.attr('src', img.src)
        big_img.attr('alt', img.alt)
        $.resize_img()
    })


    $('#my_file').on('change', function () {
        let file = event.path[0].files;
        if(file.length<=0){
            return
        }
        file = file[0]
        let file_name = file.name
        const extStart = file_name.lastIndexOf(".");
        const ext = file_name.substring(extStart, file_name.length).toUpperCase();
        if(!/(GIF|JPEG|JPG|PNG|ICO)/.test(ext)) {
            alert("文件类型仅限于ico,png,gif,jpeg,jpg格式");
        }
        if(file.size >= 5*1024*1024){
            alert("文件太大，请先压缩")
            return
        }
        var files = $('#my_file').prop('files');
        var data = new FormData();
        data.append('file_logo', files[0]);
        $.ajax({
            url: '/upload',
            type: 'POST',
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function (mess) {
                if(mess.success){
                    $("#logo").attr('src', mess.mess)
                    $('.top').remove()
                    $("#logo").on('load', function () {
                         $.resize_img()
                    })

                }else{
                    alert(mess.mess)
                }
            },
            error: function (mess) {
                alert("上传文件失败，请稍后再试！")
            }
        });
    })


    $('#logo').on('mousedown', function (e) {
        e.preventDefault()
        let X = event.x, Y = event.y
        let img_X = $('#logo').offset().left, img_Y = $('#logo').offset().top
        function move() {
            // console.log(X-event.x, Y-event.y)
            let img_left = img_X+(event.x-X)
            let img_top = img_Y+(event.y-Y)
            // console.log(img_Y+(event.y-Y), event.y-Y)
            $('#logo').css('left', img_left+'px')
            $('#logo').css('top', img_top+'px')
            // console.log(event.x, event.y)
        }
        event.path[0].addEventListener('mousemove',move)
        $('#logo').on('mouseup', function () {
            event.path[0].removeEventListener("mousemove", move)
        })
    })


    $('#logo').bind('mousewheel', function (event) {
        const img = $('#logo');
        const ppp = img.width() / 1000;
        let w;
        if(event.deltaY>0||event.deltaX>0){
            w = img.width() + (event.deltaFactor * ppp)
        }else{
            w = img.width() - (event.deltaFactor * ppp)
        }
        if (w <= 10 || w >= 5000) {
            return
        }
        $('#logo').css('width', w+'px')

        $('#logo').css('height', 'auto')
        // console.log(this.img_style.width);
        return false;
    })

    $('#rotationAngle').on('change', function (e) {
        let number = $('#rotationAngle').val()
        route = number
        $('#logo').css('transform', 'rotate(-'+number+'deg)')
    })

    $('#submit').on('click', function () {
        if(!$('#logo').attr('src')){
            alert('请选择水印文件')
            return
        }
        // 计算小图缩小的比例
        const proportion = $('#full_img').width()/img_width
        // console.log(logo_width_now)
        // 计算logo相对于底图的位置
        const left = ($('#logo').offset().left-$('#full_img').offset().left)/proportion
        const top = ($('#logo').offset().top-$('#full_img').offset().top)/proportion
        const data = {
            full_image: $('#full_img').attr('src'),
            logo_image: $('#logo').attr('src'),
            x: left,
            y: top,
            route: route,
            width: $('#logo').width()/proportion,
            height: $('#logo').height()/proportion
        }
        // console.log(data)
        // $('#full_img').attr('name', '1')
        // $('#submit').text("下载")
        $('#submit').text("下载中……")
        $('#dwn_now').text("下载中……")
        $.ajax({
          　　  url:'/download_image',
          　　  type : 'post',
          　　  dataType:'json',
                headers: {
                    "Content-Type": "application/json;charset=utf-8"
                },
                contentType:'application/json; charset=utf-8',
                data:JSON.stringify(data),
          　　  success:function(data){
                  var x = new XMLHttpRequest();
                    x.open("GET", data.mess, true);
                    x.responseType = 'blob';
                    x.onload = function(e) {
                        download(x.response, $('#full_img').attr('alt'));
                        for(let i=0;i<$('.lazy').length;i++){
                            if($('.lazy')[i].src === $('#full_img').attr('src')){
                                $('.lazy')[i].src = data.mess
                            }
                        }
                        $('#submit').text("下载")
                        $('#dwn_now').text("直接下载")
                    }
                    x.send();
              }
        })
    })

    $('#dwn_now').on('click', function () {
        $.dwn($('#full_img').attr('src'), $('#full_img').attr('alt'))
    })

    $('#dwn_all').on('click', function () {

    })


    $.dwn = function (src, name) {
        $('#submit').text("下载中……")
        $('#dwn_now').text("下载中……")
        var x = new XMLHttpRequest();
        x.open("GET", src, true);
        x.responseType = 'blob';
        x.onload = function(e) {
            download(x.response, name);
            $('#submit').text("下载")
            $('#dwn_now').text("直接下载")
        }
        x.send();
    }


    try{
        function img_load() {
        $('.lazy')[0].click()
    }
    $('.lazy')[0].addEventListener('load',img_load)
    }catch (e) {

    }

})