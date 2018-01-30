# WIFI传书

 * 手机端的HttpServer采用开源项目[NanoHttpd](https://github.com/NanoHttpd/nanohttpd)实现的。
 * 网页端采用jQuery实现，文件上传采用XmlHttpRequest、jquery.form、ajax三种方式混合使用的。

## 手机端截图
<img src="./screenshot/phone.png"/>
## 网页版截图
<img src="./screenshot/web.gif"/>


## TODO
因使用gradle配置的时候还没最新的NanoHTTPD，所以使用了eclipse编译。使用HTML5浏览器文件进度是前端xhr的进度，使用非HTML5浏览器（如IE7/IE8/IE9）时候，文件上传进度是根据ajax获取的后台进度。
