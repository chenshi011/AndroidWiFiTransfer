# WIFI传书

 * 手机端的HttpServer采用开源项目[NanoHttpd](https://github.com/NanoHttpd/nanohttpd)实现的。
   针对NanoHttpd，其中org.nanohttpd.protocols.http.progress下面的内容为我添加的上传进度用的，原生的NanoHttpd并没有上传进度，UploadFile是更改了TempFile存储临时文件的过程，直接存到指定的目录下面。
   如果要使用原生的方式，注释掉HttpServer中的下面这句即可（也推荐使用这种方式）
```java
      setTempFileManagerFactory(new UploadFileManagerFactory());
```
   上传文件的Dispatcher部分可以看出，HTTPProgressSession是为了支持上传进度而稍微改动了HTTPSession：
```java   
  public Response handle(IHTTPSession session) {
		Map<String, String> files = new HashMap<String, String>();
		try {
			session.parseBody(files);
		} catch (IOException e) {
			e.printStackTrace();
			return Response.newFixedLengthResponse("Internal Error IO Exception: " + e.getMessage());
		} catch (ResponseException e) {
			e.printStackTrace();
			return Response.newFixedLengthResponse(e.getStatus(), NanoHTTPD.MIME_PLAINTEXT, e.getMessage());
		}
		if (!files.isEmpty()) {
			if (!(session instanceof HTTPProgressSession)) {
				Map<String, List<String>> params = session.getParameters();
				for (Entry<String, List<String>> entry : params.entrySet()) {
					final String paramsKey = entry.getKey();
					final List<String> fileNames = entry.getValue();
					final String tmpFilePath = files.get(paramsKey);
					if (!TextUtils.isEmpty(tmpFilePath)) {
						String fileName = paramsKey;
						if (fileNames != null && fileNames.size() > 0) {
							fileName = fileNames.get(fileNames.size() - 1);
						}
						final File tmpFile = new File(tmpFilePath);
						File dir = new File(Environment.getExternalStorageDirectory() + File.separator + DIR_IN_SDCARD);
						if (!dir.exists()) {
							dir.mkdirs();
						}
						final File targetFile = new File(dir, fileName);
						try {
							copyFile(tmpFile, targetFile);
						} catch (IOException e) {
							e.printStackTrace();
						}
					}
				}
			}
			return Response.newFixedLengthResponse("ok");
		}
		return Response.newFixedLengthResponse("404");
	}
```
 * 网页端采用jQuery实现，文件上传采用XmlHttpRequest、jquery.form、ajax三种方式混合使用的。

## 手机端截图
<img src="phone.png"/>

## 网页版截图
<img src="web.gif"/>

## 说明
基于NanoHTTPD做了细微的更改，都是添加文件的方式，没有直接更改库文件。
使用HTML5浏览器，文件进度是前端xhr的进度（支持批量上传）；
使用非HTML5浏览器（如IE7/IE8/IE9）时候，文件上传进度是根据ajax获取的后台进度（不支持批量上传）。

如果使用java工程的话，直接在main函数里面初始化httpServer然后start即可。
