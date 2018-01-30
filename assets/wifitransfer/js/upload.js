var isUploading = false;
var fileName;
var uploadQueue = [];
var currentQueueIndex = 0;
var allowFileTypes;
var filledRowIndex = 0;
var getProgressReties = 0;
var unloadPage = false;
var pollInterval;

$(window).bind('beforeunload',function(){
	unloadPage = true;
});

$(document).ready(function(){
	if (window.PIE) {
		PIE.attach(document.getElementById("upload_lbl"));  
    }
	if (isIEBelow(8)){
		$('.file_upload_warper .button').css('padding', '0');
	}
	updater.poll(); //长轮询
	fixDefTableRows();
	bindUpload('#upload_0');
	$.ajax({  
	    url:"/getDeviceInfo",  
	    type: "GET",  
	    dataType: "json",  
	    contentType: "application/json;charset=utf-8",
	    success: function(data){  
	    	//console.log("getDeviceInfo success...");
	    	$(".content .notify").html(data.device_notify);  
	    	$(".choice-file .desc").html(data.device_desc);  
	    },  
	    error: function()   
	    {  
	    	//console.log("getDeviceInfo failed...");  
	    }  
	});    
});

function fixDefTableRows() {
	for (var i = 0; i < CONSTANTS.TABLE_DEF_ROWS; i++){
		tbodyAppendTr("table_body", i,"","","");
	}
}

function isIEBelow(v) {
     return /MSIE\s/.test(navigator.userAgent) && parseFloat(navigator.appVersion.split("MSIE")[1]) < v;
}

function tbodyAppendTr(tbodyid, rowIndex, col1,col2,col3) {
	$("#"+tbodyid).append("<tr><td>"+col1+"</td><td>"+col2+"</td><td>"+col3+"</td></tr>");   
	if (isIEBelow(10)){
		var tr = $("#"+tbodyid).find("tr").eq(rowIndex);
		tr.css("background-color",(rowIndex%2==0)? "#efefef":"#dbdbdb");
	}
}

function getUploadProgress() {
	var time = new Date().getTime();
	var url = 'upload?' + time;
	$.getJSON(url, function(data) {
		if (!data) {
			getProgressReties ++
			if (getProgressReties < 5) {
				setTimeout(getUploadProgress, CONSTANTS.AJAX_PROGRESS_RETRY);
				return;
			} else {
				//alert(STRINGS.USE_ONE_BROWSER);
			}
		}
		if (data.size && data.total){
			fillTableprogress3("table_files", fileName, data.size , data.total);
			if (data.size / data.total < 1) {
				setTimeout(getUploadProgress, CONSTANTS.AJAX_PROGRESS_INTERVAL);
			}
		}
	});
}

function bindUpload(fileSelector) {
	$(fileSelector).unbind();
	$(fileSelector).change(function() {
		if (this.files) {
			var filterF = filterFiles(this.files, $(fileSelector).attr("accept"));
			if (filterF.length > CONSTANTS.MAX_FILES){
				alert(CONSTANTS.FILES_MUCH );
				return;
			}
			//h5 XmlHttpRequest
			if (uploadFileByXHR('table_files', filterF,'/upload')){
				return;
			}
		}
		var files = getFiles();
	    if (files) {
			var filterF = filterFiles(files, $(fileSelector).attr("accept"));
			if (filterF.length > CONSTANTS.MAX_FILES){
				alert(CONSTANTS.FILES_MUCH );
				return;
			}
			//form
			uploadFileByform('table_files', filterF,'/upload');
			return;
		}
	    fileName = $(this).val();
		var arr = fileName.split("\\");
		fileName = arr[arr.length - 1];
	    //ajax
	    uploadQueue.push(fileSelector);
		$('#form').append('<input type="file" name=""upload"" value="" id="upload_' + uploadQueue.length + '" class="fileupload" />');
		$('#upload_lbl').attr('for', 'upload_' + uploadQueue.length);
		bindUpload('#upload_' + uploadQueue.length);
		uploadFileByAjax();
	});
}

var updater = {
	    poll: function(){
	        $.ajax({url: "/longpolling",
	                type: "POST",
	                dataType: "text",
	                success: updater.onSuccess,
	                error: updater.onError});
	    },
	    onSuccess: function(data, dataStatus){
	    	pollInterval = window.setTimeout(updater.poll, 100);
	    },
	    onError: function(){
			if (document.location.protocol.indexOf("http") <= - 1){
				return;
			}
	        log("Poll error;");
	        if(!unloadPage){
	        	alert(CONSTANTS.SERVER_DISCON);	
	        }
	        if (pollInterval){
	        	clearTimeout(pollInterval);
	        }
	        window.location.reload(); 
	    }
	};

String.prototype.replaceAll  = function(s1,s2){     
    return this.replace(new RegExp(s1,"gm"),s2);     
} 

function uploadFileByform(tableId, files, url) {
	var dataArray = { };
	for (var i = 0; i < files.length; i++){
		dataArray['file['+i+']'] = encodeURI(files[i].name);
	}
	$("#form").attr("action", "/upload");
    $("#form").ajaxSubmit({  
    	contentType : "application/x-www-form-urlencoded; charset=UTF-8",
    	type: 'post',
    	data: dataArray,
    	beforeSerialize:function(){
            //alert("表单数据序列化前执行的操作！");
            //$("#txt2").val("java");//如：改变元素的值
        },
        beforeSubmit:function(){
            if(files.length > CONSTANTS.MAX_FILES){
    			alert("一次最多选取10个！");
    			return;
    		}
        },
        beforeSend: function() {
        	for (var i = 0; i < files.length; i++){
    			var f = files[i];
				addTr(tableId, -1, f.name, formatBytes(f.size));
    		}
        },
        uploadProgress: function(event, position, total, percentComplete) {//上传的过程
			log("onprogress percentComplete:" + percentComplete + ";position:" + position + ";total:" + total);
			fillTableprogress2(tableId, files, percentComplete, total);
        },
        success: function(data) {//成功
        	fillTableStatus(tableId, true);
        },
        error:function(err){//失败
            alert("表单提交异常！"+err.msg);
            fillTableStatus(tableId, false);
        },
        complete: function(xhr) {//完成
        	log(xhr.responseText);
        	$('#form').clearForm();
        }
    });  
}

function uploadFileByAjax() {
	if (isUploading || currentQueueIndex >= uploadQueue.length) {
		return;
	}
	isUploading = true;
	var eleFile = $(uploadQueue[currentQueueIndex]);
	var eleFileId = eleFile.attr('id');
	var fileName = eleFile.val();
	var arr = fileName.split("\\");
	fileName = arr[arr.length - 1];
	addTr('table_files', -1, fileName, "--");
	currentQueueIndex ++;
	$.ajaxFileUpload({
		url:'upload',
		data:{"fileName":encodeURI(fileName)},
		secureuri:false,
		fileElementId:eleFileId,
		dataType: 'text',
		success: function (data, status) {
			isUploading = false;
			fillTableStatus('table_files', true);
			uploadFileByAjax();
		},
		error: function (data, status, e) {
			isUploading = false;
			fillTableStatus('table_files', false);
			uploadFileByAjax();
		}
	});
	setTimeout(getUploadProgress, CONSTANTS.AJAX_PROGRESS_INTERVAL);
}

function uploadFileByXHR(tableId, files, url) {
	if (files && files.length > 0) {     
		var fd = new FormData();
		var fArray = new Array();
		var fSize = 0;
		for (var i = 0; i < files.length; i++){
			var f = files[i];
			fd.append("file["+i+"]", f);
			fArray.push([f.name, f.size]);
			fSize += f.size;
			addTr(tableId, -1, f.name, formatBytes(f.size));
		}
		var xhr = createXmlHttpRequest();
		if (xhr == null ){
			log("Your browser does not support XMLHTTP.");
			return false;
		}
		//xhr.timeout = 5000;
		//设置响应返回的数据格式
		//注册相关事件回调处理函数
		xhr.onload = function(e) { 
			 if (xhr.status === 200) {
			　　  log('上传成功');
			 	fillTableStatus(tableId, true);
			 } else {
			    log('上传出错');
			    fillTableStatus(tableId, false);
			 }
		  };
		xhr.ontimeout = function(e) {
			log("ontimeout");
			fillTableStatus(tableId, false);
		};
		xhr.onerror = function(e) { 
			log("onerror");
			fillTableStatus(tableId, false);
		};
		xhr.upload.onprogress = function(e) { 
			var loaded = e.loaded;//已经上传大小情况
			var total = e.total;//附件总大小
			var files = fArray;
			var per = Math.floor(100 * loaded / total);  //已经上传的百分比，如35
			log("onprogress per:" + per + ";loaded:" + loaded + ";total:" + total);
			if (e.lengthComputable) {
				fillTableprogress(tableId, files, fSize, loaded, total);
			}
		};
		xhr.onreadystatechange = function () {
			if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
				try{
					var data = JSON.parse(xhr.responseText);
					if (data.code == 0) {
						log("onreadystatechange success...");
						fillTableStatus(tableId, true);
					}
					else {
						log("onreadystatechange failed...");
						fillTableStatus(tableId, false);
					}
				}catch(err){
					
				}
			}else{
				log("not ready");
			}
		}
		var nowTime = new Date().getTime();//获取当前时间作为随机数
        url += "?timeStamp="+nowTime;
		xhr.open('POST', url, true);
		xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
		xhr.send(fd);
		return true;
	}
	return false;
}

function createXmlHttpRequest(){
	var xmlhttp;
	if (window.XMLHttpRequest){
	   // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}else if (window.ActiveXObject){
		// code for IE6, IE5
	   xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	return xmlhttp;
}


function equals(fileName, fileSize){
	var equals = false;
	var trList = $("#table_body").children("tr");
	for (var i= 0; i < trList.length; i++) {
		var tdArr = trList.eq(i).find("td");
		if (tdArr.parent() && tdArr.parent().length >0 && tdArr.parent()[0].rowIndex > 0){ 
			equals = tdArr.eq(0)[0].innerText == fileName && tdArr.eq(1)[0].innerText == fileSize;
		    if (equals){
		    	break;
		    }
	    }
	}
	return equals;
}

function addTr(tbody, row, fileName, fileSize){
   if(!equals(fileName, fileSize)){
	   if (filledRowIndex < 5){
		   var tr = $("#"+tbody).find("tr").eq(filledRowIndex + 1);
		   tr.find("td").eq(0)[0].innerText = fileName;
		   tr.find("td").eq(1)[0].innerText = fileSize;
		   tr.find("td").eq(2)[0].innerText = CONSTANTS.UPLOAD_WAIT;
		   //tr[0].innerHTML = "<td>"+ fileName +"</td><td>"+ fileSize +"</td><td>"+CONSTANTS.UPLOAD_WAIT+"</td>";
	   }else{ 
		   tbodyAppendTr("table_body", filledRowIndex, fileName, fileSize,CONSTANTS.UPLOAD_WAIT);
	   }
	    filledRowIndex++;
   }else{
	   log("equals row:" + row + ",fileName:" + fileName + ",fileSize:" + fileSize);
   }
}

/**
 * 修改table内容
 *
 * tab 表id
 * columnIndex 列
 * success 
 *
 */
function fillTableStatus(tab, success){
	$("#"+tab).find("tr").each(function(){
        var tdArr = $(this).children();
        if (tdArr.parent() && tdArr.parent().length >0 && tdArr.parent()[0].rowIndex > 0){ 
		    var tr = tdArr.parent()[0];
			if (tr.rowIndex > 0){
				if(filledRowIndex < CONSTANTS.TABLE_DEF_ROWS){
					if(tr.rowIndex < filledRowIndex + 1){
						tdArr.eq(CONSTANTS.COLUMN_INDEX)[0].innerText = success ? CONSTANTS.UPLOAD_SUCCESSED : CONSTANTS.UPLOAD_FAILED;
					}
				}else{
					tdArr.eq(CONSTANTS.COLUMN_INDEX)[0].innerText = success ? CONSTANTS.UPLOAD_SUCCESSED : CONSTANTS.UPLOAD_FAILED;
				}
			}
        }
    });
}

function fillTableprogress2(tab, files, percentComplete, total){
	var realLoad = percentComplete *  total / 100 ;
	var tmp = 0;
	for (var row = 0; row < files.length; row ++){
		tmp += files[row].size;
		if (tmp <= realLoad){
			var td = $("#"+tab).find("tr").eq(row + 1).find("td").eq(CONSTANTS.COLUMN_INDEX);
			if (td && td.length > 0){
				td[0].innerText = CONSTANTS.UPLOAD_SUCCESSED;
			}
		}else{
			var per = 100 - Math.floor(100 * (tmp - realLoad) / files[row].size);  
			if (per > 0){
				var td = $("#"+tab).find("tr").eq(row + 1).find("td").eq(CONSTANTS.COLUMN_INDEX);
				if (td && td.length > 0){
					td[0].innerText = per + "%";
				}
			}
		}
	}
}

function findTdByFileName(tab, fileName){
	var trs = $("#"+tab).find("tr");
	var td;
	for (var i = 0; i < trs.length; i ++){
		var tmptd = trs.eq(i).find("td").eq(0);
		if (tmptd && tmptd.length > 0 && tmptd[0].outerText == fileName){
			td = trs.eq(i).find("td").eq(CONSTANTS.COLUMN_INDEX)
			break;
		}
	}
	return td;
}

function fillTableprogress3(tab, fileName, loaded , total){
	var trs = $("#"+tab).find("tr");
	var tdName;
	var tdSize;
	for (var i = 0; i < trs.length; i ++){
		var tmptd = trs.eq(i).find("td").eq(0);
		if (tmptd && tmptd.length > 0 && tmptd[0].outerText == fileName){
			tdName = trs.eq(i).find("td").eq(CONSTANTS.COLUMN_INDEX);
			tdSize = trs.eq(i).find("td").eq(1);
			break;
		}
	}
	if (tdName && tdName.length > 0){
		if (tdSize && tdSize.length > 0){
			tdSize[0].innerText = formatBytes(total);
		}
		if (loaded >= total){
			tdName[0].innerText = CONSTANTS.UPLOAD_SUCCESSED;
		}else{
			var per = Math.floor(100 * loaded / total);  
			if (per > 0){
				tdName[0].innerText = per + "%";
			}
		}
	}
}

function fillTableprogress(tab, files, fSize, loaded, total){
	var realLoad = fSize * loaded / total;
	var tmpSize = 0;
	var tmpName = "";
	for (var row = 0; row < files.length; row ++){
		tmpName = files[row][0];
		tmpSize += files[row][1];
		var trs = $("#"+tab).find("tr");
		var td = findTdByFileName(tab, tmpName);
		if (tmpSize <= realLoad){
			if (td && td.length > 0){
				td[0].innerText = CONSTANTS.UPLOAD_SUCCESSED;
			}
		}else{
			var per = 100 - Math.floor(100 * (tmpSize - realLoad) / files[row][1]);  
			if (per > 0){
				if (td && td.length > 0){
					td[0].innerText = per + "%";
				}
			}
		}
	}
}

function formatBytes(bytes,decimals) {
   if (bytes == 0) return '0 B';
   var k = 1024,
       dm = decimals || 2,
       sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
       i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


function getFiles() {
	var file = $("input[type='file']"); 
	if (file && file.length && file.length > 0){
		return file[0].files;
	}else{
		return null;
	}
}

function filterFiles(files, allowFileTypes) {
	var result = new Array();
	for (var i = 0; i < files.length; i++){
		var f = files[i];
		if (checkFileType(allowFileTypes, f.name)){
			result.push(f); 
		}
	}
	return result;
}


//检查文件类型是否合法
function checkFileType(allowFileTypes, fileName) {
  if (!allowFileTypes) {
      return true;
  }
  if (!fileName || fileName.indexOf('.') < 1) {
      return false;
  }
  var extension = fileName.substring(fileName.lastIndexOf('.'), fileName.length).toLowerCase();
  allowFileTypes = allowFileTypes.toLowerCase();
  if (allowFileTypes.indexOf(extension) > -1) {
      return true;
  }
  return false;
}

//检查文件大小是否合法
function checkFileSize(allowSize, fileSize) {
  if (!allowSize || typeof (allowSize) != "number") {
      return true;
  }
  if (fileSize <= allowSize) {
      return true;
  }
  return false;
}

function log(msg){
	if (CONSTANTS.DEBUG) console.log(msg);
}